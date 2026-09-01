import crypto from "crypto";

export function gerarDeviceKey() {
  return `scd_${crypto.randomBytes(24).toString("base64url")}`;
}

export function hashDeviceKey(chave) {
  return crypto
    .createHash("sha256")
    .update(String(chave || ""), "utf8")
    .digest("hex");
}

export function deviceKeyHint(chave) {
  const valor = String(chave || "");
  return valor ? `••••••${valor.slice(-6)}` : null;
}

export function compararDeviceKey(chave, hashEsperado) {
  if (!chave || !hashEsperado) {
    return false;
  }

  const recebido = Buffer.from(hashDeviceKey(chave), "hex");
  const esperado = Buffer.from(String(hashEsperado), "hex");

  if (recebido.length !== esperado.length) {
    return false;
  }

  return crypto.timingSafeEqual(recebido, esperado);
}
