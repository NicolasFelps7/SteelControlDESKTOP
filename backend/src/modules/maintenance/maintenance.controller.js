import { prisma } from "../../lib/prisma.js";
import { registrarAuditoria } from "../../lib/audit.js";
import {
  podeRegistrarManutencao,
  podeExcluirManutencao
} from "../../lib/maintenancePolicy.js";

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

function limparTexto(
  valor,
  limite
) {
  return String(valor || "")
    .trim()
    .slice(0, limite);
}

async function pegarMaquina(req) {
  return prisma.maquina.findFirst({
    where: {
      id:
        Number(req.params.id),
      empresaId:
        req.auth.empresaId,
      ativo: true
    }
  });
}

export async function listar(
  req,
  res,
  next
) {
  try {
    const maquina =
      await pegarMaquina(req);

    if (!maquina) {
      return res.status(404).json({
        mensagem:
          "Máquina não encontrada."
      });
    }

    const itens =
      await prisma.manutencao.findMany({
        where: {
          maquinaId:
            maquina.id,
          ativa: true
        },
        orderBy: {
          criadaEm: "desc"
        }
      });

    res.json(
      itens.map(item => ({
        id: item.id,
        tipo: item.tipo,
        tecnico: item.tecnico,
        descricao: item.descricao,
        ciclosNoRegistro: item.ciclosNoRegistro,
        data:
          formatarData(
            item.criadaEm
          ),
        horario:
          formatarHora(
            item.criadaEm
          )
      }))
    );
  } catch (erro) {
    next(erro);
  }
}

export async function criar(
  req,
  res,
  next
) {
  try {
    if (
      !podeRegistrarManutencao(
        req.auth?.cargo
      )
    ) {
      return res.status(403).json({
        mensagem:
          "Somente administradores, supervisores e técnicos podem registrar manutenções."
      });
    }

    const maquina =
      await pegarMaquina(req);

    if (!maquina) {
      return res.status(404).json({
        mensagem:
          "Máquina não encontrada."
      });
    }

    const tipo =
      limparTexto(
        req.body?.tipo,
        80
      );

    const tecnico =
      limparTexto(
        req.body?.tecnico,
        120
      );

    const descricao =
      limparTexto(
        req.body?.descricao,
        1500
      );

    if (
      !tipo ||
      !tecnico ||
      !descricao
    ) {
      return res.status(400).json({
        mensagem:
          "Preencha todos os campos."
      });
    }

    const item =
      await prisma.manutencao.create({
        data: {
          maquinaId:
            maquina.id,
          tipo,
          tecnico,
          descricao,
          ciclosNoRegistro:
            maquina.ciclos
        }
      });

    await prisma.maquina.update({
      where: {
        id:
          maquina.id
      },
      data: {
        ultimaManutencao:
          formatarData(
            item.criadaEm
          ),
        proximaManutencao:
          `No ciclo ${maquina.ciclos + maquina.ciclosManutencao}`,
        ciclosUltimaManutencao:
          maquina.ciclos,
        manutencao:
          `${tipo} registrada`,
        status:
          "Ligada",
        logs: {
          create: {
            mensagem:
              `Manutenção ${tipo} registrada por ${tecnico}.`
          }
        }
      }
    });

    await registrarAuditoria({
      req,
      acao: "CRIAR",
      entidade: "MANUTENCAO",
      entidadeId: item.id,
      detalhes: {
        maquinaId:
          maquina.id,
        tipo,
        tecnico
      }
    });

    res.status(201).json({
      mensagem:
        "Manutenção cadastrada com sucesso.",
      manutencao: {
        id: item.id,
        tipo: item.tipo,
        tecnico: item.tecnico,
        descricao: item.descricao,
        ciclosNoRegistro: item.ciclosNoRegistro,
        data:
          formatarData(
            item.criadaEm
          ),
        horario:
          formatarHora(
            item.criadaEm
          )
      }
    });
  } catch (erro) {
    next(erro);
  }
}

export async function excluir(
  req,
  res,
  next
) {
  try {
    if (
      !podeExcluirManutencao(
        req.auth?.cargo
      )
    ) {
      return res.status(403).json({
        mensagem:
          "Somente administradores podem arquivar registros de manutenção."
      });
    }

    const maquina =
      await pegarMaquina(req);

    if (!maquina) {
      return res.status(404).json({
        mensagem:
          "Máquina não encontrada."
      });
    }

    const manutencaoId =
      Number(
        req.params.manutencaoId
      );

    if (
      !Number.isInteger(
        manutencaoId
      )
    ) {
      return res.status(400).json({
        mensagem:
          "Registro de manutenção inválido."
      });
    }

    const registro =
      await prisma.manutencao.findFirst({
        where: {
          id:
            manutencaoId,
          maquinaId:
            maquina.id,
          ativa: true
        }
      });

    if (!registro) {
      return res.status(404).json({
        mensagem:
          "Registro de manutenção não encontrado."
      });
    }

    await prisma.manutencao.update({
      where: {
        id:
          manutencaoId
      },
      data: {
        ativa: false,
        excluidaEm:
          new Date(),
        excluidaPorId:
          req.auth.usuarioId
      }
    });

    const ultima =
      await prisma.manutencao.findFirst({
        where: {
          maquinaId:
            maquina.id,
          ativa: true
        },
        orderBy: {
          criadaEm: "desc"
        }
      });

    await prisma.maquina.update({
      where: {
        id:
          maquina.id
      },
      data: {
        ultimaManutencao:
          ultima
            ? formatarData(
                ultima.criadaEm
              )
            : "Sem registro",
        ciclosUltimaManutencao:
          ultima?.ciclosNoRegistro ?? 0,
        proximaManutencao:
          ultima?.ciclosNoRegistro !== null && ultima?.ciclosNoRegistro !== undefined
            ? `No ciclo ${ultima.ciclosNoRegistro + maquina.ciclosManutencao}`
            : `No ciclo ${maquina.ciclosManutencao}`,
        manutencao:
          ultima
            ? `${ultima.tipo} registrada`
            : "Normal",
        logs: {
          create: {
            mensagem:
              "Registro de manutenção arquivado por administrador. Histórico de auditoria preservado."
          }
        }
      }
    });

    await registrarAuditoria({
      req,
      acao: "ARQUIVAR",
      entidade: "MANUTENCAO",
      entidadeId:
        manutencaoId,
      detalhes: {
        maquinaId:
          maquina.id,
        tipo:
          registro.tipo
      }
    });

    res.json({
      mensagem:
        "Registro de manutenção arquivado com sucesso. O histórico de auditoria foi preservado."
    });
  } catch (erro) {
    next(erro);
  }
}
