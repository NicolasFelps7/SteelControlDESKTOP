export function calcularCiclosDesdeManutencao(
  ciclosAtuais,
  ciclosUltimaManutencao = 0
) {
  const atuais = Math.max(0, Math.trunc(Number(ciclosAtuais) || 0));
  const base = Math.max(0, Math.trunc(Number(ciclosUltimaManutencao) || 0));
  return Math.max(0, atuais - base);
}

export function dataLimiteReentrega(
  agora = Date.now(),
  leaseMs = 15_000
) {
  const momento = Number.isFinite(Number(agora)) ? Number(agora) : Date.now();
  const lease = Math.max(1_000, Number(leaseMs) || 15_000);
  return new Date(momento - lease);
}

export function comandoJaFinalizado(status) {
  return ["CONCLUIDO", "FALHOU", "CANCELADO"].includes(
    String(status || "").trim().toUpperCase()
  );
}


export function normalizarStatusAck(valor) {
  const status = String(valor || "").trim().toUpperCase();
  return ["CONCLUIDO", "FALHOU"].includes(status) ? status : null;
}
