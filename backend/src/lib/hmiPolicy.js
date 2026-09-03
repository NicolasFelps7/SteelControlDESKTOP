const COMANDOS_IHM = Object.freeze({
  IHM_START: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"], ttlMs: 10_000, exigeConexao: true },
  IHM_STOP: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO", "OPERADOR"], ttlMs: 15_000, exigeConexao: false },
  IHM_RESET: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"], ttlMs: 20_000, exigeConexao: true },
  IHM_ACK: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO", "OPERADOR"], ttlMs: 20_000, exigeConexao: true },
  IHM_MODE_AUTO: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"], ttlMs: 20_000, exigeConexao: true },
  IHM_MODE_MANUAL: { roles: ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"], ttlMs: 20_000, exigeConexao: true }
});

export function normalizarComandoIhm(valor) {
  const comando = String(valor || "").trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(COMANDOS_IHM, comando) ? comando : null;
}

export function politicaComandoIhm(comando) {
  return COMANDOS_IHM[normalizarComandoIhm(comando)] || null;
}

export function cargoPodeComandoIhm(cargo, comando) {
  const politica = politicaComandoIhm(comando);
  if (!politica) return false;
  return politica.roles.includes(String(cargo || "").trim().toUpperCase());
}

export function expiraEmComandoIhm(comando, agora = Date.now()) {
  const politica = politicaComandoIhm(comando);
  if (!politica) return null;
  return new Date(Number(agora) + politica.ttlMs).toISOString();
}

export function comandoPayloadExpirado(payload, agora = Date.now()) {
  const valor = payload && typeof payload === "object" ? payload.expiresAt : null;
  if (!valor) return false;
  const ts = new Date(valor).getTime();
  return Number.isFinite(ts) && ts <= Number(agora);
}

export function avaliarPermissaoStartIhm({ maquina, estadoConexao, dadosExtras } = {}) {
  if (!maquina) return { permitido: false, motivo: "Máquina inválida." };
  if (maquina.paradaSeguranca) {
    return { permitido: false, motivo: maquina.motivoParada || "Existe uma parada de segurança ativa." };
  }

  if (String(maquina.status || "").toLowerCase().includes("manuten")) {
    return { permitido: false, motivo: "A máquina está marcada para manutenção." };
  }

  const acimaAtencao =
    Number(maquina.temperatura) >= Number(maquina.tempAtencao) ||
    Number(maquina.consumoEnergia) >= Number(maquina.energiaAtencao) ||
    Number(maquina.vibracao) >= Number(maquina.vibracaoAtencao);

  if (acimaAtencao) {
    return { permitido: false, motivo: "Há variável de processo acima do limite de atenção." };
  }

  if (maquina.modoSimulacao === false) {
    if (String(estadoConexao?.codigo || "").toUpperCase() !== "CONECTADA") {
      return { permitido: false, motivo: "START remoto exige telemetria recente e conexão estável." };
    }

    const intertravamentos = dadosExtras?.hmi?.interlocks || {};
    if (intertravamentos.startPermitted !== true) {
      return { permitido: false, motivo: "O equipamento ainda não confirmou a cadeia física de intertravamentos para START remoto." };
    }
    if (intertravamentos.estopOk === false || intertravamentos.safetyDoorClosed === false || intertravamentos.guardOk === false) {
      return { permitido: false, motivo: "Um intertravamento físico informou condição insegura." };
    }
  }

  return { permitido: true, motivo: null };
}

export function controleRemotoIhmHabilitado(maquina) {
  if (maquina?.modoSimulacao !== false) return true;
  return maquina?.integracaoMeta?.hmi?.remoteControlEnabled === true;
}
