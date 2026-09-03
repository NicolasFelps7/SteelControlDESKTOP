import { prisma } from "../../lib/prisma.js";
import { processarTelemetria } from "../../lib/telemetryService.js";
import { publicarEventoMaquina } from "../../lib/realtime.js";
import { calcularEstadoConexao } from "../../lib/machinePolicy.js";
import { dataLimiteReentrega, comandoJaFinalizado } from "../../lib/industrialPolicy.js";
import { comandoPayloadExpirado } from "../../lib/hmiPolicy.js";

const COMMAND_LEASE_MS = Math.max(
  5_000,
  Number(process.env.DEVICE_COMMAND_LEASE_MS) || 15_000
);

export async function receberTelemetriaDevice(req, res, next) {
  try {
    const maquina = req.device.maquina;

    if (maquina.modoSimulacao !== false) {
      return res.status(409).json({
        mensagem: "A máquina está em modo simulação. Altere para Equipamento real antes de enviar telemetria."
      });
    }

    const snapshot = await processarTelemetria({
      maquina,
      dados: req.body,
      origem: req.body.origem || maquina.controlador || maquina.protocolo || "EQUIPAMENTO"
    });

    // Telemetria bruta fica em TelemetryReading. AuditLog é reservado para ações/eventos,
    // evitando uma linha de auditoria a cada pacote do equipamento.
    res.json({
      ok: true,
      maquinaId: maquina.id,
      recebidoEm: new Date().toISOString(),
      status: snapshot.status,
      paradaSeguranca: snapshot.paradaSeguranca,
      motivoParada: snapshot.motivoParada
    });
  } catch (erro) {
    next(erro);
  }
}

export async function heartbeatDevice(req, res, next) {
  try {
    const maquina = req.device.maquina;
    const agora = new Date();

    const atualizada = await prisma.maquina.update({
      where: { id: maquina.id },
      data: {
        ultimoHeartbeatEm: agora,
        statusConexao: "Conectada"
      }
    });

    publicarEventoMaquina(maquina.id, "heartbeat", {
      maquinaId: maquina.id,
      ultimoHeartbeatEm: agora.toISOString(),
      intervaloLeitura: atualizada.intervaloLeitura,
      estadoConexao: calcularEstadoConexao(atualizada, agora.getTime())
    });

    res.json({
      ok: true,
      servidorEm: agora.toISOString(),
      intervaloLeitura: atualizada.intervaloLeitura,
      paradaSeguranca: atualizada.paradaSeguranca
    });
  } catch (erro) {
    next(erro);
  }
}

export async function configuracaoDevice(req, res) {
  const maquina = req.device.maquina;

  res.json({
    maquinaId: maquina.id,
    codigo: maquina.codigo,
    nome: maquina.nome,
    controlador: maquina.controlador,
    protocolo: maquina.protocolo,
    intervaloLeitura: maquina.intervaloLeitura,
    integracaoMeta: maquina.integracaoMeta ?? null,
    limites: {
      tempAtencao: maquina.tempAtencao,
      tempCritica: maquina.tempCritica,
      energiaAtencao: maquina.energiaAtencao,
      energiaCritica: maquina.energiaCritica,
      vibracaoAtencao: maquina.vibracaoAtencao,
      vibracaoCritica: maquina.vibracaoCritica,
      ciclosManutencao: maquina.ciclosManutencao,
      ciclosUltimaManutencao: maquina.ciclosUltimaManutencao
    },
    unidadeCargaEletrica: "%",
    paradaSeguranca: maquina.paradaSeguranca,
    motivoParada: maquina.motivoParada
  });
}

export async function proximoComando(req, res, next) {
  try {
    const maquina = req.device.maquina;
    const limiteReentrega = dataLimiteReentrega(Date.now(), COMMAND_LEASE_MS);

    let entregue = null;

    // Claim otimista: evita duas requisições concorrentes entregarem o mesmo
    // comando ao mesmo tempo. Se outro poller ganhar a corrida, tentamos de novo.
    for (let tentativa = 0; tentativa < 8 && !entregue; tentativa++) {
      const comando = await prisma.comandoMaquina.findFirst({
        where: {
          maquinaId: maquina.id,
          OR: [
            { status: "PENDENTE" },
            {
              status: "ENTREGUE",
              OR: [
                { entregueEm: null },
                { entregueEm: { lt: limiteReentrega } }
              ]
            }
          ]
        },
        orderBy: { criadoEm: "asc" }
      });

      if (!comando) {
        return res.status(204).end();
      }

      // Comandos operacionais da IHM possuem TTL curto. Se o equipamento
      // ficou offline, eles não podem "acordar" e executar minutos depois.
      if (comandoPayloadExpirado(comando.payload)) {
        await prisma.comandoMaquina.updateMany({
          where: { id: comando.id, maquinaId: maquina.id, status: { in: ["PENDENTE", "ENTREGUE"] } },
          data: { status: "CANCELADO", concluidoEm: new Date() }
        });
        continue;
      }

      const claim = await prisma.comandoMaquina.updateMany({
        where: {
          id: comando.id,
          maquinaId: maquina.id,
          OR: [
            { status: "PENDENTE" },
            {
              status: "ENTREGUE",
              OR: [
                { entregueEm: null },
                { entregueEm: { lt: limiteReentrega } }
              ]
            }
          ]
        },
        data: {
          status: "ENTREGUE",
          entregueEm: new Date(),
          tentativasEntrega: { increment: 1 }
        }
      });

      if (claim.count === 1) {
        entregue = await prisma.comandoMaquina.findUnique({
          where: { id: comando.id }
        });
      }
    }

    if (!entregue) {
      return res.status(204).end();
    }

    res.json({
      id: entregue.id,
      comando: entregue.comando,
      payload: entregue.payload,
      criadoEm: entregue.criadoEm,
      tentativaEntrega: entregue.tentativasEntrega,
      confirmarEm: `/device/${maquina.id}/comandos/${entregue.id}/confirmar`
    });
  } catch (erro) {
    next(erro);
  }
}

export async function confirmarComando(req, res, next) {
  try {
    const maquina = req.device.maquina;
    const comandoId = Number(req.params.comandoId);

    if (!Number.isInteger(comandoId)) {
      return res.status(400).json({ mensagem: "Comando inválido." });
    }

    const statusRecebido = String(req.body.status || "CONCLUIDO")
      .trim()
      .toUpperCase();
    const status = ["CONCLUIDO", "FALHOU"].includes(statusRecebido)
      ? statusRecebido
      : "CONCLUIDO";

    const comando = await prisma.comandoMaquina.findFirst({
      where: { id: comandoId, maquinaId: maquina.id }
    });

    if (!comando) {
      return res.status(404).json({ mensagem: "Comando não encontrado." });
    }

    // ACK idempotente: repetir confirmação não cria novos logs nem altera o resultado.
    if (["CONCLUIDO", "FALHOU"].includes(comando.status)) {
      return res.json({ ok: true, status: comando.status, idempotente: true });
    }

    if (comandoJaFinalizado(comando.status)) {
      return res.status(409).json({
        mensagem: "Este comando foi cancelado pelo SteelControl e não aceita confirmação."
      });
    }

    await prisma.$transaction([
      prisma.comandoMaquina.update({
        where: { id: comandoId },
        data: { status, concluidoEm: new Date() }
      }),
      prisma.log.create({
        data: {
          maquinaId: maquina.id,
          mensagem: `Equipamento confirmou comando ${comando.comando}: ${status}.`
        }
      })
    ]);

    res.json({ ok: true, status, idempotente: false });
  } catch (erro) {
    next(erro);
  }
}
