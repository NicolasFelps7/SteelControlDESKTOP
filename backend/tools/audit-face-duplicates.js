import { prisma } from "../src/lib/prisma.js";
import { similaridadeCosseno, extrairTemplatesFaciais } from "../src/lib/faceSecurity.js";
import { FACE_DUPLICATE_THRESHOLD } from "../src/lib/faceIdentity.js";

async function main() {
  const faces = await prisma.faceEmbedding.findMany({
    select: {
      id: true,
      usuarioId: true,
      embedding: true,
      usuario: {
        select: {
          nome: true,
          email: true,
          empresaId: true,
          ativo: true
        }
      }
    }
  });

  const suspeitas = [];

  for (let i = 0; i < faces.length; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const a = faces[i];
      const b = faces[j];

      if (a.usuarioId === b.usuarioId) continue;

      const templatesA = extrairTemplatesFaciais(a.embedding);
      const templatesB = extrairTemplatesFaciais(b.embedding);

      let similaridade = -1;

      for (const templateA of templatesA) {
        for (const templateB of templatesB) {
          similaridade = Math.max(
            similaridade,
            similaridadeCosseno(
              templateA.embedding,
              templateB.embedding
            )
          );
        }
      }

      if (similaridade >= FACE_DUPLICATE_THRESHOLD) {
        suspeitas.push({
          similaridade: Number(similaridade.toFixed(4)),
          faceA: a.id,
          usuarioA: a.usuarioId,
          nomeA: a.usuario?.nome || "-",
          emailA: a.usuario?.email || "-",
          empresaA: a.usuario?.empresaId || null,
          ativoA: Boolean(a.usuario?.ativo),
          faceB: b.id,
          usuarioB: b.usuarioId,
          nomeB: b.usuario?.nome || "-",
          emailB: b.usuario?.email || "-",
          empresaB: b.usuario?.empresaId || null,
          ativoB: Boolean(b.usuario?.ativo)
        });
      }
    }
  }

  suspeitas.sort((a, b) => b.similaridade - a.similaridade);

  console.log(`[FACE-AUDIT] Faciais analisadas: ${faces.length}`);
  console.log(`[FACE-AUDIT] Limiar conservador: ${FACE_DUPLICATE_THRESHOLD}`);

  if (!suspeitas.length) {
    console.log("[FACE-AUDIT] Nenhuma duplicidade biométrica suspeita encontrada.");
    return;
  }

  console.error(
    `[FACE-AUDIT] ATENÇÃO: ${suspeitas.length} par(es) suspeito(s) encontrado(s).`
  );
  console.table(suspeitas);
  console.error(
    "[FACE-AUDIT] O relatório não exclui nada automaticamente. Revise os perfis e remova a biometria incorreta pelo SteelControl."
  );
  process.exitCode = 2;
}

main()
  .catch(erro => {
    console.error("[FACE-AUDIT] Falha:", erro?.message || erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
