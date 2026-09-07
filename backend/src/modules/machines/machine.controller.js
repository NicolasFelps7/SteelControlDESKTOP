import { prisma } from "../../lib/prisma.js";
import { registrarAuditoria } from "../../lib/audit.js";
import { podeAcionarSimulacao, calcularEstadoConexao } from "../../lib/machinePolicy.js";
import { gerarDeviceKey, hashDeviceKey, deviceKeyHint } from "../../lib/deviceSecurity.js";
import { processarTelemetria, validarLimitesMaquina } from "../../lib/telemetryService.js";
import { publicarEventoMaquina, assinarEventosMaquina, publicarEventoEmpresa } from "../../lib/realtime.js";
import { normalizarComandoIhm, politicaComandoIhm, cargoPodeComandoIhm, expiraEmComandoIhm, avaliarPermissaoStartIhm, controleRemotoIhmHabilitado } from "../../lib/hmiPolicy.js";

function ehAdministrador(req) {
  return req.auth?.cargo === "ADMINISTRADOR";
}

function exigirAdministrador(req, res) {
  if (ehAdministrador(req)) {
    return true;
  }

  res.status(403).json({
    mensagem: "Somente administradores podem gerenciar equipamentos."
  });
  return false;
}

function podeOperarSeguranca(cargo) {
  return ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"].includes(
    String(cargo || "").trim().toUpperCase()
  );
}

function whereEmpresa(req, id) {
  return {
    id: Number(id),
    empresaId: req.auth.empresaId,
    ativo: true
  };
}

function numeroOpcional(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function texto(valor, max = 180) {
  if (valor === undefined || valor === null) {
    return null;
  }

  const limpo = String(valor).trim();
  return limpo ? limpo.slice(0, max) : null;
}

function objetoJsonOpcional(valor, maxBytes = 16_000) {
  if (valor === undefined) return undefined;
  if (valor === null || valor === "") return null;
  if (typeof valor !== "object" || Array.isArray(valor)) {
    const erro = new Error("Metadados de integração devem ser um objeto JSON.");
    erro.statusCode = 400;
    throw erro;
  }
  const serializado = JSON.stringify(valor);
  if (serializado.length > maxBytes) {
    const erro = new Error("Metadados de integração excedem o limite permitido.");
    erro.statusCode = 400;
    throw erro;
  }
  return JSON.parse(serializado);
}

const DOBOT_COMMANDS = new Set([
  "DOBOT_HOME",
  "DOBOT_STOP",
  "DOBOT_CLEAR_ALARMS",
  "DOBOT_PTP",
  "DOBOT_SUCTION_ON",
  "DOBOT_SUCTION_OFF",
  "DOBOT_GRIPPER_OPEN",
  "DOBOT_GRIPPER_CLOSE"
]);

function validarPayloadDobot(comando, payload = {}) {
  if (comando !== "DOBOT_PTP") return {};
  const resultado = {};
  for (const campo of ["x", "y", "z", "r"]) {
    const valor = Number(payload?.[campo]);
    if (!Number.isFinite(valor)) {
      const erro = new Error(`Informe ${campo.toUpperCase()} para o movimento PTP.`);
      erro.statusCode = 400;
      throw erro;
    }
    resultado[campo] = valor;
  }
  if (resultado.x < -500 || resultado.x > 500 || resultado.y < -500 || resultado.y > 500 || resultado.z < -50 || resultado.z > 500 || resultado.r < -360 || resultado.r > 360) {
    const erro = new Error("Coordenadas PTP fora da faixa de segurança aceita pelo SteelControl.");
    erro.statusCode = 400;
    throw erro;
  }
  const velocidade = Number(payload?.velocidade ?? 40);
  resultado.velocidade = Math.max(1, Math.min(100, Number.isFinite(velocidade) ? velocidade : 40));
  return resultado;
}

function metaIhmComPatch(maquina, patch = {}) {
  const metaAtual = maquina?.integracaoMeta && typeof maquina.integracaoMeta === "object" && !Array.isArray(maquina.integracaoMeta)
    ? maquina.integracaoMeta
    : {};
  const hmiAtual = metaAtual.hmi && typeof metaAtual.hmi === "object" && !Array.isArray(metaAtual.hmi)
    ? metaAtual.hmi
    : {};
  return {
    ...metaAtual,
    hmi: {
      enabled: true,
      remoteControlEnabled: Boolean(hmiAtual.remoteControlEnabled),
      ...hmiAtual,
      ...patch
    }
  };
}

function estadoHmiAtual(maquina, dadosExtras = null) {
  const hmiTelemetria = dadosExtras?.hmi || {};
  const hmiMeta = maquina?.integracaoMeta?.hmi || {};
  const simulation = maquina?.modoSimulacao !== false;
  const running = simulation && typeof hmiMeta.running === "boolean"
    ? hmiMeta.running
    : typeof hmiTelemetria.running === "boolean"
      ? hmiTelemetria.running
      : typeof hmiMeta.running === "boolean"
        ? hmiMeta.running
        : String(maquina?.status || "").toLowerCase() === "ligada";
  return {
    running,
    mode: String(simulation ? (hmiMeta.mode || hmiTelemetria.mode || "AUTO") : (hmiTelemetria.mode || hmiMeta.mode || "AUTO")).toUpperCase(),
    alarm: Boolean(hmiTelemetria.alarm || maquina?.paradaSeguranca),
    interlocks: hmiTelemetria.interlocks || null,
    sensors: hmiTelemetria.sensors || null
  };
}

function formatarData(data) {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime())
    ? "-"
    : valor.toLocaleDateString("pt-BR");
}

