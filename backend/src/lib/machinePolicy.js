export function podeAcionarSimulacao(cargo) {
  return [
    "ADMINISTRADOR",
    "SUPERVISOR"
  ].includes(
    String(cargo || "")
      .trim()
      .toUpperCase()
  );
}

function timestampSeguro(valor) {
  if (!valor) {
    return null;
  }

  const ts = new Date(valor).getTime();
  return Number.isFinite(ts) ? ts : null;
}

export function calcularEstadoConexao(
  maquina,
  agora = Date.now()
) {
  if (maquina?.modoSimulacao !== false) {
    return {
      codigo: "SIMULACAO",
      conectado: false,
      texto: "Modo simulação",
      detalhe: "Dados gerados pelo SteelControl",
      ultimaLeituraEm: null,
      ultimoSinalEm: null,
      idadeSinalMs: null
    };
  }

  const intervalo =
    Math.max(
      500,
      Number(maquina?.intervaloLeitura) || 2000
    );

  const limiteEstavelMs =
    Math.max(3_000, intervalo * 2);

  const limiteOfflineMs =
    Math.max(
      10_000,
      Math.min(180_000, intervalo * 5)
    );

  const leituras =
    Array.isArray(maquina?.telemetria)
      ? maquina.telemetria
      : [];

  const ultimaLeituraHistorica =
    leituras
      .filter(item =>
        String(item?.origem || "")
          .trim()
          .toUpperCase() !== "SIMULADOR"
      )
      .map(item => timestampSeguro(item?.criadoEm))
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0] || null;

  const ultimaTelemetria =
    timestampSeguro(maquina?.ultimaTelemetriaEm) ||
    ultimaLeituraHistorica;

  const heartbeat =
    timestampSeguro(maquina?.ultimoHeartbeatEm);

  // O heartbeat é emitido apenas depois que o Edge/controlador conseguiu abrir
  // o driver da máquina. Portanto ele representa "equipamento pronto/online",
  // mesmo quando naquele ciclo não existe um novo pacote de telemetria.
  const idadeHeartbeatMs =
    heartbeat
      ? Math.max(0, agora - heartbeat)
      : null;

  // O Edge envia heartbeat a cada ~10 s. A janela estável precisa ser maior que
  // esse período para o badge não oscilar entre ONLINE/INSTÁVEL a cada ciclo.
  const limiteHeartbeatEstavelMs =
    Math.max(15_000, intervalo * 8);

  const limiteHeartbeatOfflineMs =
    Math.max(35_000, intervalo * 18);

  const ultimoSinal =
    Math.max(
      ultimaTelemetria || 0,
      heartbeat || 0
    ) || null;

  if (!ultimoSinal) {
    return {
      codigo: "OFFLINE",
      conectado: false,
      texto: "Máquina offline",
      detalhe:
        maquina?.statusConexao === "Não configurada"
          ? "Conexão ainda não configurada"
          : "Aguardando primeiro sinal do equipamento",
      ultimaLeituraEm:
        ultimaTelemetria
          ? new Date(ultimaTelemetria).toISOString()
          : null,
      ultimoSinalEm: null,
      idadeSinalMs: null
    };
  }

  const idadeSinalMs =
    Math.max(0, agora - ultimoSinal);

  // Heartbeat recente = driver conectado e equipamento disponível no Edge.
  // Não exigimos uma mudança de sensor para chamar a máquina de online.
  if (
    idadeHeartbeatMs !== null &&
    idadeHeartbeatMs <= limiteHeartbeatEstavelMs
  ) {
    return {
      codigo: "CONECTADA",
      conectado: true,
      texto: "Máquina online",
      detalhe:
        ultimaTelemetria && agora - ultimaTelemetria <= limiteOfflineMs
          ? "Equipamento conectado • telemetria ativa"
          : "Equipamento conectado ao SteelControl Edge",
      ultimaLeituraEm:
        ultimaTelemetria
          ? new Date(ultimaTelemetria).toISOString()
          : null,
      ultimoSinalEm: new Date(heartbeat).toISOString(),
      idadeSinalMs: idadeHeartbeatMs
    };
  }

  // Um heartbeat que acabou de atrasar ainda é distinguido de um equipamento
  // realmente offline, dando margem para pequenas pausas de USB/rede.
  if (
    idadeHeartbeatMs !== null &&
    idadeHeartbeatMs <= limiteHeartbeatOfflineMs
  ) {
    return {
      codigo: "INSTAVEL",
      conectado: true,
      texto: "Conexão instável",
      detalhe: "Heartbeat do equipamento atrasado",
      ultimaLeituraEm:
        ultimaTelemetria
          ? new Date(ultimaTelemetria).toISOString()
          : null,
      ultimoSinalEm: new Date(heartbeat).toISOString(),
      idadeSinalMs: idadeHeartbeatMs
    };
  }

  const ultimaQualidade =
    leituras
      .slice()
      .reverse()
      .find(item => item?.qualidadeSinal !== null && item?.qualidadeSinal !== undefined)
      ?.qualidadeSinal;

  const qualidadeRuim =
    Number.isFinite(Number(ultimaQualidade)) &&
    Number(ultimaQualidade) < 35;

  if (
    idadeSinalMs <= limiteEstavelMs &&
    !qualidadeRuim
  ) {
    return {
      codigo: "CONECTADA",
      conectado: true,
      texto: "Máquina online",
      detalhe: "Dados em tempo real",
      ultimaLeituraEm:
        ultimaTelemetria
          ? new Date(ultimaTelemetria).toISOString()
          : null,
      ultimoSinalEm: new Date(ultimoSinal).toISOString(),
      idadeSinalMs
    };
  }

  if (idadeSinalMs <= limiteOfflineMs) {
    return {
      codigo: "INSTAVEL",
      conectado: true,
      texto: "Conexão instável",
      detalhe:
        qualidadeRuim
          ? "Qualidade de sinal baixa"
          : "Telemetria chegando com atraso",
      ultimaLeituraEm:
        ultimaTelemetria
          ? new Date(ultimaTelemetria).toISOString()
          : null,
      ultimoSinalEm: new Date(ultimoSinal).toISOString(),
      idadeSinalMs
    };
  }

  return {
    codigo: "OFFLINE",
    conectado: false,
    texto: "Máquina offline",
    detalhe: "Sem sinal do equipamento",
    ultimaLeituraEm:
      ultimaTelemetria
        ? new Date(ultimaTelemetria).toISOString()
        : null,
    ultimoSinalEm: new Date(ultimoSinal).toISOString(),
    idadeSinalMs
  };
}
