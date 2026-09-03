import { prisma } from "./prisma.js";
import { publicarEventoMaquina } from "./realtime.js";
import { calcularEstadoConexao } from "./machinePolicy.js";
import { calcularCiclosDesdeManutencao } from "./industrialPolicy.js";
import { registrarAuditoria } from "./audit.js";

function numero(valor, fallback = null) {
  if (valor === undefined || valor === null || valor === "") {
    return fallback;
  }

  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizarOrigem(valor) {
  const origem = String(valor || "EQUIPAMENTO")
    .trim()
    .toUpperCase();

  const permitidas = new Set([
    "ESP32",
    "CLP_PLC",
    "CONTROLADOR_ROBOTICO",
    "CNC",
    "GATEWAY_INDUSTRIAL",
    "EQUIPAMENTO",
    "MQTT",
    "MODBUS",
    "MODBUS_TCP",
    "OPC_UA",
    "HTTP_REST",
    "TCP_IP",
    "TESTE_ESP32",
    "DOBOT_GATEWAY",
    "DOBOT_MOCK",
    "DOBOT_REAL",
    "SIMULADOR"
  ]);

  return permitidas.has(origem) ? origem : "EQUIPAMENTO";
}

function dadosExtrasSeguros(valor) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  try {
    const serializado = JSON.stringify(valor);
    if (serializado.length > 24_000) {
      const erro = new Error("Dados extras da telemetria excedem o limite permitido.");
      erro.statusCode = 400;
      throw erro;
    }
    return JSON.parse(serializado);
  } catch (erro) {
    if (erro?.statusCode) throw erro;
    const novo = new Error("dadosExtras deve ser um objeto JSON válido.");
    novo.statusCode = 400;
    throw novo;
  }
}

export function validarLimitesMaquina(limites) {
  const tempAtencao = numero(limites.tempAtencao, 55);
  const tempCritica = numero(limites.tempCritica, 70);
  const energiaAtencao = numero(limites.energiaAtencao, 80);
  const energiaCritica = numero(limites.energiaCritica, 90);
  const vibracaoAtencao = numero(limites.vibracaoAtencao, 4);
  const vibracaoCritica = numero(limites.vibracaoCritica, 7);
  const ciclosManutencao = Math.trunc(numero(limites.ciclosManutencao, 1000));

  if (
    tempCritica <= tempAtencao ||
    energiaCritica <= energiaAtencao ||
    vibracaoCritica <= vibracaoAtencao ||
    energiaAtencao < 0 ||
    energiaCritica > 100 ||
    ciclosManutencao <= 0
  ) {
    return {
      valido: false,
      mensagem:
        "Limites críticos devem ser maiores que os limites de atenção. A carga elétrica deve ficar entre 0 e 100% e o intervalo de manutenção deve ser positivo."
    };
  }

  return {
    valido: true,
    valores: {
      tempAtencao,
      tempCritica,
      energiaAtencao,
      energiaCritica,
      vibracaoAtencao,
      vibracaoCritica,
      ciclosManutencao
    }
  };
}

