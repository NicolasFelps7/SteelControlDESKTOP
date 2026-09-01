import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const frontend = path.join(root, "frontend");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const erros = [];
const avisos = [];
const htmlFiles = walk(frontend).filter(file => file.endsWith(".html"));

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const contagem = new Map();
  ids.forEach(id => contagem.set(id, (contagem.get(id) || 0) + 1));
  for (const [id, quantidade] of contagem) {
    if (quantidade > 1) erros.push(`${path.relative(root, file)}: ID duplicado "${id}"`);
  }

  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
  for (const ref of refs) {
    if (!ref || /^(?:#|https?:|mailto:|tel:|javascript:|data:)/i.test(ref)) continue;
    const limpa = ref.split("?")[0].split("#")[0];
    if (!limpa) continue;
    const destino = path.resolve(path.dirname(file), limpa);
    if (!fs.existsSync(destino)) erros.push(`${path.relative(root, file)}: referência local ausente: ${ref}`);
  }
}

const frontendFiles = walk(frontend).filter(file => /\.(?:html|css|js)$/i.test(file));
const proibidos = [
  /cdnjs\.cloudflare\.com/i,
  /cdn\.jsdelivr\.net/i,
  /images\.pexels\.com/i,
  /images\.unsplash\.com/i,
  /google\.com\/maps\?q=/i
];
for (const file of frontendFiles) {
  const texto = fs.readFileSync(file, "utf8");
  for (const regex of proibidos) {
    if (regex.test(texto)) erros.push(`${path.relative(root, file)}: dependência externa automática: ${regex}`);
  }
}

const fonts = walk(root).filter(file => /\.(?:ttf|otf|woff2?|eot)$/i.test(file));
if (fonts.length) avisos.push(`Arquivos de fonte encontrados: ${fonts.map(f => path.relative(root, f)).join(", ")}`);

const migrationFreeze = path.join(root, "backend", "prisma", "migrations", "20260828054000_freeze_stability", "migration.sql");
if (!fs.existsSync(migrationFreeze)) {
  erros.push("Migration de estabilidade 20260828054000_freeze_stability ausente.");
} else {
  const sql = fs.readFileSync(migrationFreeze, "utf8");
  if (/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE\s+TABLE)\b/i.test(sql)) {
    erros.push("Migration de estabilidade contém operação destrutiva.");
  }
}

console.log(`[STATIC] HTML: ${htmlFiles.length} páginas`);
console.log(`[STATIC] Frontend: ${frontendFiles.length} arquivos HTML/CSS/JS`);
if (avisos.length) avisos.forEach(a => console.warn(`[STATIC][AVISO] ${a}`));
if (erros.length) {
  erros.forEach(e => console.error(`[STATIC][ERRO] ${e}`));
  process.exitCode = 1;
} else {
  console.log("[STATIC] PASSOU: IDs, referências locais, dependências offline e migration de freeze.");
}
