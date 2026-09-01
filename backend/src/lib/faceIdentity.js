import {
  encontrarCorrespondenciaFacial
} from "./faceSecurity.js";

// Mantém a mesma referência de identidade usada no login facial.
// Se uma nova amostra reconheceria uma pessoa já existente, ela não pode
// ser vinculada a outro perfil.
export const FACE_DUPLICATE_THRESHOLD = 0.58;

// Lock global de cadastro facial no PostgreSQL. Evita que dois cadastros
// simultâneos passem pela verificação antes de qualquer um ser gravado.
const FACE_REGISTRATION_LOCK = 83472391;

function normalizarNomeFacial(nome, fallback) {
  const limpo = String(nome || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpo) {
    return fallback;
  }

  return limpo.slice(0, 40);
}

export async function criarAmostraFacialExclusiva({
  prisma,
  usuarioId,
  embedding,
  maxSamples,
  nome,
  modelo = "insightface-buffalo_l",
  threshold = FACE_DUPLICATE_THRESHOLD
}) {
  return prisma.$transaction(
    async tx => {
      // O projeto usa PostgreSQL. O advisory lock existe somente durante
      // esta transação e serializa o trecho crítico de cadastro biométrico.
      await tx.$queryRawUnsafe(
        `SELECT pg_advisory_xact_lock(${FACE_REGISTRATION_LOCK})`
      );

      const quantidadeAtual =
        await tx.faceEmbedding.count({
          where: {
            usuarioId
          }
        });

      if (
        quantidadeAtual >=
        maxSamples
      ) {
        return {
          ok: false,
          motivo: "limite",
          quantidadeAtual
        };
      }

      const nomeFinal =
        normalizarNomeFacial(
          nome,
          `Facial ${quantidadeAtual + 1}`
        );

      const nomeJaUsado =
        await tx.faceEmbedding.findFirst({
          where: {
            usuarioId,
            nome: {
              equals: nomeFinal,
              mode: "insensitive"
            }
          },
          select: {
            id: true,
            nome: true
          }
        });

      if (nomeJaUsado) {
        return {
          ok: false,
          motivo: "nome_duplicado",
          quantidadeAtual,
          nome: nomeFinal
        };
      }

      const outrasFaces =
        await tx.faceEmbedding.findMany({
          where: {
            usuarioId: {
              not: usuarioId
            }
          },
          select: {
            id: true,
            usuarioId: true,
            embedding: true
          }
        });

      const duplicada =
        encontrarCorrespondenciaFacial({
          embedding,
          faces: outrasFaces,
          threshold
        });

      if (duplicada) {
        return {
          ok: false,
          motivo: "outro_perfil",
          quantidadeAtual,
          similaridade:
            duplicada.similaridade
        };
      }

      const face =
        await tx.faceEmbedding.create({
          data: {
            usuarioId,
            nome: nomeFinal,
            embedding,
            modelo
          }
        });

      return {
        ok: true,
        face,
        quantidadeAtual,
        quantidadeFaces:
          quantidadeAtual + 1
      };
    },
    {
      maxWait: 5000,
      timeout: 15000
    }
  );
}