export function avaliarTelemetria(maquina, leitura = {}) {
  const temperatura = numero(leitura.temperatura, maquina.temperatura);
  const vibracao = numero(leitura.vibracao, maquina.vibracao || 0);
  const corrente = numero(leitura.corrente, maquina.corrente || 0);
  const producao = Math.trunc(numero(leitura.producao, maquina.producao || 0));
  const ciclos = Math.trunc(numero(leitura.ciclos, maquina.ciclos || 0));
  // Compatibilidade: o nome do campo permanece consumoEnergia, mas sua unidade
  // oficial é percentual normalizado de carga elétrica (0 a 100%).
  const consumoEnergia = numero(leitura.consumoEnergia, maquina.consumoEnergia || 0);
  const qualidadeSinal = leitura.qualidadeSinal === undefined
    ? null
    : Math.max(0, Math.min(100, Math.trunc(numero(leitura.qualidadeSinal, 0))));
  const latenciaMs = leitura.latenciaMs === undefined
    ? null
    : Math.max(0, Math.trunc(numero(leitura.latenciaMs, 0)));
  const dadosExtras = dadosExtrasSeguros(leitura.dadosExtras);

  if (
    temperatura < -50 || temperatura > 250 ||
    vibracao < 0 || vibracao > 100 ||
    corrente < 0 || corrente > 1000 ||
    producao < 0 || ciclos < 0 ||
    consumoEnergia < 0 || consumoEnergia > 100
  ) {
    const erro = new Error("Telemetria fora dos limites físicos permitidos.");
    erro.statusCode = 400;
    throw erro;
  }

  const criticos = [];
  const avisos = [];

  if (temperatura >= maquina.tempCritica) {
    criticos.push(`Temperatura crítica: ${temperatura.toFixed(1)} °C`);
  } else if (temperatura >= maquina.tempAtencao) {
    avisos.push(`Temperatura elevada: ${temperatura.toFixed(1)} °C`);
  }

  if (consumoEnergia >= maquina.energiaCritica) {
    criticos.push(`Carga elétrica crítica: ${consumoEnergia.toFixed(1)}%`);
  } else if (consumoEnergia >= maquina.energiaAtencao) {
    avisos.push(`Carga elétrica elevada: ${consumoEnergia.toFixed(1)}%`);
  }

  if (vibracao >= maquina.vibracaoCritica) {
    criticos.push(`Vibração crítica: ${vibracao.toFixed(2)} mm/s`);
  } else if (vibracao >= maquina.vibracaoAtencao) {
    avisos.push(`Vibração elevada: ${vibracao.toFixed(2)} mm/s`);
  }

  const ciclosDesdeManutencao = calcularCiclosDesdeManutencao(
    ciclos,
    maquina.ciclosUltimaManutencao
  );
  const manutencaoPorCiclo = ciclosDesdeManutencao >= maquina.ciclosManutencao;

  let status = "Ligada";
  let manutencao = "Normal";
  let alerta = null;
  let paradaSeguranca = Boolean(maquina.paradaSeguranca);
  let motivoParada = maquina.motivoParada || null;
  let requerParada = false;
  const hmiRunning = dadosExtras?.hmi?.running;

  if (criticos.length) {
    status = "Parada de segurança";
    manutencao = "Intervenção imediata necessária";
    paradaSeguranca = true;
    motivoParada = criticos.join(" | ");
    requerParada = true;
    alerta = { tipo: "CRÍTICO", mensagem: motivoParada };
  } else if (paradaSeguranca) {
    status = "Parada de segurança";
    manutencao = "Aguardando liberação do operador";
  } else if (hmiRunning === false) {
    // Estado operacional vindo do controlador. Isto não ignora os limites:
    // condições críticas continuam tendo prioridade e acionam a segurança.
    status = "Desligada";
    manutencao = "Normal";
  } else if (avisos.length) {
    status = "Alerta";
    manutencao = "Acompanhar condição operacional";
    alerta = { tipo: "ATENÇÃO", mensagem: avisos.join(" | ") };
  } else if (manutencaoPorCiclo) {
    status = "Manutenção";
    manutencao = "Manutenção preventiva necessária";
    alerta = {
      tipo: "MANUTENÇÃO",
      mensagem: `${ciclosDesdeManutencao} ciclos desde a última manutenção (limite: ${maquina.ciclosManutencao}).`
    };
  }

  return {
    leitura: {
      temperatura,
      vibracao,
      corrente,
      producao,
      ciclos,
      consumoEnergia,
      qualidadeSinal,
      latenciaMs,
      dadosExtras
    },
    ciclosDesdeManutencao,
    status,
    manutencao,
    alerta,
    paradaSeguranca,
    motivoParada,
    requerParada
  };
}

