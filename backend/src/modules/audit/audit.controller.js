import { prisma } from "../../lib/prisma.js";

export async function listarAuditoria(
  req,
  res,
  next
) {
  try {
    if (
      req.auth?.cargo !==
      "ADMINISTRADOR"
    ) {
      return res.status(403).json({
        mensagem:
          "Somente administradores podem consultar a auditoria."
      });
    }

    const limite =
      Math.min(
        300,
        Math.max(
          1,
          Number(req.query.limit) ||
          100
        )
      );

    const itens =
      await prisma.auditLog.findMany({
        where: {
          empresaId:
            req.auth.empresaId
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          criadoEm: "desc"
        },
        take: limite
      });

    res.json(itens);
  } catch (erro) {
    next(erro);
  }
}
