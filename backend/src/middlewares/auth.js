import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export async function authRequired(
  req,
  res,
  next
) {
  const auth =
    req.headers.authorization;

  if (
    !auth?.startsWith("Bearer ")
  ) {
    return res
      .status(401)
      .json({
        mensagem:
          "Faça login para continuar."
      });
  }

  try {
    const payload =
      jwt.verify(
        auth.substring(7),
        env.jwtSecret
      );

    const usuarioId =
      Number(payload.usuarioId);

    if (
      !Number.isInteger(usuarioId)
    ) {
      return res
        .status(401)
        .json({
          mensagem:
            "Sessão inválida."
        });
    }

    // O token não é a fonte final de verdade para cargo/empresa/ativo.
    // A cada requisição protegida, o banco confirma o estado atual.
    const usuario =
      await prisma.usuario.findUnique({
        where: {
          id: usuarioId
        },
        select: {
          id: true,
          empresaId: true,
          cargo: true,
          ativo: true,
          email: true,
          nome: true
        }
      });

    if (
      !usuario ||
      !usuario.ativo
    ) {
      return res
        .status(401)
        .json({
          mensagem:
            "Conta inexistente ou desativada. Faça login novamente."
        });
    }

    req.auth = {
      usuarioId:
        usuario.id,
      empresaId:
        usuario.empresaId,
      cargo:
        usuario.cargo,
      email:
        usuario.email,
      nome:
        usuario.nome
    };

    return next();

  } catch (erro) {
    return res
      .status(401)
      .json({
        mensagem:
          "Sessão inválida ou expirada."
      });
  }
}

export function requireRoles(
  ...cargosPermitidos
) {
  return function roleGuard(
    req,
    res,
    next
  ) {
    if (
      !req.auth ||
      !cargosPermitidos.includes(
        req.auth.cargo
      )
    ) {
      return res
        .status(403)
        .json({
          mensagem:
            "Você não possui permissão para realizar esta ação."
        });
    }

    next();
  };
}
