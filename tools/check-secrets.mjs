import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const erros = [];

const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "venv",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  ".insightface"
]);

const binaryExt = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
  ".zip", ".rar", ".pdf", ".woff", ".woff2", ".ttf", ".otf"
]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(root);

for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const base = path.basename(file);

  if (
    base === ".env" ||
    (/^\.env\./.test(base) && ![".env.example", ".env.production.example"].includes(base))
  ) {
    erros.push(`Arquivo de ambiente real não pode ser versionado: ${rel}`);
  }
}

const patterns = [
  ["chave privada", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bghp_[A-Za-z0-9]{30,}\b/],
  ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{30,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["OpenAI/API token com prefixo sk-", /\bsk-[A-Za-z0-9_-]{20,}\b/]
];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (binaryExt.has(ext)) continue;

  const rel = path.relative(root, file).replaceAll("\\", "/");

  // Exemplos de ambiente são deliberadamente placeholders e não segredos reais.
  if (rel.endsWith(".env.example") || rel.endsWith(".env.production.example")) {
    continue;
  }

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const [nome, regex] of patterns) {
    if (regex.test(text)) {
      erros.push(`${rel}: possível ${nome} encontrado.`);
    }
  }
}

const gitignorePath = path.join(root, ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  erros.push(".gitignore ausente.");
} else {
  const gitignore = fs.readFileSync(gitignorePath, "utf8");
  for (const required of [".env", "node_modules/", "venv/", ".venv/", "*.log"]) {
    if (!gitignore.includes(required)) {
      erros.push(`.gitignore não contém proteção esperada: ${required}`);
    }
  }
}

if (erros.length) {
  console.error("[SECRETS] FALHOU");
  erros.forEach(erro => console.error(`- ${erro}`));
  process.exit(1);
}

console.log(`[SECRETS] OK: ${files.length} arquivos inspecionados; nenhum segredo óbvio ou .env real encontrado.`);