function formatarHora(data) {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime())
    ? "-"
    : valor.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
}

function ocultarSegredos(maquina) {
  if (!maquina) {
    return maquina;
  }

  const { deviceKeyHash, ...segura } = maquina;
  return segura;
}

function formatarMaquinaResposta(maquina) {
  const estadoConexao = calcularEstadoConexao(maquina);
  const segura = ocultarSegredos(maquina);
  const dadosExtrasAtuais = Array.isArray(maquina.telemetria) && maquina.telemetria.length
    ? maquina.telemetria[0]?.dadosExtras ?? null
    : null;

  return {
    ...segura,
    estadoConexao,
    dadosExtrasAtuais,
    logs: Array.isArray(maquina.logs)
      ? maquina.logs
          .slice()
          .reverse()
          .map(item => item.mensagem)
      : segura.logs,
    alertas: Array.isArray(maquina.alertas)
      ? maquina.alertas.map(item => ({
          id: item.id,
          tipo: item.tipo,
          mensagem: item.mensagem,
          criadoEm: item.criadoEm,
          data: formatarHora(item.criadoEm)
        }))
      : segura.alertas,
    manutencoes: Array.isArray(maquina.manutencoes)
      ? maquina.manutencoes.map(item => ({
          id: item.id,
          tipo: item.tipo,
          tecnico: item.tecnico,
          descricao: item.descricao,
          criadaEm: item.criadaEm,
          data: formatarData(item.criadaEm),
          horario: formatarHora(item.criadaEm)
        }))
      : segura.manutencoes,
    telemetria: Array.isArray(maquina.telemetria)
      ? maquina.telemetria.slice().reverse()
      : segura.telemetria
  };
}

async function carregarCompleta(req, id) {
  return prisma.maquina.findFirst({
    where: whereEmpresa(req, id),
    include: {
      logs: {
        orderBy: { id: "desc" },
        take: 30
      },
      alertas: {
        orderBy: { id: "desc" },
        take: 20
      },
      manutencoes: {
        where: { ativa: true },
        orderBy: { id: "desc" },
        take: 50
      },
      telemetria: {
        orderBy: { criadoEm: "desc" },
        take: 60
      }
    }
  });
}

function limitesDoBody(body, atual = {}) {
  return {
    tempAtencao:
      numeroOpcional(body.tempAtencao) ?? atual.tempAtencao ?? 55,
    tempCritica:
      numeroOpcional(body.tempCritica) ?? atual.tempCritica ?? 70,
    energiaAtencao:
      numeroOpcional(body.energiaAtencao) ?? atual.energiaAtencao ?? 80,
    energiaCritica:
      numeroOpcional(body.energiaCritica) ?? atual.energiaCritica ?? 90,
    vibracaoAtencao:
      numeroOpcional(body.vibracaoAtencao) ?? atual.vibracaoAtencao ?? 4,
    vibracaoCritica:
      numeroOpcional(body.vibracaoCritica) ?? atual.vibracaoCritica ?? 7,
    ciclosManutencao:
      numeroOpcional(body.ciclosManutencao) ?? atual.ciclosManutencao ?? 1000
  };
}

export async function listar(req, res, next) {
  try {
    const maquinas = await prisma.maquina.findMany({
      where: {
        empresaId: req.auth.empresaId,
        ativo: true
      },
      orderBy: { id: "desc" },
      include: {
        telemetria: {
          orderBy: { criadoEm: "desc" },
          take: 1
        }
      }
    });

    res.json(
      maquinas.map(maquina => {
        const { telemetria, deviceKeyHash, ...dados } = maquina;
        return {
          ...dados,
          estadoConexao: calcularEstadoConexao(maquina)
        };
      })
    );
  } catch (erro) {
    next(erro);
  }
}

