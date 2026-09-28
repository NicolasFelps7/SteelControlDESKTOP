import "dotenv/config";

function texto(nome) {
  return String(
    process.env[nome] || ""
  ).trim();
}

function obrigatoria(nome) {
  const valor =
    texto(nome);

  if (!valor) {
    throw new Error(
      `Variável obrigatória ausente: ${nome}. Configure as variáveis de ambiente antes de iniciar o backend.`
    );
  }

  return valor;
}

const nodeEnv =
  texto("NODE_ENV") ||
  "development";

const securityProfile =
  texto("SECURITY_PROFILE").toLowerCase() ||
  (nodeEnv === "production" ? "standard" : "development");

const level9 = securityProfile === "level9";

const jwtSecret =
  obrigatoria(
    "JWT_SECRET"
  );

if (
  jwtSecret.length < 32
) {
  throw new Error(
    "JWT_SECRET deve possuir pelo menos 32 caracteres. Use uma chave longa e aleatória."
  );
}

if (level9 && jwtSecret.length < 64) {
  throw new Error(
    "SECURITY_PROFILE=level9 exige JWT_SECRET com pelo menos 64 caracteres."
  );
}

const port =
  Number(
    process.env.PORT ||
    3000
  );

if (
  !Number.isInteger(port) ||
  port <= 0 ||
  port > 65535
) {
  throw new Error(
    "PORT inválida."
  );
}

const databaseUrl =
  obrigatoria(
    "DATABASE_URL"
  );

const emailUser =
  texto("EMAIL_USER") ||
  texto("GMAIL_USER") ||
  texto("MAIL_USER");

const smtpHost = texto("SMTP_HOST");
const smtpPort = Math.max(1, Math.min(65535, Number(process.env.SMTP_PORT || 587) || 587));
const smtpSecure = ["1", "true", "on", "yes", "sim"].includes(texto("SMTP_SECURE").toLowerCase());

// O Google exibe a senha de app normalmente em grupos separados por
// espaços. Nodemailer deve receber apenas os 16 caracteres. Também
// aceitamos aliases usados por versões antigas do projeto.
const emailAppPassword =
  (
    texto("EMAIL_APP_PASSWORD") ||
    texto("GMAIL_APP_PASSWORD") ||
    texto("EMAIL_PASS") ||
    texto("MAIL_PASS")
  ).replace(/\s+/g, "");

if (
  Boolean(emailUser) !==
  Boolean(emailAppPassword)
) {
  throw new Error(
    "Configure EMAIL_USER e EMAIL_APP_PASSWORD juntos (ou os aliases GMAIL_USER/GMAIL_APP_PASSWORD)."
  );
}

const faceApiUrl =
  texto("FACE_API_URL") ||
  (
    nodeEnv === "production"
      ? ""
      : "http://127.0.0.1:8000"
  );

if (
  nodeEnv === "production" &&
  !faceApiUrl
) {
  throw new Error(
    "FACE_API_URL é obrigatória em produção. Informe a URL pública/privada da Face API."
  );
}

const faceApiKey =
  texto("FACE_API_KEY");

const sensitiveDataKey =
  texto("SENSITIVE_DATA_KEY");

const sensitiveDataKeyValida = (() => {
  if (!sensitiveDataKey) return false;
  if (/^[a-f0-9]{64}$/i.test(sensitiveDataKey)) return true;
  try {
    return Buffer.from(sensitiveDataKey, "base64").length === 32;
  } catch {
    return false;
  }
})();

if (sensitiveDataKey && !sensitiveDataKeyValida) {
  throw new Error(
    "SENSITIVE_DATA_KEY deve conter 32 bytes em Base64 ou 64 caracteres hexadecimais."
  );
}

if (nodeEnv === "production" && !sensitiveDataKeyValida) {
  throw new Error(
    "SENSITIVE_DATA_KEY é obrigatória em produção para criptografar biometria e dados sensíveis."
  );
}

if (
  nodeEnv === "production" &&
  faceApiKey.length < 32
) {
  throw new Error(
    "FACE_API_KEY deve possuir pelo menos 32 caracteres em produção."
  );
}

