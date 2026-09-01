export function normalizarEmbedding(embedding) {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return null;
  }

  const numeros = embedding.map(Number);

  if (numeros.some(valor => !Number.isFinite(valor))) {
    return null;
  }

  const norma = Math.sqrt(
    numeros.reduce(
      (soma, valor) => soma + valor * valor,
      0
    )
  );

  if (!norma) {
    return null;
  }

  return numeros.map(valor => valor / norma);
}


export function similaridadeCosseno(vetorA, vetorB) {
  const a = normalizarEmbedding(vetorA);
  const b = normalizarEmbedding(vetorB);

  if (!a || !b || a.length !== b.length) {
    return -1;
  }

  let soma = 0;

  for (let i = 0; i < a.length; i++) {
    soma += a[i] * b[i];
  }

  return soma;
}


export function validarMesmaPessoaLiveness({
  embeddingMovimento,
  embeddingFinal,
  threshold = 0.50
}) {
  const similaridade = similaridadeCosseno(
    embeddingMovimento,
    embeddingFinal
  );

  return {
    valida: similaridade >= threshold,
    similaridade
  };
}


// =========================================================
// LOCALIZAR IDENTIDADE JÁ CADASTRADA
// =========================================================

export function encontrarCorrespondenciaFacial({
  embedding,
  faces,
  threshold = 0.58
}) {
  if (
    !Array.isArray(embedding) ||
    !Array.isArray(faces)
  ) {
    return null;
  }

  let melhor = null;

  for (const face of faces) {
    const embeddingSalvo =
      Array.isArray(face?.embedding)
        ? face.embedding
        : [];

    const similaridade =
      similaridadeCosseno(
        embedding,
        embeddingSalvo
      );

    if (
      similaridade < threshold
    ) {
      continue;
    }

    if (
      !melhor ||
      similaridade >
        melhor.similaridade
    ) {
      melhor = {
        faceId:
          face?.id ?? null,
        usuarioId:
          face?.usuarioId ??
          face?.usuario?.id ??
          null,
        similaridade
      };
    }
  }

  return melhor;
}


// =========================================================
// CLASSIFICAR RECONHECIMENTO E AMBIGUIDADE
// Considera apenas a melhor amostra de cada usuario. Duas
// amostras do mesmo perfil nunca geram falsa ambiguidade.
// =========================================================

export function classificarCorrespondenciaFacial({
  embedding,
  faces,
  threshold = 0.58,
  margemMinima = 0.08
}) {
  if (
    !Array.isArray(embedding) ||
    !Array.isArray(faces)
  ) {
    return {
      status: "nao_encontrado",
      melhor: null,
      segundo: null,
      margem: null
    };
  }

  const melhoresPorUsuario =
    new Map();

  for (const face of faces) {
    const usuarioId =
      face?.usuarioId ??
      face?.usuario?.id ??
      null;

    if (usuarioId === null) {
      continue;
    }

    const similaridade =
      similaridadeCosseno(
        embedding,
        face?.embedding
      );

    if (similaridade < -0.5) {
      continue;
    }

    const atual =
      melhoresPorUsuario.get(
        usuarioId
      );

    if (
      !atual ||
      similaridade >
        atual.similaridade
    ) {
      melhoresPorUsuario.set(
        usuarioId,
        {
          face,
          faceId:
            face?.id ?? null,
          usuarioId,
          usuario:
            face?.usuario ?? null,
          similaridade
        }
      );
    }
  }

  const resultados =
    Array.from(
      melhoresPorUsuario.values()
    ).sort(
      (a, b) =>
        b.similaridade -
        a.similaridade
    );

  const melhor =
    resultados[0] || null;

  const segundo =
    resultados[1] || null;

  if (
    !melhor ||
    melhor.similaridade < threshold
  ) {
    return {
      status: "nao_encontrado",
      melhor,
      segundo,
      margem:
        melhor && segundo
          ? melhor.similaridade -
            segundo.similaridade
          : null
    };
  }

  const margem =
    segundo
      ? melhor.similaridade -
        segundo.similaridade
      : 1;

  if (
    segundo &&
    margem < margemMinima
  ) {
    return {
      status: "ambiguo",
      melhor,
      segundo,
      margem
    };
  }

  return {
    status: "reconhecido",
    melhor,
    segundo,
    margem
  };
}
