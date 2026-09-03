import { prisma } from "../../lib/prisma.js";
import { registrarAuditoria } from "../../lib/audit.js";
import { gerarDeviceKey, hashDeviceKey, deviceKeyHint } from "../../lib/deviceSecurity.js";
import {
  apiUrlForDevice,
  getDiscovered,
  getDiscoveryDiagnostics,
  isPrivateIPv4,
  listDiscovered,
  probeDeviceByIp,
  requestDiscovery
} from "../../lib/deviceDiscovery.js";

const provisioningLocks = new Set();

function requireAdmin(req, res) {
  if (String(req.auth?.cargo || "").toUpperCase() === "ADMINISTRADOR") return true;
  res.status(403).json({ mensagem: "Somente administradores podem descobrir e aprovar equipamentos." });
  return false;
}

function text(value, max = 180) {
  const clean = String(value ?? "").trim();
  return clean ? clean.slice(0, max) : null;
}

function slug(value) {
  return String(value || "DEVICE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || "DEVICE";
}

async function uniqueCode(companyId, base) {
  const cleanBase = `AUTO-${slug(base)}`.slice(0, 70);
  for (let index = 0; index < 100; index += 1) {
    const code = index === 0 ? cleanBase : `${cleanBase.slice(0, 65)}-${index + 1}`;
    const exists = await prisma.maquina.findFirst({ where: { empresaId: companyId, codigo: code }, select: { id: true } });
    if (!exists) return code;
  }
  return `AUTO-${Date.now()}`;
}

async function provisioningRequest(device, payload) {
  if (!isPrivateIPv4(device.host)) throw new Error("Provisionamento recusado: endereço fora da rede privada.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  const url = `http://${device.host}:${device.port}${device.provisionPath}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "X-SteelControl-Provisioning": "1" },
      body: JSON.stringify({ ...payload, pairingNonce: device.pairingNonce || null })
    });
    const body = await response.text();
    let json = null;
    try { json = body ? JSON.parse(body) : null; } catch {}
    if (!response.ok) throw new Error(json?.mensagem || `Dispositivo recusou o provisionamento (HTTP ${response.status}).`);
    return json || { ok: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function listarDescobertos(req, res, next) {
  try {
    if (!requireAdmin(req, res)) return;
    const items = listDiscovered();
    const ids = items.map(item => item.id);
    const claimed = ids.length
      ? await prisma.maquina.findMany({ where: { discoveryId: { in: ids }, ativo: true }, select: { id: true, empresaId: true, discoveryId: true, nome: true } })
      : [];
    const byId = new Map(claimed.map(item => [item.discoveryId, item]));
    res.json(items.map(item => {
      const machine = byId.get(item.id);
      return {
        ...item,
        claimed: Boolean(machine),
        claimedByThisCompany: Boolean(machine && machine.empresaId === req.auth.empresaId),
        machineId: machine?.empresaId === req.auth.empresaId ? machine.id : null,
        machineName: machine?.empresaId === req.auth.empresaId ? machine.nome : null
      };
    }));
  } catch (error) { next(error); }
}

export async function varrerRede(req, res, next) {
  try {
    if (!requireAdmin(req, res)) return;
    const result = requestDiscovery();
    res.status(202).json({
      mensagem: result.sent
        ? "Varredura solicitada. O SteelControl enviou a busca para os broadcasts locais detectados; aguarde alguns segundos pelas respostas."
        : "Descoberta local ainda não está disponível neste processo.",
      sent: result.sent,
      targets: result.targets
    });
  } catch (error) { next(error); }
}

export async function diagnosticoDescoberta(req, res, next) {
  try {
    if (!requireAdmin(req, res)) return;
    res.json(getDiscoveryDiagnostics());
  } catch (error) { next(error); }
}

export async function descobrirPorIp(req, res, next) {
  try {
    if (!requireAdmin(req, res)) return;
    const host = String(req.body?.host || "").trim();
    const port = req.body?.port ?? 80;
    if (!host) return res.status(400).json({ mensagem: "Informe o IPv4 local do equipamento." });

    const device = await probeDeviceByIp(host, port);
    const existing = await prisma.maquina.findUnique({
      where: { discoveryId: device.id },
      select: { id: true, empresaId: true, nome: true }
    });

    res.json({
      mensagem: `Equipamento SteelControl identificado em ${device.host}:${device.port}.`,
      device: {
        ...device,
        pairingNonce: undefined,
        claimed: Boolean(existing),
        claimedByThisCompany: Boolean(existing && existing.empresaId === req.auth.empresaId),
        machineId: existing?.empresaId === req.auth.empresaId ? existing.id : null,
        machineName: existing?.empresaId === req.auth.empresaId ? existing.nome : null
      }
    });
  } catch (error) {
    const message = error?.message || "Não foi possível detectar o equipamento pelo IP.";
    const status = /IPv4 privado\/local válido|Informe um IPv4/i.test(message) ? 400 : 404;
    res.status(status).json({ mensagem: message, diagnostico: getDiscoveryDiagnostics() });
  }
}

export async function aprovarDescoberto(req, res, next) {
  const id = String(req.params.id || "").trim();
  try {
    if (!requireAdmin(req, res)) return;
    const device = getDiscovered(id);
    if (!device) return res.status(404).json({ mensagem: "Equipamento não está mais visível. Execute uma nova busca." });
    if (provisioningLocks.has(id)) return res.status(409).json({ mensagem: "Este equipamento já está sendo provisionado." });
    provisioningLocks.add(id);

    const existing = await prisma.maquina.findUnique({ where: { discoveryId: id } });
    if (existing) {
      return res.status(409).json({
        mensagem: existing.empresaId === req.auth.empresaId ? "Este equipamento já foi adicionado à sua empresa." : "Este equipamento já foi reivindicado por outra empresa.",
        machineId: existing.empresaId === req.auth.empresaId ? existing.id : null
      });
    }

    const deviceKey = gerarDeviceKey();
    const code = text(req.body?.codigo, 80) || await uniqueCode(req.auth.empresaId, device.serial || device.id);
    const sector = text(req.body?.setor, 120) || "Descoberta automática";
    const name = text(req.body?.nome, 120) || device.name;
    const apiBaseUrl = apiUrlForDevice(device.host);

    const machine = await prisma.maquina.create({
      data: {
        empresaId: req.auth.empresaId,
        discoveryId: id,
        nome: name,
        setor: sector,
        modelo: device.model || "Dispositivo industrial",
        fabricante: device.manufacturer,
        codigo: code,
        tipo: "Equipamento descoberto",
        descricao: `Equipamento provisionado automaticamente pela rede SteelControl (${device.host}).`,
        controlador: device.controller,
        protocolo: device.protocol,
        host: device.host,
        porta: device.port,
        endpoint: device.provisionPath,
        intervaloLeitura: 2000,
        statusConexao: "Provisionando",
        modoSimulacao: false,
        status: "Desligada",
        deviceKeyHash: hashDeviceKey(deviceKey),
        deviceKeyHint: deviceKeyHint(deviceKey),
        integracaoMeta: {
          discovery: {
            id: device.id,
            serial: device.serial,
            firmware: device.firmware,
            capabilities: device.capabilities,
            provisionedAt: new Date().toISOString()
          },
          hmi: { enabled: true, remoteControlEnabled: false }
        },
        logs: { create: [
          { mensagem: "Equipamento encontrado automaticamente na rede local." },
          { mensagem: "Provisionamento iniciado. Controle remoto permanece desativado até liberação administrativa." }
        ] }
      }
    });

    let provisioned = false;
    let provisioningMessage = null;
    try {
      await provisioningRequest(device, {
        machineId: machine.id,
        deviceKey,
        apiBaseUrl,
        telemetryIntervalMs: machine.intervaloLeitura
      });
      provisioned = true;
      await prisma.maquina.update({
        where: { id: machine.id },
        data: {
          statusConexao: "Provisionada - aguardando telemetria",
          logs: { create: { mensagem: `Credenciais entregues automaticamente ao equipamento em ${device.host}.` } }
        }
      });
    } catch (error) {
      provisioningMessage = error?.name === "AbortError" ? "O equipamento não respondeu ao provisionamento dentro do tempo limite." : (error?.message || "Não foi possível entregar as credenciais automaticamente.");
      await prisma.maquina.update({
        where: { id: machine.id },
        data: {
          statusConexao: "Descoberta - configuração pendente",
          logs: { create: { mensagem: `Provisionamento automático pendente: ${provisioningMessage}` } }
        }
      });
    }

    await registrarAuditoria({
      req,
      acao: "APROVAR_DESCOBERTA",
      entidade: "MAQUINA",
      entidadeId: machine.id,
      detalhes: { discoveryId: id, host: device.host, controller: device.controller, protocol: device.protocol, provisioned }
    });

    res.status(201).json({
      mensagem: provisioned
        ? "Equipamento adicionado e configurado automaticamente. Aguarde a primeira telemetria."
        : "Equipamento adicionado. A entrega automática das credenciais não foi concluída; a chave é exibida para configuração manual.",
      maquinaId: machine.id,
      provisioned,
      provisioningMessage,
      ...(provisioned ? {} : { deviceKey, apiBaseUrl })
    });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ mensagem: "Este equipamento ou código já foi cadastrado." });
    next(error);
  } finally {
    provisioningLocks.delete(id);
  }
}
