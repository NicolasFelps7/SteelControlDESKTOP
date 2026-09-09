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
// MULTIPLOS TEMPLATES POR IDENTIDADE
// Compatibilidade total com registros antigos que armazenavam
// apenas um vetor diretamente no campo JSON "embedding".
// =========================================================

export function extrairTemplatesFaciais(valor) {
  // Legado: embedding: [512 numeros]
  if (Array.isArray(valor)) {
    return normalizarEmbedding(valor)
      ? [{ tipo: "legacy", embedding: valor }]
      : [];
  }

  if (!valor || typeof valor !== "object") {
    return [];
  }

  const templates = [];

  if (Array.isArray(valor.templates)) {
    for (const item of valor.templates) {
      const embedding = Array.isArray(item)
        ? item
        : item?.embedding;

      if (!normalizarEmbedding(embedding)) {
        continue;
      }

      templates.push({
        tipo:
          typeof item?.tipo === "string" && item.tipo.trim()
            ? item.tipo.trim().slice(0, 32)
            : "template",
        embedding
      });
    }
  }

  // Compatibilidade defensiva com possiveis formatos intermediarios.
  if (
    templates.length === 0 &&
    Array.isArray(valor.embedding) &&
    normalizarEmbedding(valor.embedding)
  ) {
    templates.push({
      tipo: "principal",
      embedding: valor.embedding
    });
  }

  return templates.slice(0, 3);
}

export function criarPacoteTemplatesFaciais({
  inicial,
  movimento,
  final
}) {
  const candidatos = [
    ["frontal_inicial", inicial],
    ["movimento", movimento],
    ["frontal_final", final]
  ];

  const templates = [];

  for (const [tipo, embedding] of candidatos) {
    if (!normalizarEmbedding(embedding)) {
      continue;
    }

    // Nao guarda copias praticamente identicas do mesmo frame.
    const duplicado = templates.some(item =>
      similaridadeCosseno(item.embedding, embedding) >= 0.99995
    );

    if (!duplicado) {
      templates.push({ tipo, embedding });
    }
  }

  return {
    versao: 2,
    estrategia: "multi-template-consensus",
    templates: templates.slice(0, 3)
  };
}

function pontuarContraTemplates(embedding, valorSalvo) {
  const templates = extrairTemplatesFaciais(valorSalvo);

  if (templates.length === 0) {
    return {
      score: -1,
      melhor: -1,
      segundo: -1,
      quantidade: 0,
      tipoMelhor: null
    };
  }

  const resultados = templates
    .map(item => ({
      tipo: item.tipo,
      similaridade: similaridadeCosseno(embedding, item.embedding)
    }))
    .filter(item => Number.isFinite(item.similaridade))
    .sort((a, b) => b.similaridade - a.similaridade);

  const melhor = resultados[0]?.similaridade ?? -1;
  const segundo = resultados[1]?.similaridade ?? melhor;

  // Com uma amostra antiga, preserva exatamente o comportamento legado.
  // Com 2/3 amostras, combina a melhor evidencia com a segunda melhor,
  // reduzindo a dependencia de um unico frame/pose.
  const score = resultados.length >= 2
    ? (melhor * 0.68) + (segundo * 0.32)
    : melhor;

  return {
    score,
    melhor,
    segundo,
    quantidade: resultados.length,
    tipoMelhor: resultados[0]?.tipo ?? null
  };
}

// =========================================================
// LOCALIZAR IDENTIDADE JA CADASTRADA
// Enrollment usa o MAIOR score individual entre templates para
// ser conservador e bloquear duplicidade mesmo se uma unica pose
// coincidir fortemente com outra identidade.
// =========================================================

export function encontrarCorrespondenciaFacial({
  embedding,
  faces,
  threshold = 0.58
}) {
  if (!Array.isArray(embedding) || !Array.isArray(faces)) {
    return null;
  }

  let melhor = null;

  for (const face of faces) {
    const templates = extrairTemplatesFaciais(face?.embedding);

    for (const template of templates) {
      const similaridade = similaridadeCosseno(
        embedding,
        template.embedding
      );

      if (similaridade < threshold) {
        continue;
      }

      if (!melhor || similaridade > melhor.similaridade) {
        melhor = {
          faceId: face?.id ?? null,
          usuarioId:
            face?.usuarioId ??
            face?.usuario?.id ??
            null,
          similaridade,
          templateTipo: template.tipo
        };
      }
    }
  }

  return melhor;
}

// =========================================================
// CLASSIFICAR RECONHECIMENTO E AMBIGUIDADE
// Cada perfil recebe um score de consenso entre seus templates.
// Duas amostras do mesmo usuario nunca geram falsa ambiguidade.
// =========================================================

export function classificarCorrespondenciaFacial({
  embedding,
  faces,
  threshold = 0.58,
  margemMinima = 0.08
}) {
  if (!Array.isArray(embedding) || !Array.isArray(faces)) {
    return {
      status: "nao_encontrado",
      melhor: null,
      segundo: null,
      margem: null
    };
  }

  const melhoresPorUsuario = new Map();

  for (const face of faces) {
    const usuarioId =
      face?.usuarioId ??
      face?.usuario?.id ??
      null;

    if (usuarioId === null) {
      continue;
    }

    const pontuacao = pontuarContraTemplates(
      embedding,
      face?.embedding
    );

    if (pontuacao.score < -0.5) {
      continue;
    }

    const atual = melhoresPorUsuario.get(usuarioId);

    if (!atual || pontuacao.score > atual.similaridade) {
      melhoresPorUsuario.set(usuarioId, {
        face,
        faceId: face?.id ?? null,
        usuarioId,
        usuario: face?.usuario ?? null,
        similaridade: pontuacao.score,
        melhorTemplate: pontuacao.melhor,
        quantidadeTemplates: pontuacao.quantidade,
        templateTipo: pontuacao.tipoMelhor
      });
    }
  }

  const resultados = Array.from(melhoresPorUsuario.values())
    .sort((a, b) => b.similaridade - a.similaridade);

  const melhor = resultados[0] || null;
  const segundo = resultados[1] || null;

  if (!melhor || melhor.similaridade < threshold) {
    return {
      status: "nao_encontrado",
      melhor,
      segundo,
      margem:
        melhor && segundo
          ? melhor.similaridade - segundo.similaridade
          : null
    };
  }

  const margem = segundo
    ? melhor.similaridade - segundo.similaridade
    : 1;

  if (segundo && margem < margemMinima) {
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
