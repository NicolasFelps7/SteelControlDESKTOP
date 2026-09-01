export function empresaParaResposta(empresa) {
  if (!empresa || typeof empresa !== "object") {
    return empresa;
  }

  const {
    logoData,
    ...restante
  } = empresa;

  return restante;
}
