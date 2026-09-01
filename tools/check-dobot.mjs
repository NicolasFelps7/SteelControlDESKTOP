import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const must = [
  "dobot-gateway/main.py",
  "dobot-gateway/drivers/magician_driver.py",
  "dobot-gateway/drivers/mock_driver.py",
  "frontend/assets/js/dobot-runtime.js",
  "frontend/assets/css/dobot-runtime.css",
  "backend/prisma/migrations/20260901123000_dobot_gateway_metadata/migration.sql"
];
for (const file of must) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Ausente: ${file}`);
}
const schema = fs.readFileSync(path.join(root,"backend/prisma/schema.prisma"),"utf8");
if (!schema.includes("integracaoMeta") || !schema.includes("dadosExtras")) throw new Error("Schema sem metadados Dobot.");
const routes = fs.readFileSync(path.join(root,"backend/src/modules/machines/machine.routes.js"),"utf8");
if (!routes.includes('/:id/comandos')) throw new Error("Rota segura de comandos Dobot ausente.");
const html = fs.readFileSync(path.join(root,"frontend/index.html"),"utf8");
if (!html.includes('id="dobotTela"')) throw new Error("Aba Dobot ausente no desktop.");
console.log("[DOBOT] CHECK PROFISSIONAL: OK");
