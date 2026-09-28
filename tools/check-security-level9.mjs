import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const envPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(raiz, "backend", ".env");

function parseEnv(texto) {
  const resultado = {};
  for (const linhaOriginal of texto.split(/\r?\n/)) {
    const linha = linhaOriginal.trim();
    if (!linha || linha.startsWith("#")) continue;
    const indice = linha.indexOf("=");
    if (indice < 1) continue;
    const chave = linha.slice(0, indice).trim();
    let valor = linha.slice(indice + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    resultado[chave] = valor;
  }
  return resultado;
}

function falhar(mensagem) {
  console.error(`[NÍVEL 9][FALHA] ${mensagem}`);
  process.exitCode = 1;
}

if (!fs.existsSync(envPath)) {
  falhar("backend/.env não encontrado. Execute CONFIGURAR_PRODUCAO_NIVEL9.ps1.");
  process.exit();
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const sim = valor => ["1", "true", "on", "yes", "sim"].includes(String(valor || "").toLowerCase());
const placeholder = valor => /(COLOQUE|SENHA|CHAVE_|SEU-DOMINIO|EXEMPLO|ALTERE)/i.test(String(valor || ""));
const chave32 = valor => /^[a-f0-9]{64}$/i.test(valor || "") || (() => {
  try { return Buffer.from(valor || "", "base64").length === 32; } catch { return false; }
})();

if (env.NODE_ENV !== "production") falhar("NODE_ENV deve ser production.");
if (env.SECURITY_PROFILE !== "level9") falhar("SECURITY_PROFILE deve ser level9.");
if (!sim(env.ENFORCE_HTTPS)) falhar("ENFORCE_HTTPS deve estar ativo.");
if (!sim(env.ADMIN_MFA_REQUIRED)) falhar("ADMIN_MFA_REQUIRED deve estar ativo.");
if ((env.JWT_SECRET || "").length < 64 || placeholder(env.JWT_SECRET)) falhar("JWT_SECRET precisa ser aleatório e ter 64+ caracteres.");
if (!chave32(env.SENSITIVE_DATA_KEY) || placeholder(env.SENSITIVE_DATA_KEY)) falhar("SENSITIVE_DATA_KEY inválida.");
if ((env.FACE_API_KEY || "").length < 32 || placeholder(env.FACE_API_KEY)) falhar("FACE_API_KEY inválida.");
if ((env.MONITORING_TOKEN || "").length < 32 || placeholder(env.MONITORING_TOKEN)) falhar("MONITORING_TOKEN inválido.");
if (!env.REDIS_URL || placeholder(env.REDIS_URL)) falhar("REDIS_URL segura é obrigatória.");
if (!env.EMAIL_USER || !env.EMAIL_APP_PASSWORD || placeholder(env.EMAIL_APP_PASSWORD)) falhar("MFA por e-mail não está configurado.");
if (!env.DATABASE_URL || placeholder(env.DATABASE_URL)) falhar("DATABASE_URL real é obrigatória.");

for (const origem of String(env.CORS_ORIGINS || "").split(",").map(item => item.trim()).filter(Boolean)) {
  if (!origem.startsWith("https://")) falhar(`Origem CORS sem HTTPS: ${origem}`);
}

const faceUrl = String(env.FACE_API_URL || "");
if (!faceUrl.startsWith("https://") && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(faceUrl)) {
  falhar("FACE_API_URL deve usar HTTPS ou loopback local.");
}

const caddyPath = path.join(raiz, "deploy", "Caddyfile");
if (!fs.existsSync(caddyPath)) falhar("deploy/Caddyfile não foi gerado.");

if (!process.exitCode) {
  console.log("[NÍVEL 9] CONFIGURAÇÃO APROVADA — HTTPS, MFA, Redis, criptografia e monitoramento habilitados.");
}

