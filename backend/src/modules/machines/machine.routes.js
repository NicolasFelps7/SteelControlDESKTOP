import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import {
  listar,
  sincronizar,
  criar,
  buscar,
  atualizar,
  excluir,
  simular,
  telemetria,
  receberTelemetriaReal,
  demonstracao,
  diagnostico,
  regenerarDeviceKey,
  liberarSeguranca,
  streamMaquina,
  criarComandoIhm,
  criarComandoDobot
} from "./machine.controller.js";

export const machineRoutes = Router();

machineRoutes.use(authRequired);

machineRoutes.get("/", listar);
machineRoutes.get("/sync", sincronizar);
machineRoutes.post("/", criar);

machineRoutes.get("/:id/stream", streamMaquina);
machineRoutes.get("/:id/diagnostico", diagnostico);
machineRoutes.post("/:id/device-key/regenerar", regenerarDeviceKey);
machineRoutes.post("/:id/liberar-seguranca", liberarSeguranca);
machineRoutes.post("/:id/ihm/comandos", criarComandoIhm);
machineRoutes.post("/:id/comandos", criarComandoDobot);
machineRoutes.post("/:id/demonstracao", demonstracao);

machineRoutes.post("/:id/simular", simular);
machineRoutes.get("/:id/telemetria", telemetria);
machineRoutes.post("/:id/telemetria", receberTelemetriaReal);

machineRoutes.get("/:id", buscar);
machineRoutes.put("/:id", atualizar);
machineRoutes.delete("/:id", excluir);
