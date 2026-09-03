import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const html = read("frontend/index.html");
const machines = read("frontend/assets/js/maquinas.js");
const runtime = read("frontend/assets/js/controller-runtime.js");
const dashboard = read("frontend/assets/js/dashboard.js");
const app = read("backend/src/app.js");
const machineController = read("backend/src/modules/machines/machine.controller.js");
const hmiPolicy = read("backend/src/lib/hmiPolicy.js");

const requiredControllers = [
  "ESP32",
  "DOBOT_MAGICIAN",
  "CLP_PLC",
  "CONTROLADOR_ROBOTICO",
  "CNC",
  "GATEWAY_INDUSTRIAL",
  "OUTRO"
];

if (!html.includes('id="controllerTela"')) {
  throw new Error("Painel adaptativo ausente.");
}

for (const hmiId of ["hmiConsole", "hmiProcessDiagram", "hmiCommandState"]) {
  if (!html.includes(`id="${hmiId}"`)) {
    throw new Error(`IHM industrial incompleta: ${hmiId} ausente.`);
  }
}

if (!machineController.includes("criarComandoIhm") || !machineController.includes("IHM_START")) {
  throw new Error("Backend da IHM industrial ausente.");
}

if (!hmiPolicy.includes("startPermitted") || !hmiPolicy.includes("comandoPayloadExpirado")) {
  throw new Error("Hardening da IHM (intertravamentos/TTL) ausente.");
}

if (html.includes('id="dobotMenuButton"')) {
  throw new Error("Dobot ainda aparece como item global do menu.");
}

if (!app.includes('"/app/dashboard": "index.html"')) {
  throw new Error("Rota profissional /app/dashboard não está mapeada para index.html.");
}

if (
  !machines.includes('/app/dashboard?view=controller') ||
  !machines.includes('/app/dashboard?view=dobot')
) {
  throw new Error("Roteamento profissional dos painéis por controlador ausente.");
}

for (const scope of [
  "machineProductionTitle",
  "machineMaintenanceTitle",
  "machineLogsTitle"
]) {
  if (!html.includes(`id="${scope}"`) || !dashboard.includes(scope)) {
    throw new Error(`Tela da máquina sem contexto dinâmico: ${scope}`);
  }
}

if (
  !dashboard.includes('painelSolicitado === "controller"') ||
  !dashboard.includes('painelSolicitado === "dobot"')
) {
  throw new Error("O botão Início não preserva o painel específico do controlador.");
}

for (const controller of requiredControllers) {
  if (!machines.includes(controller)) {
    throw new Error(`Cadastro sem perfil: ${controller}`);
  }

  if (controller !== "DOBOT_MAGICIAN" && !runtime.includes(controller)) {
    throw new Error(`Runtime adaptativo sem perfil: ${controller}`);
  }
}

console.log(
  `[CONTROLLERS] OK: ${requiredControllers.length} perfis, IHM supervisionada, rota /app/dashboard e painéis adaptativos validados.`
);
