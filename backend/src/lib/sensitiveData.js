import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const AAD = Buffer.from("steelcontrol:sensitive-json:v1", "utf8");

function resolveKey() {
  const configured = String(process.env.SENSITIVE_DATA_KEY || "").trim();
  if (/^[a-f0-9]{64}$/i.test(configured)) {
    return Buffer.from(configured, "hex");
  }
  if (configured) {
    const decoded = Buffer.from(configured, "base64");
    if (decoded.length === 32) return decoded;
    throw new Error("SENSITIVE_DATA_KEY deve conter 32 bytes em Base64 ou 64 caracteres hexadecimais.");
  }

  // Somente desenvolvimento: mantém os testes funcionais e evita texto puro.
  // Produção nunca chega aqui porque env.js exige uma chave independente.
  return createHash("sha256")
    .update(`steelcontrol-dev:${process.env.JWT_SECRET || "test-only-development-key"}`)
    .digest();
}

export function criptografarJsonSensivel(value) {
  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return {
    encrypted: true,
    version: 1,
    algorithm: "A256GCM",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

export function descriptografarJsonSensivel(value) {
  if (!value || typeof value !== "object" || value.encrypted !== true) {
    return value;
  }
  if (
    value.version !== 1 ||
    value.algorithm !== "A256GCM" ||
    !value.iv || !value.tag || !value.ciphertext
  ) {
    throw new Error("Envelope de dado sensível inválido.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    resolveKey(),
    Buffer.from(value.iv, "base64")
  );
  decipher.setAAD(AAD);
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