if (
  nodeEnv === "production" &&
  (!emailUser || !emailAppPassword)
) {
  throw new Error(
    "O cadastro por código exige EMAIL_USER e EMAIL_APP_PASSWORD em produção."
  );
}

const redisUrl = texto("REDIS_URL");
const monitoringToken = texto("MONITORING_TOKEN");

if (level9) {
  if (nodeEnv !== "production") {
    throw new Error("SECURITY_PROFILE=level9 só pode ser usado com NODE_ENV=production.");
  }
  if (!redisUrl) {
    throw new Error("SECURITY_PROFILE=level9 exige REDIS_URL para proteção distribuída.");
  }
  if (monitoringToken.length < 32) {
    throw new Error("SECURITY_PROFILE=level9 exige MONITORING_TOKEN com pelo menos 32 caracteres.");
  }
}


const discoveryPort =
  Math.max(
    1024,
    Math.min(
      65535,
      Number(process.env.DISCOVERY_PORT || 4210) || 4210
    )
  );

const discoveryEnabled =
  !["0", "false", "off", "no"].includes(
    texto("DISCOVERY_ENABLED").toLowerCase()
  );

const discoveryAdvertiseUrl =
  texto("DISCOVERY_ADVERTISE_URL");

const booleano = (nome, padrao = false) => {
  const valor = texto(nome).toLowerCase();
  if (!valor) return padrao;
  return ["1", "true", "on", "yes", "sim"].includes(valor);
};

const enforceHttps = booleano("ENFORCE_HTTPS", nodeEnv === "production");
const adminMfaRequired = booleano("ADMIN_MFA_REQUIRED", nodeEnv === "production");
const sessionCookieMaxAgeMs = Math.max(
  5 * 60 * 1000,
  Number(process.env.SESSION_COOKIE_MAX_AGE_MS || 30 * 60 * 1000) ||
    30 * 60 * 1000
);

const corsPadrao =
  nodeEnv === "production"
    ? ""
    : "http://127.0.0.1:5500,http://localhost:5500";

const corsOrigins = String(process.env.CORS_ORIGINS ?? corsPadrao)
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

if (level9) {
  if (!enforceHttps) {
    throw new Error("SECURITY_PROFILE=level9 exige ENFORCE_HTTPS=true.");
  }
  if (!adminMfaRequired) {
    throw new Error("SECURITY_PROFILE=level9 exige ADMIN_MFA_REQUIRED=true.");
  }
  if (sessionCookieMaxAgeMs > 30 * 60 * 1000) {
    throw new Error("SECURITY_PROFILE=level9 limita a sessão desktop a 30 minutos.");
  }
  if (corsOrigins.some(origem => !origem.startsWith("https://"))) {
    throw new Error("SECURITY_PROFILE=level9 aceita apenas origens CORS HTTPS.");
  }
}

export const env = {
  port,
  nodeEnv,
  securityProfile,
  level9,
  databaseUrl,
  jwtSecret,

  jwtExpiresIn:
    texto("JWT_EXPIRES_IN") ||
    "30m",

  sessionCookieMaxAgeMs,

  enforceHttps,

  emailUser,
  emailAppPassword,
  smtpHost,
  smtpPort,
  smtpSecure,

  emailFrom:
    texto("EMAIL_FROM") ||
    (
      emailUser
        ? `SteelControl <${emailUser}>`
        : ""
    ),

  faceApiUrl:
    faceApiUrl.replace(
      /\/$/,
      ""
    ),

  faceApiKey,
  sensitiveDataKey,

  faceApiTimeoutMs:
    Math.max(
      5000,
      Number(
        process.env.FACE_API_TIMEOUT_MS ||
        60000
      ) || 60000
    ),

  corsOrigins,

  discoveryPort,
  discoveryEnabled,
  discoveryAdvertiseUrl,

  deviceCommandLeaseMs:
    Math.max(
      5000,
      Number(
        process.env.DEVICE_COMMAND_LEASE_MS ||
        15000
      ) || 15000
    ),

  redisUrl,

  monitoringToken,

  adminMfaRequired
};
