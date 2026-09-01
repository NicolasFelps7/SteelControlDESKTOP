import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const frontend = path.join(root, "frontend");
const backendApp = path.join(root, "backend", "src", "app.js");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (["node_modules", ".git", "__pycache__", "venv", ".venv"].includes(entry.name)) {
      return [];
    }
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function carregarRotasFrontend() {
  const rotas = new Map();
  if (!fs.existsSync(backendApp)) return rotas;

  const source = fs.readFileSync(backendApp, "utf8");
  const bloco = source.match(/const\s+paginasFrontend\s*=\s*\{([\s\S]*?)\};/);
  if (!bloco) return rotas;

  for (const match of bloco[1].matchAll(/["'](\/app\/[^"']+)["']\s*:\s*["']([^"']+\.html)["']/g)) {
    rotas.set(match[1], match[2]);
  }
  return rotas;
}

const erros = [];
const avisos = [];
const rotasFrontend = carregarRotasFrontend();
const htmlFiles = walk(frontend).filter(file => file.endsWith(".html"));

if (!rotasFrontend.size) {
  erros.push("Não foi possível localizar o mapa paginasFrontend no backend/src/app.js.");
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const contagem = new Map();
  ids.forEach(id => contagem.set(id, (contagem.get(id) || 0) + 1));

  for (const [id, quantidade] of contagem) {
    if (quantidade > 1) {
      erros.push(`${path.relative(root, file)}: ID duplicado "${id}"`);
    }
  }

  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);

  for (const ref of refs) {
    if (!ref || /^(?:#|https?:|mailto:|tel:|javascript:|data:)/i.test(ref)) continue;

    const limpa = ref.split("?")[0].split("#")[0];
    if (!limpa) continue;

    // As rotas /app/* são servidas pelo Express e não correspondem
    // diretamente a arquivos físicos com esse caminho.
    if (limpa.startsWith("/app/")) {
      const arquivo = rotasFrontend.get(limpa);
      if (!arquivo) {
        erros.push(`${path.relative(root, file)}: rota frontend não registrada no backend: ${ref}`);
        continue;
      }

      const destino = path.join(frontend, arquivo);
      if (!fs.existsSync(destino)) {
        erros.push(`${path.relative(root, file)}: rota ${limpa} aponta para arquivo ausente: ${arquivo}`);
      }
      continue;
    }

    const destino = limpa.startsWith("/")
      ? path.resolve(frontend, `.${limpa}`)
      : path.resolve(path.dirname(file), limpa);

    if (!fs.existsSync(destino)) {
      erros.push(`${path.relative(root, file)}: referência local ausente: ${ref}`);
    }
  }
}

const frontendFiles = walk(frontend).filter(file => /\.(?:html|css|js)$/i.test(file));
const proibidos = [
  /cdnjs\.cloudflare\.com/i,
  /cdn\.jsdelivr\.net/i,
  /images\.pexels\.com/i,
  /images\.unsplash\.com/i
];

for (const file of frontendFiles) {
  const texto = fs.readFileSync(file, "utf8");
  for (const regex of proibidos) {
    if (regex.test(texto)) {
      erros.push(`${path.relative(root, file)}: dependência externa automática: ${regex}`);
    }
  }
}

// Google Maps é uma melhoria progressiva: somente empresa.js pode usá-lo,
// e o endereço textual precisa continuar disponível sem internet.
const empresaJs = path.join(frontend, "assets", "js", "empresa.js");
if (fs.existsSync(empresaJs)) {
  const texto = fs.readFileSync(empresaJs, "utf8");
  if (/google\.com\/maps\?q=/i.test(texto)) {
    if (!/navigator\.onLine\s*!==\s*false/.test(texto) || !/output=embed/.test(texto)) {
      erros.push("empresa.js: Google Maps deve permanecer opcional, condicionado à conectividade e em modo embed.");
    } else {
      avisos.push("Google Maps detectado como melhoria progressiva; endereço textual permanece como fallback offline.");
    }
  }
}

for (const file of frontendFiles) {
  if (file === empresaJs) continue;
  const texto = fs.readFileSync(file, "utf8");
  if (/google\.com\/maps\?q=/i.test(texto)) {
    erros.push(`${path.relative(root, file)}: integração Google Maps fora do módulo de localização.`);
  }
}

const fonts = walk(root).filter(file => /\.(?:ttf|otf|woff2?|eot)$/i.test(file));
if (fonts.length) {
  avisos.push(`Arquivos de fonte encontrados: ${fonts.map(f => path.relative(root, f)).join(", ")}`);
}

const migrationFreeze = path.join(
  root,
  "backend",
  "prisma",
  "migrations",
  "20260828054000_freeze_stability",
  "migration.sql"
);

if (!fs.existsSync(migrationFreeze)) {
  erros.push("Migration de estabilidade 20260828054000_freeze_stability ausente.");
} else {
  const sql = fs.readFileSync(migrationFreeze, "utf8");
  if (/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE\s+TABLE)\b/i.test(sql)) {
    erros.push("Migration de estabilidade contém operação destrutiva.");
  }
}

console.log(`[STATIC] HTML: ${htmlFiles.length} páginas`);
console.log(`[STATIC] Rotas Express: ${rotasFrontend.size} rotas /app/*`);
console.log(`[STATIC] Frontend: ${frontendFiles.length} arquivos HTML/CSS/JS`);

if (avisos.length) {
  avisos.forEach(aviso => console.warn(`[STATIC][AVISO] ${aviso}`));
}

if (erros.length) {
  erros.forEach(erro => console.error(`[STATIC][ERRO] ${erro}`));
  process.exitCode = 1;
} else {
  console.log("[STATIC] PASSOU: IDs, rotas, referências locais, política offline e migration de freeze.");
}