export async function criar(req, res, next) {
  try {
    if (!exigirAdministrador(req, res)) {
      return;
    }

    const nome = texto(req.body.nome, 120);
    const setor = texto(req.body.setor, 120);
    const modelo = texto(req.body.modelo, 120);
    const codigo = texto(req.body.codigo, 80);

    if (!nome || !setor || !modelo || !codigo) {
      return res.status(400).json({
        mensagem: "Nome, setor, modelo e código são obrigatórios."
      });
    }

    const validacaoLimites = validarLimitesMaquina(
      limitesDoBody(req.body)
    );

    if (!validacaoLimites.valido) {
      return res.status(400).json({
        mensagem: validacaoLimites.mensagem
      });
    }

    const controlador = texto(req.body.controlador, 80);
    const protocolo = texto(req.body.protocolo, 50);
    const host = texto(req.body.host, 255);
    const endpoint = texto(req.body.endpoint, 500);
    const modoSimulacao = req.body.modoSimulacao !== false;

    const deviceKey = gerarDeviceKey();

    const maquina = await prisma.maquina.create({
      data: {
        empresaId: req.auth.empresaId,
        nome,
        setor,
        modelo,
        codigo,
        fabricante: texto(req.body.fabricante, 120),
        tipo: texto(req.body.tipo, 120),
        descricao: texto(req.body.descricao, 1000),
        integracaoMeta: objetoJsonOpcional(req.body.integracaoMeta) ?? null,
        controlador,
        protocolo,
        host,
        porta: numeroOpcional(req.body.porta),
        unitId: numeroOpcional(req.body.unitId),
        endpoint,
        topico: texto(req.body.topico, 255),
        intervaloLeitura: Math.min(
          60_000,
          Math.max(500, numeroOpcional(req.body.intervaloLeitura) || 2000)
        ),
        statusConexao:
          controlador || protocolo || host || endpoint
            ? "Configurada"
            : "Não configurada",
        modoSimulacao,
        deviceKeyHash: hashDeviceKey(deviceKey),
        deviceKeyHint: deviceKeyHint(deviceKey),
        ...validacaoLimites.valores,
        proximaManutencao: `No ciclo ${validacaoLimites.valores.ciclosManutencao}`,
        logs: {
          create: [
            { mensagem: "Máquina cadastrada no sistema." },
            {
              mensagem: modoSimulacao
                ? "Monitoramento em modo simulação."
                : "Equipamento real aguardando primeiro sinal."
            }
          ]
        }
      }
    });

    await registrarAuditoria({
      req,
      acao: "CRIAR",
      entidade: "MAQUINA",
      entidadeId: maquina.id,
      detalhes: {
        nome: maquina.nome,
        codigo: maquina.codigo,
        controlador: maquina.controlador,
        protocolo: maquina.protocolo,
        modoSimulacao: maquina.modoSimulacao
      }
    });

    publicarEventoEmpresa(
      req.auth.empresaId,
      "maquina.criada",
      { maquinaId: maquina.id }
    );

    res.status(201).json({
      mensagem: "Máquina cadastrada com sucesso.",
      maquina: ocultarSegredos(maquina),
      deviceKey,
      deviceKeyAviso:
        "Guarde esta chave. Por segurança ela não é exibida novamente. Se perder, gere uma nova no SteelControl."
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({
        mensagem: "Já existe uma máquina com esse código nesta empresa."
      });
    }
    next(erro);
  }
}

export async function buscar(req, res, next) {
  try {
    const maquina = await carregarCompleta(req, req.params.id);

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    res.json(formatarMaquinaResposta(maquina));
  } catch (erro) {
    next(erro);
  }
}

export async function atualizar(req, res, next) {
  try {
    if (!exigirAdministrador(req, res)) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({
        mensagem: "Identificador de máquina inválido."
      });
    }

    const atual = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!atual) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    const data = {};
    if (req.body.integracaoMeta !== undefined) {
      data.integracaoMeta = objetoJsonOpcional(req.body.integracaoMeta);
    }

    const camposTexto = {
      nome: 120,
      setor: 120,
      modelo: 120,
      fabricante: 120,
      codigo: 80,
      tipo: 120,
      descricao: 1000,
      controlador: 80,
      protocolo: 50,
      host: 255,
      endpoint: 500,
      topico: 255
    };

    for (const [campo, limite] of Object.entries(camposTexto)) {
      if (req.body[campo] !== undefined) {
        data[campo] = texto(req.body[campo], limite);
      }
    }

    if (
      !(data.nome ?? atual.nome) ||
      !(data.setor ?? atual.setor) ||
      !(data.modelo ?? atual.modelo) ||
      !(data.codigo ?? atual.codigo)
    ) {
      return res.status(400).json({
        mensagem: "Nome, setor, modelo e código não podem ficar vazios."
      });
    }

    if (req.body.porta !== undefined) {
      data.porta = numeroOpcional(req.body.porta);
    }

    if (req.body.unitId !== undefined) {
      data.unitId = numeroOpcional(req.body.unitId);
    }

    if (req.body.intervaloLeitura !== undefined) {
      const intervalo = numeroOpcional(req.body.intervaloLeitura);
      if (!intervalo) {
        return res.status(400).json({ mensagem: "Intervalo de leitura inválido." });
      }
      data.intervaloLeitura = Math.min(60_000, Math.max(500, intervalo));
    }

    const validacaoLimites = validarLimitesMaquina(
      limitesDoBody(req.body, atual)
    );

    if (!validacaoLimites.valido) {
      return res.status(400).json({ mensagem: validacaoLimites.mensagem });
    }

    Object.assign(data, validacaoLimites.valores);
    data.proximaManutencao =
      `No ciclo ${(atual.ciclosUltimaManutencao || 0) + validacaoLimites.valores.ciclosManutencao}`;

    if (typeof req.body.modoSimulacao === "boolean") {
      data.modoSimulacao = req.body.modoSimulacao;
    }

    const controladorFinal = data.controlador ?? atual.controlador;
    const protocoloFinal = data.protocolo ?? atual.protocolo;
    const hostFinal = data.host ?? atual.host;
    const endpointFinal = data.endpoint ?? atual.endpoint;

    data.statusConexao =
      controladorFinal || protocoloFinal || hostFinal || endpointFinal
        ? "Configurada"
        : "Não configurada";

    let novaDeviceKey = null;
    if (
      (data.modoSimulacao === false || atual.modoSimulacao === false) &&
      !atual.deviceKeyHash
    ) {
      novaDeviceKey = gerarDeviceKey();
      data.deviceKeyHash = hashDeviceKey(novaDeviceKey);
      data.deviceKeyHint = deviceKeyHint(novaDeviceKey);
    }

    const maquina = await prisma.maquina.update({
      where: { id },
      data
    });

    await registrarAuditoria({
      req,
      acao: "ATUALIZAR",
      entidade: "MAQUINA",
      entidadeId: id,
      detalhes: { campos: Object.keys(data).filter(c => c !== "deviceKeyHash") }
    });

    publicarEventoMaquina(id, "configuracao", ocultarSegredos(maquina));
    publicarEventoEmpresa(
      req.auth.empresaId,
      "maquina.atualizada",
      { maquinaId: id }
    );

    res.json({
      mensagem: "Máquina atualizada com sucesso.",
      maquina: ocultarSegredos(maquina),
      ...(novaDeviceKey
        ? {
            deviceKey: novaDeviceKey,
            deviceKeyAviso:
              "Uma chave de dispositivo foi gerada. Guarde-a para configurar o equipamento."
          }
        : {})
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({
        mensagem: "Já existe uma máquina com esse código nesta empresa."
      });
    }
    next(erro);
  }
}

