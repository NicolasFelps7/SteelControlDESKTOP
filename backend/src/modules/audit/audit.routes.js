import { Router } from "express";

import {
  authRequired
} from "../../middlewares/auth.js";

import {
  listarAuditoria
} from "./audit.controller.js";

export const auditRoutes =
  Router();

auditRoutes.use(
  authRequired
);

auditRoutes.get(
  "/",
  listarAuditoria
);
