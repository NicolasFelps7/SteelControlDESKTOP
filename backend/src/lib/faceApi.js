import { env } from "../config/env.js";

async function chamarFaceApi(
  endpoint,
  arquivo
) {
  if (
    !arquivo?.buffer ||
    !arquivo?.mimetype
  ) {
    const erro =
      new Error(
        "Imagem facial não recebida."
      );

    erro.statusCode = 400;
    throw erro;
  }

  const form =
    new FormData();

  form.append(
    "imagem",
    new Blob(
      [arquivo.buffer],
      {
        type:
          arquivo.mimetype
      }
    ),
    arquivo.originalname ||
      "face.jpg"
  );

  let resposta;

  try {
    resposta =
      await fetch(
        `${env.faceApiUrl}${endpoint}`,
        {
          method: "POST",
          body: form,
          headers:
            env.faceApiKey
              ? {
                  "X-Face-Api-Key":
                    env.faceApiKey
                }
              : undefined,
          signal:
            AbortSignal.timeout(
              env.faceApiTimeoutMs
            )
        }
      );
  } catch {
    const erro =
      new Error(
        "Serviço facial indisponível. Verifique se a Face API Python está ligada."
      );

    erro.statusCode = 503;
    throw erro;
  }

  const dados =
    await resposta
      .json()
      .catch(() => ({}));

  if (!resposta.ok) {
    const erro =
      new Error(
        dados.detail ||
        dados.mensagem ||
        "Não foi possível processar a imagem facial."
      );

    erro.statusCode =
      resposta.status >= 400 &&
      resposta.status < 500
        ? resposta.status
        : 502;

    throw erro;
  }

  return dados;
}

export async function analisarImagemFacial(
  arquivo
) {
  return chamarFaceApi(
    "/face/analyze",
    arquivo
  );
}

export async function gerarEmbeddingPorImagem(
  arquivo
) {
  const dados =
    await chamarFaceApi(
      "/face/embedding",
      arquivo
    );

  if (
    !Array.isArray(
      dados.embedding
    ) ||
    dados.embedding.length !== 512
  ) {
    const erro =
      new Error(
        "A Face API retornou um embedding inválido."
      );

    erro.statusCode = 502;
    throw erro;
  }

  return dados;
}