export async function excluir(req, res, next) {
  try {
    if (!exigirAdministrador(req, res)) {
      return;
    }

    const id = Number(req.params.id);
    const atual = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!atual) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    await prisma.maquina.update({
      where: { id },
      data: {
        ativo: false,
        excluidaEm: new Date(),
        excluidaPorId: req.auth.usuarioId,
        status: "Desativada",
        logs: {
          create: {
            mensagem: "Máquina desativada por administrador. Histórico preservado."
          }
        }
      }
    });

    await registrarAuditoria({
      req,
      acao: "DESATIVAR",
      entidade: "MAQUINA",
      entidadeId: id,
      detalhes: { nome: atual.nome, codigo: atual.codigo }
    });

    publicarEventoEmpresa(
      req.auth.empresaId,
      "maquina.desativada",
      { maquinaId: id }
    );

    res.json({
      mensagem: "Máquina desativada com sucesso. O histórico foi preservado."
    });
  } catch (erro) {
    next(erro);
  }
}

export async function telemetria(req, res, next) {
  try {
    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id),
      select: { id: true }
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    const limite = Math.min(500, Math.max(1, Number(req.query.limit) || 120));
    const leituras = await prisma.telemetryReading.findMany({
      where: { maquinaId: id },
      orderBy: { criadoEm: "desc" },
      take: limite
    });

    res.json(leituras.reverse());
  } catch (erro) {
    next(erro);
  }
}

export async function receberTelemetriaReal(req, res, next) {
  try {
    if (!podeAcionarSimulacao(req.auth?.cargo)) {
      return res.status(403).json({
        mensagem: "Somente administradores e supervisores podem enviar telemetria de teste."
      });
    }

    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    if (maquina.modoSimulacao !== false) {
      return res.status(409).json({
        mensagem: "Coloque a máquina em 'Equipamento real' antes de enviar telemetria real."
      });
    }

    await processarTelemetria({
      maquina,
      dados: req.body,
      origem: req.body.origem || maquina.controlador || maquina.protocolo || "EQUIPAMENTO"
    });

    return buscar(req, res, next);
  } catch (erro) {
    next(erro);
  }
}

