import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("frontend/index.html");
const machines = read("frontend/assets/js/maquinas.js");
const runtime = read("frontend/assets/js/controller-runtime.js");
const requiredControllers = ["ESP32", "DOBOT_MAGICIAN", "CLP_PLC", "CONTROLADOR_ROBOTICO", "CNC", "GATEWAY_INDUSTRIAL", "OUTRO"];

if (!html.includes('id="controllerTela"')) throw new Error("Painel adaptativo ausente.");
if (html.includes('id="dobotMenuButton"')) throw new Error("Dobot ainda aparece como item global do menu.");
if (!machines.includes('index.html?view=controller') || !machines.includes('index.html?view=dobot')) {
  throw new Error("Roteamento dos painéis por controlador ausente.");
}

const dashboard = read("frontend/assets/js/dashboard.js");
for (const scope of ["machineProductionTitle", "machineMaintenanceTitle", "machineLogsTitle"]) {
  if (!html.includes(`id="${scope}"`) || !dashboard.includes(scope)) {
    throw new Error(`Tela da máquina sem contexto dinâmico: ${scope}`);
  }
}
if (!dashboard.includes('painelSolicitado === "controller"') || !dashboard.includes('painelSolicitado === "dobot"')) {
  throw new Error("O botão Início não preserva o painel específico do controlador.");
}

for (const controller of requiredControllers) {
  if (!machines.includes(controller)) throw new Error(`Cadastro sem perfil: ${controller}`);
  if (controller !== "DOBOT_MAGICIAN" && !runtime.includes(controller)) {
    throw new Error(`Runtime adaptativo sem perfil: ${controller}`);
  }
}

console.log(`[CONTROLLERS] OK: ${requiredControllers.length} perfis e roteamento adaptativo validados.`);
