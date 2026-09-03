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
  texto("EMAIL_USER");

const emailAppPassword =
  texto(
    "EMAIL_APP_PASSWORD"
  );

if (
  Boolean(emailUser) !==
  Boolean(emailAppPassword)
) {
  throw new Error(
    "Configure EMAIL_USER e EMAIL_APP_PASSWORD juntos."
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

const corsPadrao =
  nodeEnv === "production"
    ? ""
    : "http://127.0.0.1:5500,http://localhost:5500";

export const env = {
  port,
  nodeEnv,
  databaseUrl,
  jwtSecret,

  jwtExpiresIn:
    texto("JWT_EXPIRES_IN") ||
    "8h",

  emailUser,
  emailAppPassword,

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

  faceApiTimeoutMs:
    Math.max(
      5000,
      Number(
        process.env.FACE_API_TIMEOUT_MS ||
        60000
      ) || 60000
    ),

  corsOrigins:
    String(
      process.env.CORS_ORIGINS ??
      corsPadrao
    )
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean),

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
    )
};