export async function simular(req, res, next) {
  try {
    if (!podeAcionarSimulacao(req.auth?.cargo)) {
      return res.status(403).json({
        mensagem: "Somente administradores e supervisores podem acionar o simulador."
      });
    }

    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    if (!maquina.modoSimulacao) {
      return res.status(409).json({
        mensagem: "Esta máquina está em modo real. A simulação está desativada."
      });
    }

    const parado = Boolean(maquina.paradaSeguranca);
    const hmi = estadoHmiAtual(maquina);
    const rodando = !parado && hmi.running !== false;
    const fase = maquina.ciclos % 6;
    const dados = {
      temperatura: rodando
        ? 34 + Math.random() * 12
        : Math.max(28, maquina.temperatura - 1.5),
      vibracao: rodando ? 0.8 + Math.random() * 1.8 : 0.15 + Math.random() * 0.2,
      corrente: rodando ? 0.6 + Math.random() * 1.2 : 0.05 + Math.random() * 0.08,
      producao: rodando
        ? maquina.producao + Math.floor(Math.random() * 4)
        : maquina.producao,
      ciclos: rodando
        ? maquina.ciclos + 1
        : maquina.ciclos,
      consumoEnergia: rodando ? 45 + Math.random() * 22 : 8 + Math.random() * 5,
      qualidadeSinal: 100,
      latenciaMs: 0,
      dadosExtras: {
        hmi: {
          running: rodando,
          mode: hmi.mode || "AUTO",
          alarm: parado,
          interlocks: {
            startPermitted: !parado,
            estopOk: !parado,
            safetyDoorClosed: true,
            guardOk: true
          },
          sensors: {
            entry: rodando && fase === 0,
            middle: rodando && [2, 3].includes(fase),
            exit: rodando && fase === 5
          }
        }
      }
    };

    await processarTelemetria({
      maquina,
      dados,
      origem: "SIMULADOR"
    });

    return buscar(req, res, next);
  } catch (erro) {
    next(erro);
  }
}

export async function demonstracao(req, res, next) {
  try {
    if (!podeAcionarSimulacao(req.auth?.cargo)) {
      return res.status(403).json({ mensagem: "Sem permissão para executar demonstração." });
    }

    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    if (!maquina.modoSimulacao) {
      return res.status(409).json({
        mensagem: "Cenários de demonstração só podem ser executados no modo simulação."
      });
    }

    const cenario = String(req.body.cenario || "normal").toLowerCase();
    const base = {
      producao: maquina.producao,
      ciclos: maquina.ciclos,
      qualidadeSinal: 100,
      latenciaMs: 0
    };

    const cenarios = {
      normal: {
        ...base,
        temperatura: Math.max(32, maquina.tempAtencao - 15),
        vibracao: Math.max(0.8, maquina.vibracaoAtencao - 2),
        corrente: 0.8,
        consumoEnergia: Math.max(45, maquina.energiaAtencao - 20),
        producao: maquina.producao + 4,
        ciclos: maquina.ciclos + 1
      },
      aquecimento: {
        ...base,
        temperatura: maquina.tempAtencao + 3,
        vibracao: Math.max(1, maquina.vibracaoAtencao - 1),
        corrente: 1.1,
        consumoEnergia: maquina.energiaAtencao - 3,
        producao: maquina.producao + 2,
        ciclos: maquina.ciclos + 1
      },
      critico: {
        ...base,
        temperatura: maquina.tempCritica + 5,
        vibracao: maquina.vibracaoAtencao + 0.5,
        corrente: 1.4,
        consumoEnergia: maquina.energiaAtencao,
        producao: maquina.producao,
        ciclos: maquina.ciclos + 1
      },
      vibracao: {
        ...base,
        temperatura: maquina.tempAtencao - 8,
        vibracao: maquina.vibracaoCritica + 1,
        corrente: 1.6,
        consumoEnergia: maquina.energiaAtencao - 5,
        producao: maquina.producao,
        ciclos: maquina.ciclos + 1
      },
      normalizar: {
        ...base,
        temperatura: maquina.tempAtencao - 12,
        vibracao: Math.max(0.5, maquina.vibracaoAtencao - 2),
        corrente: 0.4,
        consumoEnergia: maquina.energiaAtencao - 25
      }
    };

    if (!cenarios[cenario]) {
      return res.status(400).json({ mensagem: "Cenário de demonstração inválido." });
    }

    await processarTelemetria({
      maquina,
      dados: cenarios[cenario],
      origem: "SIMULADOR"
    });

    await registrarAuditoria({
      req,
      acao: "DEMONSTRACAO",
      entidade: "MAQUINA",
      entidadeId: id,
      detalhes: { cenario }
    });

    return buscar(req, res, next);
  } catch (erro) {
    next(erro);
  }
}

