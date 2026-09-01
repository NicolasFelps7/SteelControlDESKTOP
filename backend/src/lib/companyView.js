export function empresaParaResposta(empresa) {
  if (!empresa || typeof empresa !== "object") {
    return empresa;
  }

  const {
    logoData,
    ...restante
  } = empresa;

  const temLogo = Boolean(
    logoData && restante.logoMime
  );

  // Bancos criados por versões antigas podem ter os bytes da logo, mas não
  // possuir logoUrl. A URL pública é reconstruída para que todos os painéis
  // continuem exibindo a identidade visual já cadastrada.
  const logoUrl = temLogo
    ? restante.logoUrl ||
      `/empresa/logo/${restante.id}?v=${
        new Date(
          restante.atualizadaEm ||
          Date.now()
        ).getTime()
      }`
    : null;

  return {
    ...restante,
    logoUrl,
    temLogo
  };
}
