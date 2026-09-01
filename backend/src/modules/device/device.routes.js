import { Router } from "express";
import { deviceRequired } from "../../middlewares/deviceAuth.js";
import {
  receberTelemetriaDevice,
  heartbeatDevice,
  configuracaoDevice,
  proximoComando,
  confirmarComando
} from "./device.controller.js";

export const deviceRoutes = Router();

deviceRoutes.post("/:id/telemetria", deviceRequired, receberTelemetriaDevice);
deviceRoutes.post("/:id/heartbeat", deviceRequired, heartbeatDevice);
deviceRoutes.get("/:id/config", deviceRequired, configuracaoDevice);
deviceRoutes.get("/:id/comandos/proximo", deviceRequired, proximoComando);
deviceRoutes.post("/:id/comandos/:comandoId/confirmar", deviceRequired, confirmarComando);