export async function diagnostico(req, res, next) {
  try {
    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id),
      include: {
        telemetria: {
          orderBy: { criadoEm: "desc" },
          take: 1
        },
        comandos: {
          where: { status: { in: ["PENDENTE", "ENTREGUE"] } },
          orderBy: { criadoEm: "asc" },
          take: 10
        }
      }
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    const ultimaLeitura = maquina.telemetria[0] || null;
    const estadoConexao = calcularEstadoConexao(maquina);

    res.json({
      maquinaId: maquina.id,
      nome: maquina.nome,
      modoSimulacao: maquina.modoSimulacao,
      controlador: maquina.controlador,
      protocolo: maquina.protocolo,
      host: maquina.host,
      porta: maquina.porta,
      endpoint: maquina.endpoint,
      topico: maquina.topico,
      intervaloLeitura: maquina.intervaloLeitura,
      deviceKeyHint: maquina.deviceKeyHint,
      estadoConexao,
      ultimaTelemetriaEm: maquina.ultimaTelemetriaEm,
      ultimoHeartbeatEm: maquina.ultimoHeartbeatEm,
      qualidadeSinal: ultimaLeitura?.qualidadeSinal ?? null,
      latenciaMs: ultimaLeitura?.latenciaMs ?? null,
      origemUltimaLeitura: ultimaLeitura?.origem ?? null,
      dadosExtras: ultimaLeitura?.dadosExtras ?? null,
      integracaoMeta: maquina.integracaoMeta ?? null,
      paradaSeguranca: maquina.paradaSeguranca,
      motivoParada: maquina.motivoParada,
      comandosPendentes: maquina.comandos.length,
      comandosIhm: maquina.comandos
        .filter(item => String(item.comando || "").startsWith("IHM_"))
        .map(item => ({ id: item.id, comando: item.comando, status: item.status, criadoEm: item.criadoEm })),
      hmi: {
        ...estadoHmiAtual(maquina, ultimaLeitura?.dadosExtras),
        remoteControlEnabled: controleRemotoIhmHabilitado(maquina),
        startPolicy: avaliarPermissaoStartIhm({ maquina, estadoConexao, dadosExtras: ultimaLeitura?.dadosExtras })
      },
      limites: {
        tempAtencao: maquina.tempAtencao,
        tempCritica: maquina.tempCritica,
        energiaAtencao: maquina.energiaAtencao,
        energiaCritica: maquina.energiaCritica,
        vibracaoAtencao: maquina.vibracaoAtencao,
        vibracaoCritica: maquina.vibracaoCritica,
        ciclosManutencao: maquina.ciclosManutencao,
        ciclosUltimaManutencao: maquina.ciclosUltimaManutencao
      }
    });
  } catch (erro) {
    next(erro);
  }
}

