import {
  encontrarCorrespondenciaFacial,
  criarPacoteTemplatesFaciais
} from "./faceSecurity.js";

// Mantém a mesma referência de identidade usada no login facial.
// Se uma nova amostra reconheceria uma pessoa já existente, ela não pode
// ser vinculada a outro perfil.
// Limiar deliberadamente mais conservador para CADASTRO do que para login.
// O objetivo do enrollment é impedir que uma identidade já existente seja
// vinculada a outro perfil, mesmo sob pequenas variações de pose/iluminação.
// Este valor ainda precisa ser calibrado com dados reais da empresa; nenhum
// limiar biométrico pode ser tratado como garantia absoluta de 100%.
export const FACE_DUPLICATE_THRESHOLD = 0.50;

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
  embeddingsVerificacao = [],
  embeddingInicial = null,
  nome,
  modelo = "insightface-buffalo_l",
  threshold = FACE_DUPLICATE_THRESHOLD
}) {
  return prisma.$transaction(
    async tx => {
      // O projeto usa PostgreSQL. O advisory lock existe somente durante
      // esta transação e serializa o trecho crítico de cadastro biométrico.
      await tx.$queryRawUnsafe(
        `SELECT pg_advisory_xact_lock(${FACE_REGISTRATION_LOCK})::text AS "lock"`
      );

      const quantidadeAtual =
        await tx.faceEmbedding.count({
          where: {
            usuarioId
          }
        });

      if (
        quantidadeAtual >= 1
      ) {
        return {
          ok: false,
          motivo: "perfil_ja_possui_face",
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

      // Verifica mais de uma captura do mesmo enrollment (frontal +
      // movimento/liveness quando disponível). Isso reduz falso negativo de
      // duplicidade causado por pose, iluminação ou um único frame ruim.
      const candidatos = [
        embedding,
        embeddingInicial,
        ...(Array.isArray(embeddingsVerificacao)
          ? embeddingsVerificacao
          : [])
      ].filter(Array.isArray);

      let duplicada = null;

      for (const candidato of candidatos) {
        const correspondencia =
          encontrarCorrespondenciaFacial({
            embedding: candidato,
            faces: outrasFaces,
            threshold
          });

        if (
          correspondencia &&
          (!duplicada ||
            correspondencia.similaridade > duplicada.similaridade)
        ) {
          duplicada = correspondencia;
        }
      }

      if (duplicada) {
        return {
          ok: false,
          motivo: "outro_perfil",
          quantidadeAtual,
          similaridade:
            duplicada.similaridade
        };
      }

      const embeddingMovimento =
        Array.isArray(embeddingsVerificacao)
          ? embeddingsVerificacao.find(Array.isArray) || null
          : null;

      const pacoteTemplates =
        criarPacoteTemplatesFaciais({
          inicial: embeddingInicial,
          movimento: embeddingMovimento,
          final: embedding
        });

      const face =
        await tx.faceEmbedding.create({
          data: {
            usuarioId,
            nome: nomeFinal,
            embedding: pacoteTemplates,
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
