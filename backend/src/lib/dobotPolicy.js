export const DOBOT_LIMITS = Object.freeze({
  x: Object.freeze({ min: -320, max: 320 }),
  y: Object.freeze({ min: -320, max: 320 }),
  z: Object.freeze({ min: -20, max: 250 }),
  r: Object.freeze({ min: -180, max: 180 }),
  velocidade: Object.freeze({ min: 1, max: 60 })
});

const TTL_MS = Object.freeze({
  DOBOT_STOP: 15_000,
  DOBOT_CLEAR_ALARMS: 10_000,
  DOBOT_HOME: 8_000,
  DOBOT_PTP: 5_000,
  DOBOT_SUCTION_ON: 5_000,
  DOBOT_SUCTION_OFF: 5_000,
  DOBOT_GRIPPER_OPEN: 5_000,
  DOBOT_GRIPPER_CLOSE: 5_000
});

export function controleRemotoDobotHabilitado(maquina) {
  return maquina?.modoSimulacao === false &&
    maquina?.integracaoMeta?.dobot?.remoteControlEnabled === true;
}

export function expiraEmComandoDobot(comando, agora = Date.now()) {
  const ttl = TTL_MS[String(comando || "").toUpperCase()] || 5_000;
  return new Date(Number(agora) + ttl).toISOString();
}

export function validarPayloadDobot(comando, payload = {}) {
  if (comando !== "DOBOT_PTP") return {};
  const resultado = {};

  for (const campo of ["x", "y", "z", "r"]) {
    const valor = Number(payload?.[campo]);
    const limite = DOBOT_LIMITS[campo];
    if (!Number.isFinite(valor)) {
      const erro = new Error(`Informe ${campo.toUpperCase()} para o movimento PTP.`);
      erro.statusCode = 400;
      throw erro;
    }
    if (valor < limite.min || valor > limite.max) {
      const erro = new Error(
        `${campo.toUpperCase()} fora do envelope seguro (${limite.min} a ${limite.max}).`
      );
      erro.statusCode = 400;
      throw erro;
    }
    resultado[campo] = valor;
  }

  const velocidade = Number(payload?.velocidade ?? 30);
  if (
    !Number.isFinite(velocidade) ||
    velocidade < DOBOT_LIMITS.velocidade.min ||
    velocidade > DOBOT_LIMITS.velocidade.max
  ) {
    const erro = new Error(
      `Velocidade fora do limite seguro (${DOBOT_LIMITS.velocidade.min}% a ${DOBOT_LIMITS.velocidade.max}%).`
    );
    erro.statusCode = 400;
    throw erro;
  }

  resultado.velocidade = velocidade;
  return resultado;
}