export async function criarComandoIhm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const comando = normalizarComandoIhm(req.body?.comando);
    if (!comando) {
      return res.status(400).json({ mensagem: "Comando da IHM não permitido." });
    }

    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id),
      include: { telemetria: { orderBy: { criadoEm: "desc" }, take: 1 } }
    });
    if (!maquina) return res.status(404).json({ mensagem: "Máquina não encontrada." });

    const controlador = String(maquina.controlador || "").toUpperCase();
    if (!controlador) {
      return res.status(409).json({ mensagem: "Configure um controlador antes de usar a IHM." });
    }
    if (controlador === "DOBOT_MAGICIAN") {
      return res.status(409).json({ mensagem: "O Dobot possui painel dedicado e comandos próprios." });
    }

    if (!cargoPodeComandoIhm(req.auth?.cargo, comando)) {
      return res.status(403).json({ mensagem: "Seu cargo não possui permissão para este comando da IHM." });
    }

    if (!controleRemotoIhmHabilitado(maquina)) {
      return res.status(409).json({
        mensagem: "Controle remoto real está desativado. Habilite-o explicitamente no cadastro da máquina."
      });
    }

    const ultimaLeitura = maquina.telemetria?.[0] || null;
    const dadosExtras = ultimaLeitura?.dadosExtras || null;
    const estadoConexao = calcularEstadoConexao(maquina);
    const politica = politicaComandoIhm(comando);

    if (comando === "IHM_START") {
      const start = avaliarPermissaoStartIhm({ maquina, estadoConexao, dadosExtras });
      if (!start.permitido) {
        return res.status(409).json({ mensagem: `START bloqueado: ${start.motivo}` });
      }
    }

    if (
      maquina.modoSimulacao === false &&
      politica?.exigeConexao &&
      String(estadoConexao.codigo || "").toUpperCase() !== "CONECTADA"
    ) {
      return res.status(409).json({ mensagem: "Comando bloqueado: o equipamento não possui conexão estável e recente." });
    }

    if (maquina.modoSimulacao !== false) {
      const estado = estadoHmiAtual(maquina, dadosExtras);
      const patch = {
        running: estado.running,
        mode: estado.mode,
        ultimaAcao: comando,
        ultimaAcaoEm: new Date().toISOString()
      };
      const data = {};

      if (comando === "IHM_START") {
        patch.running = true;
        data.status = "Ligada";
      } else if (comando === "IHM_STOP") {
        patch.running = false;
        data.status = "Desligada";
      } else if (comando === "IHM_MODE_AUTO") {
        patch.mode = "AUTO";
      } else if (comando === "IHM_MODE_MANUAL") {
        patch.mode = "MANUAL";
      } else if (comando === "IHM_RESET" && maquina.paradaSeguranca) {
        return res.status(409).json({
          mensagem: "RESET da IHM não libera uma parada de segurança. Normalize a condição e use a liberação de segurança autorizada."
        });
      }

      data.integracaoMeta = metaIhmComPatch(maquina, patch);
      data.logs = { create: { mensagem: `IHM simulada: ${comando} solicitado por ${req.auth.nome || req.auth.email}.` } };
      await prisma.maquina.update({ where: { id }, data });
      await registrarAuditoria({
        req,
        acao: "COMANDO_IHM_SIMULACAO",
        entidade: "MAQUINA",
        entidadeId: id,
        detalhes: { comando }
      });

      const atualizada = await carregarCompleta(req, id);
      const resposta = formatarMaquinaResposta(atualizada);
      publicarEventoMaquina(id, "telemetria", resposta);
      return res.json({ mensagem: "Comando aplicado na IHM de simulação.", maquina: resposta, comando });
    }

    const existente = await prisma.comandoMaquina.findFirst({
      where: { maquinaId: id, comando, status: { in: ["PENDENTE", "ENTREGUE"] } },
      orderBy: { criadoEm: "desc" }
    });
    if (existente) {
      return res.status(202).json({
        mensagem: "Este comando já está aguardando o equipamento.",
        comando: { id: existente.id, comando: existente.comando, status: existente.status, criadoEm: existente.criadoEm }
      });
    }

    const payload = {
      origem: "IHM_STEELCONTROL",
      solicitadoPor: req.auth.nome || req.auth.email,
      usuarioId: req.auth.usuarioId,
      expiresAt: expiraEmComandoIhm(comando)
    };

    const operacoes = [];
    if (comando === "IHM_STOP") {
      operacoes.push(
        prisma.comandoMaquina.updateMany({
          where: {
            maquinaId: id,
            comando: { in: ["IHM_START", "IHM_RESET", "IHM_MODE_AUTO", "IHM_MODE_MANUAL"] },
            status: { in: ["PENDENTE", "ENTREGUE"] }
          },
          data: { status: "CANCELADO", concluidoEm: new Date() }
        })
      );
    }

    operacoes.push(
      prisma.comandoMaquina.create({ data: { maquinaId: id, comando, payload } }),
      prisma.log.create({ data: { maquinaId: id, mensagem: `IHM: ${comando} solicitado por ${req.auth.nome || req.auth.email}.` } })
    );

    const resultados = await prisma.$transaction(operacoes);
    const criado = resultados.find(item => item && item.comando === comando && item.maquinaId === id);

    await registrarAuditoria({
      req,
      acao: "COMANDO_IHM",
      entidade: "MAQUINA",
      entidadeId: id,
      detalhes: { comando, expiraEm: payload.expiresAt }
    });
    publicarEventoMaquina(id, "comando", { id: criado?.id, comando, status: criado?.status || "PENDENTE" });

    return res.status(202).json({
      mensagem: "Comando enviado para a fila autenticada do equipamento.",
      comando: { id: criado?.id, comando, status: criado?.status || "PENDENTE", expiraEm: payload.expiresAt }
    });
  } catch (erro) {
    next(erro);
  }
}

export async function criarComandoDobot(req, res, next) {
  try {
    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({ where: whereEmpresa(req, id) });
    if (!maquina) return res.status(404).json({ mensagem: "Máquina não encontrada." });

    if (String(maquina.controlador || "").toUpperCase() !== "DOBOT_MAGICIAN") {
      return res.status(409).json({ mensagem: "Este equipamento não está configurado como Dobot Magician." });
    }
    if (maquina.modoSimulacao !== false) {
      return res.status(409).json({ mensagem: "Use o Dobot Gateway (MOCK ou REAL) com a máquina em modo Equipamento real." });
    }

    const comando = String(req.body?.comando || "").trim().toUpperCase();
    if (!DOBOT_COMMANDS.has(comando)) {
      return res.status(400).json({ mensagem: "Comando Dobot não permitido." });
    }

    const cargo = String(req.auth?.cargo || "").toUpperCase();
    const somenteStop = comando === "DOBOT_STOP";
    const permitido = somenteStop
      ? ["ADMINISTRADOR", "SUPERVISOR", "TECNICO", "OPERADOR"].includes(cargo)
      : ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"].includes(cargo);
    if (!permitido) {
      return res.status(403).json({ mensagem: "Seu cargo não possui permissão para este comando do robô." });
    }

    const payload = validarPayloadDobot(comando, req.body?.payload || {});
    const criado = await prisma.comandoMaquina.create({
      data: { maquinaId: id, comando, payload }
    });

    await prisma.log.create({
      data: { maquinaId: id, mensagem: `Comando ${comando} solicitado por ${req.auth.nome || req.auth.email}.` }
    });
    await registrarAuditoria({
      req, acao: "COMANDO_DOBOT", entidade: "MAQUINA", entidadeId: id,
      detalhes: { comando, payload }
    });
    publicarEventoMaquina(id, "comando", { id: criado.id, comando, status: criado.status });

    return res.status(202).json({
      mensagem: "Comando enviado para a fila segura do equipamento.",
      comando: { id: criado.id, comando: criado.comando, status: criado.status, criadoEm: criado.criadoEm }
    });
  } catch (erro) {
    next(erro);
  }
}