async function deveCriarAlerta(maquinaId, tipo, mensagem) {
  const ultimo = await prisma.alerta.findFirst({
    where: { maquinaId },
    orderBy: { criadoEm: "desc" }
  });

  if (!ultimo) return true;

  const recente = Date.now() - new Date(ultimo.criadoEm).getTime() < 60_000;
  return !(recente && ultimo.tipo === tipo && ultimo.mensagem === mensagem);
}

async function comandoParadaPendente(maquinaId) {
  return prisma.comandoMaquina.findFirst({
    where: {
      maquinaId,
      comando: "PARAR_SEGURANCA",
      status: { in: ["PENDENTE", "ENTREGUE"] }
    },
    select: { id: true }
  });
}

function resumoTempoReal(maquinaAtual, avaliacao, origem, agora) {
  const leituraAtual = {
    ...avaliacao.leitura,
    origem,
    criadoEm: agora
  };

  const snapshot = {
    id: maquinaAtual.id,
    nome: maquinaAtual.nome,
    setor: maquinaAtual.setor,
    controlador: maquinaAtual.controlador,
    protocolo: maquinaAtual.protocolo,
    modoSimulacao: maquinaAtual.modoSimulacao,
    intervaloLeitura: maquinaAtual.intervaloLeitura,
    statusConexao: maquinaAtual.statusConexao,
    ultimaTelemetriaEm: maquinaAtual.ultimaTelemetriaEm,
    ultimoHeartbeatEm: maquinaAtual.ultimoHeartbeatEm,
    temperatura: maquinaAtual.temperatura,
    vibracao: maquinaAtual.vibracao,
    corrente: maquinaAtual.corrente,
    producao: maquinaAtual.producao,
    ciclos: maquinaAtual.ciclos,
    consumoEnergia: maquinaAtual.consumoEnergia,
    status: maquinaAtual.status,
    manutencao: maquinaAtual.manutencao,
    paradaSeguranca: maquinaAtual.paradaSeguranca,
    motivoParada: maquinaAtual.motivoParada,
    telemetria: [leituraAtual]
  };

  snapshot.estadoConexao = calcularEstadoConexao(snapshot, agora.getTime());
  delete snapshot.telemetria;
  snapshot.qualidadeSinal = avaliacao.leitura.qualidadeSinal;
  snapshot.latenciaMs = avaliacao.leitura.latenciaMs;
  snapshot.dadosExtras = avaliacao.leitura.dadosExtras;
  snapshot.origem = origem;
  snapshot.ciclosDesdeManutencao = avaliacao.ciclosDesdeManutencao;
  snapshot.em = agora.toISOString();
  return snapshot;
}

