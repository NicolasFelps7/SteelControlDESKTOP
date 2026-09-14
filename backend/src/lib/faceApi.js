import { env } from "../config/env.js";

async function chamarFaceApi(
  endpoint,
  arquivo
) {
  if (!arquivo?.buffer) {
    const erro =
      new Error(
        "Imagem facial não recebida."
      );

    erro.statusCode = 400;
    throw erro;
  }

  // Alguns clientes móveis enviam application/octet-stream mesmo quando
  // os bytes são JPEG/PNG/WEBP. Validamos a assinatura real antes de
  // encaminhar à Face API para manter Desktop e Mobile compatíveis.
  const bytes = arquivo.buffer;
  const ehJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const ehPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4e && bytes[3] === 0x47;
  const ehWebp =
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";

  const mimetypeReal =
    ehJpeg ? "image/jpeg" :
    ehPng ? "image/png" :
    ehWebp ? "image/webp" : null;

  if (!mimetypeReal) {
    const erro = new Error("Formato de imagem facial inválido. Use JPG, PNG ou WEBP.");
    erro.statusCode = 400;
    throw erro;
  }

  const extensao =
    mimetypeReal === "image/png" ? "png" :
    mimetypeReal === "image/webp" ? "webp" : "jpg";

  const form = new FormData();

  form.append(
    "imagem",
    new Blob([bytes], { type: mimetypeReal }),
    `face.${extensao}`
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
