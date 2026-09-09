import { Router } from "express";
import multer from "multer";

import {
  login,
  registerCompany,
  requestCompanyRegistrationCode,
  resendCompanyRegistrationCode,
  confirmCompanyRegistrationCode,
  completeCompanyRegistrationWithFace,
  registerFace,
  analisarFaceImage,
  registerFaceImage,
  loginFaceImage,
  loginFace,
  requestFaceAmbiguousCode,
  verifyFaceAmbiguousCode,
  faceStatus,
  removeFace,
  listFaceSamples,
  removeFaceSample
} from "./auth.controller.js";

import {
  authRequired
} from "../../middlewares/auth.js";

import {
  criarRateLimit
} from "../../middlewares/security.js";

import {
  streamSessionEvents
} from "../../lib/sessionEvents.js";

export const authRoutes =
  Router();

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
      const permitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !permitidos.includes(
          file.mimetype
        )
      ) {
        return callback(
          new Error(
            "Formato de imagem facial inválido."
          )
        );
      }

      callback(null, true);
    }
  });

const limiteLogin =
  criarRateLimit({
    janelaMs:
      10 * 60 * 1000,
    limite: 12,
    prefixo: "login",
    mensagem:
      "Muitas tentativas de login. Aguarde alguns minutos."
  });

const limiteEmail =
  criarRateLimit({
    janelaMs:
      60 * 60 * 1000,
    limite: 12,
    prefixo: "email-code",
    mensagem:
      "Muitas solicitações de código. Aguarde antes de tentar novamente."
  });

const limiteFacial =
  criarRateLimit({
    janelaMs:
      5 * 60 * 1000,
    limite: 30,
    prefixo: "face-login",
    mensagem:
      "Muitas tentativas de reconhecimento facial. Aguarde um pouco."
  });

const limiteAnaliseFacial =
  criarRateLimit({
    janelaMs:
      5 * 60 * 1000,
    limite: 600,
    prefixo: "face-analyze",
    mensagem:
      "Muitas análises faciais em sequência. Aguarde alguns segundos."
  });

authRoutes.post(
  "/login",
  limiteLogin,
  login
);

authRoutes.post(
  "/register-company",
  registerCompany
);

authRoutes.post(
  "/register-company/request-code",
  limiteEmail,
  requestCompanyRegistrationCode
);

authRoutes.post(
  "/register-company/resend-code",
  limiteEmail,
  resendCompanyRegistrationCode
);

authRoutes.post(
  "/register-company/confirm-code",
  limiteEmail,
  confirmCompanyRegistrationCode
);

authRoutes.post(
  "/register-company/complete-face",
  limiteFacial,
  uploadFace.fields([
    {
      name: "imagem",
      maxCount: 1
    },
    {
      name: "inicial",
      maxCount: 1
    },
    {
      name: "liveness",
      maxCount: 1
    }
  ]),
  completeCompanyRegistrationWithFace
);

authRoutes.post(
  "/face/analyze-image",
  limiteAnaliseFacial,
  uploadFace.single("imagem"),
  analisarFaceImage
);

authRoutes.get(
  "/session-events",
  authRequired,
  streamSessionEvents
);

authRoutes.get(
  "/face/status",
  authRequired,
  faceStatus
);

authRoutes.get(
  "/face/samples",
  authRequired,
  listFaceSamples
);

// Rotas seguras recomendadas: imagem -> Node -> Python -> Node.
authRoutes.post(
  "/face/register-image",
  authRequired,
  limiteFacial,
  uploadFace.fields([
    { name: "imagem", maxCount: 1 },
    { name: "inicial", maxCount: 1 },
    { name: "liveness", maxCount: 1 }
  ]),
  registerFaceImage
);

authRoutes.post(
  "/face/login-image",
  limiteFacial,
  uploadFace.fields([
    {
      name: "imagem",
      maxCount: 1
    },
    {
      name: "liveness",
      maxCount: 1
    }
  ]),
  loginFaceImage
);

authRoutes.post(
  "/face/ambiguous/request-code",
  limiteEmail,
  requestFaceAmbiguousCode
);

authRoutes.post(
  "/face/ambiguous/verify-code",
  limiteLogin,
  verifyFaceAmbiguousCode
);

// Compatibilidade temporária com clientes antigos.
// O desktop novo não usa mais estas rotas de embedding direto.
authRoutes.post(
  "/face/register",
  authRequired,
  (req, res) => {
    res.status(410).json({
      mensagem:
        "Rota antiga desativada. Envie a imagem para /auth/face/register-image."
    });
  }
);

authRoutes.post(
  "/face/login",
  limiteFacial,
  (req, res) => {
    res.status(410).json({
      mensagem:
        "Rota antiga desativada. O login facial exige imagem e prova de vida."
    });
  }
);

authRoutes.delete(
  "/face/samples/:faceId",
  authRequired,
  removeFaceSample
);

authRoutes.delete(
  "/face",
  authRequired,
  removeFace
);