export async function processarTelemetria({
  maquina,
  dados = {},
  origem = "EQUIPAMENTO"
}) {
  const avaliacao = avaliarTelemetria(maquina, dados);
  const agora = new Date();
  const origemNormalizada = normalizarOrigem(origem);
  const criarAlerta = avaliacao.alerta
    ? await deveCriarAlerta(
        maquina.id,
        avaliacao.alerta.tipo,
        avaliacao.alerta.mensagem
      )
    : false;

  const alarmesDobot = avaliacao.leitura.dadosExtras?.dobot?.alarms;
  const alertaDobot = Array.isArray(alarmesDobot) && alarmesDobot.length
    ? {
        tipo: "DOBOT",
        mensagem: `Dobot Magician reportou ${alarmesDobot.length} alarme(s) ativo(s): ${alarmesDobot.slice(0, 12).join(", ")}.`
      }
    : null;
  const criarAlertaDobot = alertaDobot
    ? await deveCriarAlerta(maquina.id, alertaDobot.tipo, alertaDobot.mensagem)
    : false;

  const deveEnfileirarParada =
    avaliacao.requerParada &&
    maquina.modoSimulacao === false &&
    !maquina.paradaSeguranca;

  const paradaPendente = deveEnfileirarParada
    ? await comandoParadaPendente(maquina.id)
    : null;

  const primeiraLeituraReal =
    origemNormalizada !== "SIMULADOR" && !maquina.ultimaTelemetriaEm;
  const mudouEstado =
    avaliacao.status !== maquina.status ||
    avaliacao.paradaSeguranca !== Boolean(maquina.paradaSeguranca);

  const maquinaData = {
    temperatura: avaliacao.leitura.temperatura,
    vibracao: avaliacao.leitura.vibracao,
    corrente: avaliacao.leitura.corrente,
    producao: avaliacao.leitura.producao,
    ciclos: avaliacao.leitura.ciclos,
    consumoEnergia: avaliacao.leitura.consumoEnergia,
    status: avaliacao.status,
    manutencao: avaliacao.manutencao,
    paradaSeguranca: avaliacao.paradaSeguranca,
    motivoParada: avaliacao.motivoParada,
    statusConexao:
      maquina.modoSimulacao === false ? "Conectada" : maquina.statusConexao,
    ...(origemNormalizada !== "SIMULADOR"
      ? { ultimaTelemetriaEm: agora, ultimoHeartbeatEm: agora }
      : {})
  };

  // Logs são eventos, não amostras. Isso evita dezenas de milhares de linhas/dia.
  if (primeiraLeituraReal || mudouEstado) {
    maquinaData.logs = {
      create: {
        mensagem: primeiraLeituraReal
          ? `Primeira telemetria real recebida de ${origemNormalizada}.`
          : `Estado operacional alterado: ${maquina.status} → ${avaliacao.status}.`
      }
    };
  }

  const operacoes = [
    prisma.maquina.update({ where: { id: maquina.id }, data: maquinaData }),
    prisma.telemetryReading.create({
      data: {
        maquinaId: maquina.id,
        ...avaliacao.leitura,
        status: avaliacao.status,
        origem: origemNormalizada,
        dadosExtras: avaliacao.leitura.dadosExtras
      }
    })
  ];

  if (criarAlerta && avaliacao.alerta) {
    operacoes.push(
      prisma.alerta.create({
        data: {
          maquinaId: maquina.id,
          tipo: avaliacao.alerta.tipo,
          mensagem: avaliacao.alerta.mensagem
        }
      })
    );
  }

  if (criarAlertaDobot && alertaDobot) {
    operacoes.push(
      prisma.alerta.create({
        data: {
          maquinaId: maquina.id,
          tipo: alertaDobot.tipo,
          mensagem: alertaDobot.mensagem
        }
      })
    );
  }

  if (deveEnfileirarParada && !paradaPendente) {
    operacoes.push(
      prisma.comandoMaquina.create({
        data: {
          maquinaId: maquina.id,
          comando: "PARAR_SEGURANCA",
          payload: { motivo: avaliacao.motivoParada, origem: "STEELCONTROL" }
        }
      })
    );
  }

  await prisma.$transaction(operacoes);

  // Auditoria registra somente eventos significativos, não cada amostra.
  if (primeiraLeituraReal || mudouEstado) {
    await registrarAuditoria({
      empresaId: maquina.empresaId,
      acao: primeiraLeituraReal ? "PRIMEIRA_TELEMETRIA" : "MUDANCA_ESTADO_MAQUINA",
      entidade: "MAQUINA",
      entidadeId: maquina.id,
      detalhes: {
        origem: origemNormalizada,
        statusAnterior: maquina.status,
        statusAtual: avaliacao.status,
        paradaSeguranca: avaliacao.paradaSeguranca
      }
    });
  }

  // Consulta apenas o estado atual; históricos continuam em endpoints próprios.
  const atualizada = await prisma.maquina.findUnique({
    where: { id: maquina.id }
  });

  const evento = resumoTempoReal(
    atualizada,
    avaliacao,
    origemNormalizada,
    agora
  );

  publicarEventoMaquina(maquina.id, "telemetria", evento);
  return atualizada;
}
