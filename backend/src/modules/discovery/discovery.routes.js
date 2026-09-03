import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import {
  listarDescobertos,
  varrerRede,
  diagnosticoDescoberta,
  descobrirPorIp,
  aprovarDescoberto
} from "./discovery.controller.js";

export const discoveryRoutes = Router();
discoveryRoutes.use(authRequired);
discoveryRoutes.get("/", listarDescobertos);
discoveryRoutes.get("/diagnostico", diagnosticoDescoberta);
discoveryRoutes.post("/varrer", varrerRede);
discoveryRoutes.post("/por-ip", descobrirPorIp);
discoveryRoutes.post("/:id/aprovar", aprovarDescoberto);
