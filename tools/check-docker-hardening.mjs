import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const erros = [];

const backendDocker = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
const faceDocker = fs.readFileSync(path.join(root, "face-api", "Dockerfile"), "utf8");
const dockerignore = fs.readFileSync(path.join(root, ".dockerignore"), "utf8");
const faceDockerignorePath = path.join(root, "face-api", ".dockerignore");

function exigir(texto, regex, mensagem) {
  if (!regex.test(texto)) erros.push(mensagem);
}

function rejeitar(texto, regex, mensagem) {
  if (regex.test(texto)) erros.push(mensagem);
}

rejeitar(backendDocker, /^FROM\s+\S+:latest\b/im, "Dockerfile principal usa tag latest.");
rejeitar(faceDocker, /^FROM\s+\S+:latest\b/im, "Dockerfile da Face API usa tag latest.");

exigir(backendDocker, /^USER\s+node\s*$/im, "Backend Docker deve executar como usuário não-root (node).");
exigir(backendDocker, /^HEALTHCHECK\b/im, "Backend Docker sem HEALTHCHECK.");
exigir(
  backendDocker,
  /COPY\s+--chown=node:node\b/im,
  "Backend Docker deve copiar a aplicação com ownership do usuário node."
);

exigir(faceDocker, /^USER\s+steelcontrol\s*$/im, "Face API Docker deve executar como usuário não-root.");
exigir(faceDocker, /\buseradd\b[\s\S]*steelcontrol/im, "Face API Docker não cria usuário dedicado steelcontrol.");
exigir(faceDocker, /^HEALTHCHECK\b/im, "Face API Docker sem HEALTHCHECK.");

for (const required of [".git", "**/.env", "**/node_modules", "**/venv"]) {
  if (!dockerignore.includes(required)) {
    erros.push(`.dockerignore sem proteção esperada: ${required}`);
  }
}

if (!fs.existsSync(faceDockerignorePath)) {
  erros.push("face-api/.dockerignore ausente.");
}

if (erros.length) {
  console.error("[DOCKER] HARDENING: FALHOU");
  erros.forEach(erro => console.error(`- ${erro}`));
  process.exit(1);
}

console.log("[DOCKER] HARDENING: OK — imagens sem latest, usuários não-root, healthchecks e contexto protegido.");
