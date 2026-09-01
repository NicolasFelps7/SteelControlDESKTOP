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
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), geolocation=(), microphone=(), payment=(), usb=()"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  next();
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
    const atual = buckets.get(chave);

    if (
      !atual ||
      atual.expiraEm <= agora
    ) {
      buckets.set(chave, {
        quantidade: 1,
        expiraEm: agora + janelaMs
      });

      return next();
    }

    atual.quantidade += 1;

    if (atual.quantidade > limite) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (atual.expiraEm - agora) / 1000
          )
        );

      res.setHeader(
        "Retry-After",
        String(retryAfter)
      );

      return res
        .status(429)
        .json({
          mensagem,
          retryAfter
        });
    }

    next();
  };
}
