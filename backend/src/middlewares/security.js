import { redisRateLimit } from "../lib/redisStore.js";
import { markRateLimited, securityEvent } from "../lib/monitoring.js";

const level9Ativo = () =>
  String(process.env.SECURITY_PROFILE || "").trim().toLowerCase() === "level9";

const buckets = new Map();
let ultimaLimpeza = 0;

function limparBucketsExpirados(agora) {
  if (
    agora - ultimaLimpeza < 60_000
  ) {
    return;
  }

  for (
    const [chave, item]
    of buckets.entries()
  ) {
    if (
      !item ||
      item.expiraEm <= agora
    ) {
      buckets.delete(chave);
    }
  }

  ultimaLimpeza = agora;
}

function chaveRequisicao(req, prefixo) {
  // Não confiamos diretamente em X-Forwarded-For, pois esse cabeçalho
  // pode ser falsificado quando a API está exposta sem proxy confiável.
  // Em produção atrás de reverse proxy, configure `trust proxy` no Express.
  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const email =
    String(
      req.body?.email ||
      req.body?.administrador?.email ||
      ""
    )
      .trim()
      .toLowerCase();

  return `${prefixo}:${ip}:${email}`;
}

export function securityHeaders(req, res, next) {
  const noncePolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src https://www.google.com https://maps.google.com",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https: wss:"
  ].join("; ");

  res.setHeader("Content-Security-Policy", noncePolicy);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), geolocation=(), microphone=(), payment=(), usb=()"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Origin-Agent-Cluster", "?1");

  if (req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
}

export function enforceHttps(req, res, next) {
  const remoteAddress = String(req.socket?.remoteAddress || "");
  const localLiveness = req.path === "/api/health/live" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remoteAddress);
  if (localLiveness) return next();
  if (!req.app?.get("trust proxy") && req.socket?.encrypted) return next();
  if (req.secure || !req.app?.locals?.enforceHttps) return next();

  if (["GET", "HEAD"].includes(req.method) && req.get("host")) {
    return res.redirect(308, `https://${req.get("host")}${req.originalUrl}`);
  }

  return res.status(426).json({
    codigo: "HTTPS_REQUIRED",
    mensagem: "Esta operação exige uma conexão HTTPS segura."
  });
}

export function csrfCookieGuard(req, res, next) {
  if (!req.auth || req.authTransport !== "cookie") return next();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.get("origin");
  const host = req.get("host");
  const expected = host ? `${req.protocol}://${host}` : "";
  const allowedOrigins = new Set([
    expected,
    ...(Array.isArray(req.app?.locals?.corsOrigins)
      ? req.app.locals.corsOrigins
      : [])
  ].filter(Boolean));
  const fetchSite = String(req.get("sec-fetch-site") || "").toLowerCase();

  if (
    (origin && !allowedOrigins.has(origin)) ||
    (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
  ) {
    return res.status(403).json({
      codigo: "CSRF_BLOCKED",
      mensagem: "Origem da operação não autorizada."
    });
  }

  return next();
}

export function criarRateLimit({
  janelaMs = 60_000,
  limite = 60,
  prefixo = "geral",
  mensagem = "Muitas tentativas. Aguarde um pouco e tente novamente."
} = {}) {
  return function rateLimit(req, res, next) {
    const agora = Date.now();

    limparBucketsExpirados(agora);

    const chave = chaveRequisicao(req, prefixo);

    const localLimit = () => {
      const atual = buckets.get(chave);

      if (!atual || atual.expiraEm <= agora) {
        buckets.set(chave, {
          quantidade: 1,
          expiraEm: agora + janelaMs
        });
        return next();
      }

      atual.quantidade += 1;

      if (atual.quantidade > limite) {
        const retryAfter = Math.max(1, Math.ceil((atual.expiraEm - agora) / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        markRateLimited();
        securityEvent("rate_limit", { prefixo, ip: req.ip });
        return res.status(429).json({ mensagem, retryAfter });
      }

      return next();
    };

    if (!String(process.env.REDIS_URL || "").trim()) {
      return localLimit();
    }

    return redisRateLimit(chave, janelaMs)
      .then(distributed => {
        if (!distributed) {
          if (level9Ativo()) {
            securityEvent("redis_unavailable", { prefixo, ip: req.ip });
            return res.status(503).json({ mensagem: "Proteção distribuída temporariamente indisponível." });
          }
          return localLimit();
        }
        if (distributed.quantidade <= limite) return next();

        const retryAfter = Math.max(1, Math.ceil(distributed.restanteMs / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        markRateLimited();
        securityEvent("rate_limit", { prefixo, ip: req.ip });
        return res.status(429).json({ mensagem, retryAfter });
      })
      .catch(() => {
        if (level9Ativo()) {
          securityEvent("redis_unavailable", { prefixo, ip: req.ip });
          return res.status(503).json({ mensagem: "Proteção distribuída temporariamente indisponível." });
        }
        return localLimit();
      });
  };
}
