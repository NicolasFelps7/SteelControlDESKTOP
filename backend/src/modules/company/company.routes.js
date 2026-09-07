import { Router } from "express";
import multer from "multer";

import { authRequired } from "../../middlewares/auth.js";
import { criarRateLimit } from "../../middlewares/security.js";

import {
  getEmpresa,
  atualizarEmpresa,
  obterLogoPublica,
  uploadLogo,
  removerLogo,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  removerUsuario,
  solicitarCodigoAlteracaoEmail,
  confirmarAlteracaoEmail,
  cadastrarFaceUsuarioImagem,
  listarFacesUsuario,
  removerFaceUsuario,
  removerFacesUsuario,
  streamEmpresa,
  obterRevisaoEmpresa
} from "./company.controller.js";

export const companyRoutes = Router();

const limiteSolicitacaoAlteracaoEmail =
  criarRateLimit({
    janelaMs: 60 * 60 * 1000,
    limite: 5,
    prefixo: "company-email-request",
    mensagem:
      "Muitas solicitações de alteração de e-mail. Aguarde antes de tentar novamente."
  });

const limiteConfirmacaoAlteracaoEmail =
  criarRateLimit({
    janelaMs: 10 * 60 * 1000,
    limite: 10,
    prefixo: "company-email-confirm",
    mensagem:
      "Muitas tentativas de confirmação. Solicite um novo código mais tarde."
  });

const uploadLogoMiddleware =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        5 * 1024 * 1024
    },

    fileFilter(
      req,
      file,
      callback
    ) {
      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !tiposPermitidos.includes(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Use uma imagem JPG, PNG ou WEBP."
          )
        );
      }

      callback(null, true);
    }
  });

const uploadFace =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        4 * 1024 * 1024
    },

    fileFilter(
      req,
      file,
      callback
    ) {
      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !tiposPermitidos.includes(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Use uma imagem facial JPG, PNG ou WEBP."
          )
        );
      }

      callback(null, true);
    }
  });

// A logo não é um dado sensível e precisa ser carregável por <img>.
companyRoutes.get(
  "/logo/:empresaId",
  obterLogoPublica
);

companyRoutes.get(
  "/stream",
  authRequired,
  streamEmpresa
);

companyRoutes.get(
  "/revision",
  authRequired,
  obterRevisaoEmpresa
);

companyRoutes.get(
  "/me",
  authRequired,
  getEmpresa
);

companyRoutes.put(
  "/me",
  authRequired,
  atualizarEmpresa
);

companyRoutes.post(
  "/logo",
  authRequired,
  uploadLogoMiddleware.single("logo"),
  uploadLogo
);

companyRoutes.delete(
  "/logo",
  authRequired,
  removerLogo
);

companyRoutes.get(
  "/usuarios",
  authRequired,
  listarUsuarios
);

companyRoutes.post(
  "/usuarios",
  authRequired,
  criarUsuario
);

companyRoutes.put(
  "/usuarios/:usuarioId",
  authRequired,
  atualizarUsuario
);

companyRoutes.delete(
  "/usuarios/:usuarioId",
  authRequired,
  removerUsuario
);

companyRoutes.post(
  "/usuarios/:usuarioId/email-verification/request",
  authRequired,
  limiteSolicitacaoAlteracaoEmail,
  solicitarCodigoAlteracaoEmail
);

companyRoutes.post(
  "/usuarios/:usuarioId/email-verification/confirm",
  authRequired,
  limiteConfirmacaoAlteracaoEmail,
  confirmarAlteracaoEmail
);

companyRoutes.get(
  "/usuarios/:usuarioId/faces",
  authRequired,
  listarFacesUsuario
);

companyRoutes.post(
  "/usuarios/:usuarioId/face-image",
  authRequired,
  uploadFace.single("imagem"),
  cadastrarFaceUsuarioImagem
);

companyRoutes.post(
  "/usuarios/:usuarioId/face",
  authRequired,
  (req, res) => {
    res.status(410).json({
      mensagem:
        "Rota antiga desativada. Envie a imagem para /empresa/usuarios/:usuarioId/face-image."
    });
  }
);

companyRoutes.delete(
  "/usuarios/:usuarioId/faces/:faceId",
  authRequired,
  removerFaceUsuario
);

companyRoutes.delete(
  "/usuarios/:usuarioId/face",
  authRequired,
  removerFacesUsuario
);
