import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const erros = [];
const avisos = [];

function arquivosRecursivos(dir, extensoes = null) {
  const saida = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "__pycache__", "venv", ".venv"].includes(item.name)) {
      continue;
    }

    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      saida.push(...arquivosRecursivos(full, extensoes));
      continue;
    }

    if (!extensoes || extensoes.some(ext => item.name.endsWith(ext))) {
      saida.push(full);
    }
  }

  return saida;
}

const js = [
  ...arquivosRecursivos(path.join(root, "backend", "src"), [".js", ".mjs"]),
  ...arquivosRecursivos(path.join(root, "frontend", "assets", "js"), [".js", ".mjs"]),
  ...arquivosRecursivos(path.join(root, "tools"), [".js", ".mjs"])
].filter(file => file !== __filename);

for (const file of js) {
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) {
    erros.push(`Sintaxe JavaScript inválida: ${path.relative(root, file)}\n${check.stderr}`);
  }
}

const frontendJs = arquivosRecursivos(path.join(root, "frontend", "assets", "js"), [".js"]);
for (const file of frontendJs) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);

  if (rel.endsWith(path.join("assets", "js", "config.js"))) {
    continue;
  }

  if (/http:\/\/(localhost|127\.0\.0\.1):3000/.test(text)) {
    erros.push(`URL fixa do backend encontrada em ${rel}.`);
  }

  if (/127\.0\.0\.1:8000|localhost:8000|FACE_API_URL/.test(text)) {
    erros.push(`Frontend ainda acessa Face API diretamente em ${rel}.`);
  }
}

const schema = fs.readFileSync(path.join(root, "backend", "prisma", "schema.prisma"), "utf8");
if (!schema.includes("logoData Bytes?") || !schema.includes("logoMime String?")) {
  erros.push("Schema não possui persistência de logo no PostgreSQL.");
}

const app = fs.readFileSync(path.join(root, "backend", "src", "app.js"), "utf8");
if (!app.includes("express.static") || !app.includes("frontendDir")) {
  erros.push("Backend não está configurado para servir o frontend em produção.");
}

const envReal = path.join(root, "backend", ".env");
if (fs.existsSync(envReal)) {
  erros.push("backend/.env real está dentro do projeto. Remova antes de publicar.");
}

const faceEnvReal = path.join(root, "face-api", ".env");
if (fs.existsSync(faceEnvReal)) {
  erros.push("face-api/.env real está dentro do projeto. Remova antes de publicar.");
}

const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
if (!gitignore.includes(".env")) {
  erros.push(".gitignore não protege arquivos .env.");
}

const required = [
  "Dockerfile",
  "face-api/Dockerfile",
  "backend/.env.production.example",
  "backend/prisma/migrations/20260831165000_logo_persistente_postgres/migration.sql"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    erros.push(`Arquivo de produção ausente: ${rel}`);
  }
}

if (erros.length) {
  console.error("\nSTEELCONTROL - CHECK DE PRODUÇÃO: FALHOU\n");
  for (const erro of erros) console.error(`- ${erro}`);
  process.exit(1);
}

console.log("\nSTEELCONTROL - CHECK DE PRODUÇÃO: OK");
console.log(`JavaScript validado: ${js.length} arquivo(s).`);
console.log("Frontend sem URLs locais fixas fora do config runtime.");
console.log("Logo persistente no PostgreSQL configurada.");
console.log("Dockerfiles e exemplos de ambiente presentes.\n");

if (avisos.length) {
  for (const aviso of avisos) console.warn(`AVISO: ${aviso}`);
}