export async function regenerarDeviceKey(req, res, next) {
  try {
    if (!exigirAdministrador(req, res)) {
      return;
    }

    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    const deviceKey = gerarDeviceKey();
    await prisma.maquina.update({
      where: { id },
      data: {
        deviceKeyHash: hashDeviceKey(deviceKey),
        deviceKeyHint: deviceKeyHint(deviceKey),
        logs: {
          create: { mensagem: "Chave do equipamento renovada por administrador." }
        }
      }
    });

    await registrarAuditoria({
      req,
      acao: "RENOVAR_DEVICE_KEY",
      entidade: "MAQUINA",
      entidadeId: id
    });

    res.json({
      mensagem: "Nova chave do equipamento gerada com sucesso.",
      deviceKey,
      deviceKeyAviso: "A chave anterior deixou de funcionar. Guarde esta nova chave."
    });
  } catch (erro) {
    next(erro);
  }
}

export async function liberarSeguranca(req, res, next) {
  try {
    if (!podeOperarSeguranca(req.auth?.cargo)) {
      return res.status(403).json({
        mensagem: "Seu perfil não pode liberar uma parada de segurança."
      });
    }

    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id)
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    if (!maquina.paradaSeguranca) {
      return res.json({ mensagem: "A máquina não possui parada de segurança ativa." });
    }

    const aindaInsegura =
      maquina.temperatura >= maquina.tempAtencao ||
      maquina.consumoEnergia >= maquina.energiaAtencao ||
      maquina.vibracao >= maquina.vibracaoAtencao;

    if (aindaInsegura) {
      return res.status(409).json({
        mensagem:
          "Os sensores ainda estão acima dos limites de atenção. Normalize a condição antes de liberar o equipamento."
      });
    }

    const operacoes = [
      prisma.maquina.update({
        where: { id },
        data: {
          paradaSeguranca: false,
          motivoParada: null,
          status: "Ligada",
          manutencao: "Normal",
          logs: {
            create: {
              mensagem: `Parada de segurança liberada por ${req.auth.nome}.`
            }
          }
        }
      })
    ];

    if (maquina.modoSimulacao === false) {
      // Evita que uma parada ainda não entregue seja executada depois da liberação.
      operacoes.push(
        prisma.comandoMaquina.updateMany({
          where: {
            maquinaId: id,
            comando: "PARAR_SEGURANCA",
            status: { in: ["PENDENTE", "ENTREGUE"] }
          },
          data: {
            status: "CANCELADO",
            concluidoEm: new Date()
          }
        })
      );

      operacoes.push(
        prisma.comandoMaquina.create({
          data: {
            maquinaId: id,
            comando: "LIBERAR_OPERACAO",
            payload: { autorizadoPor: req.auth.nome }
          }
        })
      );
    }

    await prisma.$transaction(operacoes);

    await registrarAuditoria({
      req,
      acao: "LIBERAR_SEGURANCA",
      entidade: "MAQUINA",
      entidadeId: id
    });

    const atualizada = await carregarCompleta(req, id);
    publicarEventoMaquina(id, "seguranca", formatarMaquinaResposta(atualizada));
    res.json(formatarMaquinaResposta(atualizada));
  } catch (erro) {
    next(erro);
  }
}

export async function streamMaquina(req, res, next) {
  try {
    const id = Number(req.params.id);
    const maquina = await prisma.maquina.findFirst({
      where: whereEmpresa(req, id),
      select: { id: true }
    });

    if (!maquina) {
      return res.status(404).json({ mensagem: "Máquina não encontrada." });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const enviar = evento => {
      res.write(`event: ${evento.tipo || "mensagem"}\n`);
      res.write(`data: ${JSON.stringify(evento)}\n\n`);
    };

    enviar({
      tipo: "conectado",
      dados: { maquinaId: id },
      em: new Date().toISOString()
    });

    const cancelar = assinarEventosMaquina(id, enviar);
    const heartbeat = setInterval(() => {
      res.write(`: keepalive ${Date.now()}\n\n`);
    }, 15_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      cancelar();
    });
  } catch (erro) {
    next(erro);
  }
}
