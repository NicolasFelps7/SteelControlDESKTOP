import { Router } from "express";

import { authRequired } from "../../middlewares/auth.js";
import { listar, criar, excluir } from "./maintenance.controller.js";

export const maintenanceRoutes = Router();

maintenanceRoutes.use(authRequired);

maintenanceRoutes.get("/:id/manutencoes", listar);
maintenanceRoutes.post("/:id/manutencoes", criar);
maintenanceRoutes.delete("/:id/manutencoes/:manutencaoId", excluir);
