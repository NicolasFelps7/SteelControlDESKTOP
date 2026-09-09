import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const erros = [];
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const requireText = (rel, fragment, label) => {
  const text = read(rel);
  if (!text.includes(fragment)) erros.push(`${label}: ${rel}`);
};

requireText("backend/prisma/schema.prisma", "tokenVersion Int", "Usuario sem versão de sessão");
requireText("backend/src/modules/auth/auth.routes.js", '"/session-events"', "Stream de sessão não registrado");
requireText("backend/src/middlewares/auth.js", "SESSION_REVOKED", "Middleware não valida revogação de sessão");
requireText("backend/src/modules/company/company.controller.js", "revogarSessoesUsuario", "Desativação não revoga clientes conectados");
requireText("backend/src/modules/device/device.controller.js", "ACK_STATUS_INVALIDO", "ACK desconhecido ainda pode ser aceito");
requireText("backend/src/modules/machines/machine.controller.js", "SAFETY_RELEASE_REQUIRES_FRESH_TELEMETRY", "Liberação real não exige telemetria fresca");
requireText("backend/src/modules/maintenance/maintenance.controller.js", "Uma manutenção registrada não pode mascarar", "Manutenção não preserva parada ativa");
requireText("face-api/app/main.py", "hmac.compare_digest", "Face API não usa comparação segura da chave");
requireText("face-api/app/main.py", 'STEELCONTROL_ENV == "production"', "Face API não falha fechada em produção");
requireText("frontend/assets/js/config.js", "/auth/session-events", "Desktop sem logout remoto instantâneo");
requireText("backend/src/lib/faceIdentity.js", "FACE_DUPLICATE_THRESHOLD = 0.50", "Cadastro facial ainda usa limiar permissivo de duplicidade");
requireText("backend/src/modules/company/company.controller.js", "FACE_ENROLL_LIVENESS_REQUIRED", "Cadastro facial de funcionário não exige prova de vida");
requireText("backend/src/modules/company/company.controller.js", "FACE_DUPLICADA_BLOQUEADA", "Tentativa de facial duplicada não é auditada");
requireText("backend/src/modules/company/company.routes.js", '{ name: "liveness", maxCount: 1 }', "Rota de cadastro facial não recebe liveness");
requireText("frontend/assets/js/empresa.js", 'codigo === "FACE_ALREADY_LINKED"', "Desktop não trata facial já vinculada explicitamente");
requireText("frontend/assets/js/empresa.js", "fecharCameraFacial();", "Desktop não fecha a captura facial em fluxos protegidos");

const docs = [
  "HOSPEDAGEM_PRONTA.md",
  "INTEGRACAO_DOBOT_MAGICIAN.md",
  "INTEGRACAO_MAQUINA_REAL.md",
  "PAINEIS_ADAPTATIVOS_CONTROLADORES.md",
  "VERSAO_CONGELADA_TCC.md"
];
for (const rel of docs) {
  if (!fs.existsSync(path.join(root, rel))) erros.push(`Documento referenciado ausente: ${rel}`);
}

if (erros.length) {
  console.error("[PLATFORM] HARDENING: FALHOU");
  erros.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log("[PLATFORM] HARDENING: OK — sessão revogável, ACK estrito, safety release fresca, enrollment facial com liveness/anti-duplicidade e documentação validados.");
