import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "CODE_FREEZE.sha256");

const scopedDirs = [
  "backend/src",
  "backend/prisma",
  "backend/test",
  "frontend",
  "face-api/app",
  "face-api/tests",
  "dobot-gateway",
  "device-examples"
];

const scopedFiles = [
  "backend/package.json",
  "backend/package-lock.json",
  "face-api/requirements.txt",
  "face-api/requirements-lock.txt",
  "face-api/requirements-production.txt"
];

const ignored = new Set([
  "node_modules",
  "venv",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  ".insightface"
]);

const textExtensions = new Set([
  ".js", ".mjs", ".json", ".prisma", ".sql", ".py",
  ".html", ".css", ".md", ".txt", ".toml", ".yml", ".yaml",
  ".ino", ".bat", ".ps1", ".env"
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name)) return [];

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(full);
    if (entry.name.endsWith(".pyc")) return [];

    return [full];
  });
}

function hashCanonico(file) {
  const buffer = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();

  const payload = textExtensions.has(ext)
    ? Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n"), "utf8")
    : buffer;

  return crypto.createHash("sha256").update(payload).digest("hex");
}

const currentFiles = [
  ...scopedDirs.flatMap(rel => walk(path.join(root, rel))),
  ...scopedFiles.map(rel => path.join(root, rel)).filter(fs.existsSync)
];

const unique = [...new Set(currentFiles.map(file => path.resolve(file)))];

const rows = unique
  .map(file => {
    const rel = path.relative(root, file).replaceAll("\\", "/");
    return {
      rel,
      hash: hashCanonico(file)
    };
  })
  .sort((a, b) => a.rel.localeCompare(b.rel));

const header = [
  "# SteelControl code freeze manifest — atualizado para a versão final do projeto",
  "# Gerado por tools/update-code-freeze.mjs",
  ""
];

const body = rows.map(({ rel, hash }) => `${hash}  ${rel}`);

fs.writeFileSync(
  manifestPath,
  [...header, ...body, ""].join("\n"),
  "utf8"
);

console.log(`[FREEZE] Manifesto atualizado: ${rows.length} arquivos.`);
console.log(`[FREEZE] Arquivo: ${manifestPath}`);
console.log("[FREEZE] Agora execute: npm run check:freeze");
