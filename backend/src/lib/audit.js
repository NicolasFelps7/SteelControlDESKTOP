import { prisma } from "./prisma.js";

export async function registrarAuditoria({
  req = null,
  empresaId = null,
  usuarioId = null,
  acao,
  entidade,
  entidadeId = null,
  detalhes = null
}) {
  try {
    const empresaFinal =
      Number(empresaId || req?.auth?.empresaId || 0);

    const usuarioFinal =
      usuarioId || req?.auth?.usuarioId || null;

    if (
      !Number.isInteger(empresaFinal) ||
      empresaFinal <= 0 ||
      !acao ||
      !entidade
    ) {
      return;
    }

    await prisma.auditLog.create({
      data: {
        empresaId: empresaFinal,
        usuarioId:
          usuarioFinal === null
            ? null
            : Number(usuarioFinal),
        acao: String(acao).slice(0, 80),
        entidade: String(entidade).slice(0, 80),
        entidadeId:
          entidadeId === null
            ? null
            : Number(entidadeId),
        detalhes: detalhes || undefined
      }
    });
  } catch (erro) {
    // Auditoria nunca derruba a operação principal.
    console.error(
      "[AUDITORIA] Falha ao registrar evento:",
      erro?.message || erro
    );
  }
}
