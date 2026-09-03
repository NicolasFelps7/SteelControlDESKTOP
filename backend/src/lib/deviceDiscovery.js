import dgram from "node:dgram";
import os from "node:os";
import { env } from "../config/env.js";

const SERVICE = "steelcontrol-device";
const PROTOCOL_VERSION = 1;
const MAX_PACKET_BYTES = 8_192;
const ACTIVE_TTL_MS = 20_000;
const RETENTION_MS = 120_000;
const IP_PROBE_PATH = "/steelcontrol/discovery";
const IP_PROBE_TIMEOUT_MS = 2_800;

const devices = new Map();
let socket = null;
let cleanupTimer = null;
let started = false;

const stats = {
  startedAt: null,
  boundAt: null,
  lastError: null,
  lastScanAt: null,
  lastScanTargets: [],
  scanRequests: 0,
  sentPackets: 0,
  sendErrors: 0,
  receivedPackets: 0,
  validPackets: 0,
  ignoredPackets: 0,
  lastPacketAt: null,
  lastValidPacketAt: null,
  lastIpProbeAt: null,
  lastIpProbeHost: null,
  lastIpProbeOk: null,
  lastIpProbeError: null
};

function cleanText(value, max = 180) {
  if (value === undefined || value === null) return null;
  const result = String(value).trim();
  return result ? result.slice(0, max) : null;
}

function cleanPort(value, fallback = 80) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
}

function cleanPath(value) {
  const path = cleanText(value, 240) || "/steelcontrol/provision";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/steelcontrol/provision";
  }
  return path.split("?")[0].split("#")[0];
}

export function isPrivateIPv4(address) {
  const parts = String(address || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function normalizeController(value) {
  const key = String(value || "").trim().toUpperCase().replace(/[\s/-]+/g, "_");
  const map = {
    ESP32: "ESP32",
    PLC: "CLP_PLC",
    CLP: "CLP_PLC",
    CLP_PLC: "CLP_PLC",
    CNC: "CNC",
    GATEWAY: "GATEWAY_INDUSTRIAL",
    GATEWAY_INDUSTRIAL: "GATEWAY_INDUSTRIAL",
    ROBOT: "CONTROLADOR_ROBOTICO",
    ROBOT_CONTROLLER: "CONTROLADOR_ROBOTICO",
    CONTROLADOR_ROBOTICO: "CONTROLADOR_ROBOTICO",
    DOBOT: "DOBOT_MAGICIAN",
    DOBOT_MAGICIAN: "DOBOT_MAGICIAN"
  };
  return map[key] || "OUTRO";
}

function normalizeProtocol(value) {
  const key = String(value || "").trim().toUpperCase().replace(/[\s/-]+/g, "_");
  const map = {
    HTTP: "HTTP_REST",
    REST: "HTTP_REST",
    HTTP_REST: "HTTP_REST",
    MQTT: "MQTT",
    MODBUS: "MODBUS_TCP",
    MODBUS_TCP: "MODBUS_TCP",
    OPCUA: "OPC_UA",
    OPC_UA: "OPC_UA",
    TCP: "TCP_IP",
    TCP_IP: "TCP_IP",
    USB_SERIAL: "USB_SERIAL"
  };
  return map[key] || "OUTRO";
}

function normalizeCapabilities(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => cleanText(item, 60)).filter(Boolean))].slice(0, 30);
}

function buildDevice(payload, rinfo, now = Date.now()) {
  if (!payload || payload.service !== SERVICE || Number(payload.version || 0) !== PROTOCOL_VERSION) return null;
  if (!isPrivateIPv4(rinfo.address)) return null;

  const id = cleanText(payload.id || payload.serial || payload.mac, 120);
  if (!id) return null;

  const previous = devices.get(id);
  return {
    id,
    name: cleanText(payload.name, 120) || `Equipamento ${id.slice(-6)}`,
    manufacturer: cleanText(payload.manufacturer, 120),
    model: cleanText(payload.model, 120) || "Dispositivo industrial",
    serial: cleanText(payload.serial, 120) || id,
    firmware: cleanText(payload.firmware, 80),
    controller: normalizeController(payload.controller),
    protocol: normalizeProtocol(payload.protocol),
    host: rinfo.address,
    port: cleanPort(payload.port, 80),
    provisionPath: cleanPath(payload.provisionPath),
    pairingNonce: cleanText(payload.pairingNonce, 160),
    capabilities: normalizeCapabilities(payload.capabilities),
    discoverySource: cleanText(payload.discoverySource, 30) || previous?.discoverySource || "UDP",
    firstSeenAt: previous?.firstSeenAt || new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
    lastSeenMs: now
  };
}

function registerPacket(message, rinfo) {
  const now = Date.now();
  stats.receivedPackets += 1;
  stats.lastPacketAt = now;

  if (!message || message.length > MAX_PACKET_BYTES) {
    stats.ignoredPackets += 1;
    return;
  }

  try {
    const payload = JSON.parse(message.toString("utf8"));
    const device = buildDevice({ ...payload, discoverySource: "UDP" }, rinfo, now);
    if (!device) {
      stats.ignoredPackets += 1;
      return;
    }
    devices.set(device.id, device);
    stats.validPackets += 1;
    stats.lastValidPacketAt = now;
  } catch {
    stats.ignoredPackets += 1;
    // Pacotes não SteelControl são ignorados sem poluir logs.
  }
}

function cleanExpired(now = Date.now()) {
  for (const [id, device] of devices.entries()) {
    if (now - device.lastSeenMs > RETENTION_MS) devices.delete(id);
  }
}

function ipv4ToInt(address) {
  const parts = String(address || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function intToIpv4(value) {
  const number = Number(value) >>> 0;
  return [number >>> 24, (number >>> 16) & 255, (number >>> 8) & 255, number & 255].join(".");
}

function broadcastFor(address, netmask) {
  const ip = ipv4ToInt(address);
  const mask = ipv4ToInt(netmask);
  if (ip === null || mask === null) return null;
  return intToIpv4((ip | (~mask >>> 0)) >>> 0);
}

function privateInterfaces() {
  const result = [];
  const interfaces = os.networkInterfaces();

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      const family = entry.family === 4 ? "IPv4" : entry.family;
      if (family !== "IPv4" || entry.internal || !isPrivateIPv4(entry.address)) continue;
      result.push({
        name,
        address: entry.address,
        netmask: entry.netmask,
        broadcast: broadcastFor(entry.address, entry.netmask)
      });
    }
  }

  return result;
}

function sameSubnet(a, b, netmask) {
  const left = ipv4ToInt(a);
  const right = ipv4ToInt(b);
  const mask = ipv4ToInt(netmask);
  if (left === null || right === null || mask === null) return false;
  return ((left & mask) >>> 0) === ((right & mask) >>> 0);
}

function same24(a, b) {
  const pa = String(a).split(".");
  const pb = String(b).split(".");
  return pa.length === 4 && pb.length === 4 && pa.slice(0, 3).join(".") === pb.slice(0, 3).join(".");
}

export function apiUrlForDevice(deviceHost) {
  if (env.discoveryAdvertiseUrl) return env.discoveryAdvertiseUrl.replace(/\/$/, "");
  const candidates = privateInterfaces();
  const chosen = candidates.find(item => sameSubnet(item.address, deviceHost, item.netmask))?.address
    || candidates.find(item => same24(item.address, deviceHost))?.address
    || candidates[0]?.address
    || "127.0.0.1";
  return `http://${chosen}:${env.port}`;
}

export function listDiscovered({ includeStale = false } = {}) {
  cleanExpired();
  const now = Date.now();
  return [...devices.values()]
    .filter(device => includeStale || now - device.lastSeenMs <= ACTIVE_TTL_MS)
    .map(({ lastSeenMs, pairingNonce, ...device }) => ({
      ...device,
      online: now - lastSeenMs <= ACTIVE_TTL_MS,
      pairingAvailable: Boolean(pairingNonce)
    }))
    .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
}

export function getDiscovered(id) {
  cleanExpired();
  const device = devices.get(String(id || "").trim());
  if (!device || Date.now() - device.lastSeenMs > ACTIVE_TTL_MS) return null;
  return { ...device };
}

export function requestDiscovery() {
  stats.scanRequests += 1;
  stats.lastScanAt = Date.now();

  if (!socket) {
    stats.lastScanTargets = [];
    return { sent: false, targets: [], mensagem: "Socket UDP de descoberta ainda não está disponível." };
  }

  const payload = Buffer.from(JSON.stringify({
    service: "steelcontrol-discovery",
    version: PROTOCOL_VERSION,
    action: "discover",
    timestamp: Date.now()
  }));

  const targets = [...new Set([
    "255.255.255.255",
    ...privateInterfaces().map(item => item.broadcast).filter(Boolean)
  ])];

  stats.lastScanTargets = targets;
  try { socket.setBroadcast(true); } catch {}

  for (const target of targets) {
    try {
      socket.send(payload, env.discoveryPort, target, error => {
        if (error) {
          stats.sendErrors += 1;
          stats.lastError = `Falha ao enviar descoberta para ${target}: ${error.message}`;
        } else {
          stats.sentPackets += 1;
        }
      });
    } catch (error) {
      stats.sendErrors += 1;
      stats.lastError = `Falha ao enviar descoberta para ${target}: ${error.message}`;
    }
  }

  return {
    sent: targets.length > 0,
    targets,
    mensagem: targets.length
      ? `Busca enviada para ${targets.length} endereço(s) de broadcast.`
      : "Nenhum endereço de broadcast local pôde ser determinado."
  };
}

export async function probeDeviceByIp(hostValue, portValue = 80) {
  const host = String(hostValue || "").trim();
  const requestedPort = Number(portValue);
  const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65535 ? requestedPort : null;
  stats.lastIpProbeAt = Date.now();
  stats.lastIpProbeHost = host ? `${host}:${port ?? "?"}` : null;
  stats.lastIpProbeOk = false;
  stats.lastIpProbeError = null;

  if (!isPrivateIPv4(host)) {
    stats.lastIpProbeError = "Informe um IPv4 privado/local válido, por exemplo 192.168.0.87.";
    throw new Error(stats.lastIpProbeError);
  }
  if (port === null) {
    stats.lastIpProbeError = "Informe uma porta válida entre 1 e 65535.";
    throw new Error(stats.lastIpProbeError);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IP_PROBE_TIMEOUT_MS);
  const url = `http://${host}:${port}${IP_PROBE_PATH}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-SteelControl-Discovery": "1"
      }
    });

    if (!response.ok) {
      throw new Error(`O endereço respondeu, mas não expõe o protocolo SteelControl (HTTP ${response.status}).`);
    }

    const body = await response.text();
    if (!body || body.length > MAX_PACKET_BYTES * 2) {
      throw new Error("Resposta de descoberta vazia ou maior que o limite aceito.");
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error("O endereço respondeu, mas a resposta não é JSON SteelControl válido.");
    }

    const device = buildDevice(
      { ...payload, port: payload.port || port, discoverySource: "IP" },
      { address: host },
      Date.now()
    );

    if (!device) {
      throw new Error("O endereço respondeu, mas não anunciou uma identidade SteelControl compatível.");
    }

    devices.set(device.id, device);
    stats.lastIpProbeOk = true;
    stats.lastIpProbeError = null;
    stats.validPackets += 1;
    stats.lastValidPacketAt = Date.now();
    return { ...device };
  } catch (error) {
    const message = error?.name === "AbortError"
      ? `Tempo limite ao consultar ${host}:${port}. Confirme o IP, a porta, o Wi-Fi e o firewall do dispositivo.`
      : (error?.message || "Não foi possível consultar o equipamento pelo IP.");
    stats.lastIpProbeError = message;
    throw new Error(message);
  } finally {
    clearTimeout(timer);
  }
}

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

export function getDiscoveryDiagnostics() {
  cleanExpired();
  const now = Date.now();
  const interfaces = privateInterfaces();
  const activeDevices = [...devices.values()].filter(device => now - device.lastSeenMs <= ACTIVE_TTL_MS).length;
  const issues = [];

  if (!env.discoveryEnabled) {
    issues.push({
      code: "discovery_disabled",
      severity: "error",
      message: "A descoberta está desativada no backend. Verifique DISCOVERY_ENABLED."
    });
  }

  if (env.discoveryEnabled && (!started || !socket || !stats.boundAt)) {
    issues.push({
      code: "udp_not_ready",
      severity: "error",
      message: "O listener UDP ainda não está pronto. Reinicie o backend e confira se a porta de descoberta está disponível."
    });
  }

  if (!interfaces.length) {
    issues.push({
      code: "no_private_interface",
      severity: "warning",
      message: "O backend não encontrou uma interface IPv4 privada ativa. Confirme Wi-Fi/Ethernet e evite executar apenas em loopback."
    });
  }

  const scanAfterLastValid = stats.lastScanAt && (!stats.lastValidPacketAt || stats.lastValidPacketAt < stats.lastScanAt);
  if (stats.lastScanAt && scanAfterLastValid && activeDevices === 0) {
    issues.push({
      code: "no_response_after_scan",
      severity: "warning",
      message: "Nenhum dispositivo SteelControl respondeu à última busca. Possíveis causas: firewall UDP, isolamento de clientes Wi-Fi, VLAN/sub-rede diferente ou firmware sem descoberta habilitada."
    });
  }

  if (interfaces.length > 1) {
    issues.push({
      code: "multiple_adapters",
      severity: "info",
      message: "Há várias interfaces de rede ativas. VPN, adaptador virtual ou Docker podem fazer o broadcast sair pela rede errada; o SteelControl tenta todos os broadcasts locais detectados."
    });
  }

  if (stats.lastError) {
    issues.push({
      code: "udp_send_error",
      severity: "warning",
      message: stats.lastError
    });
  }

  if (stats.lastIpProbeAt && stats.lastIpProbeOk === false && stats.lastIpProbeError) {
    issues.push({
      code: "ip_probe_failed",
      severity: "warning",
      message: stats.lastIpProbeError
    });
  }

  return {
    enabled: env.discoveryEnabled,
    port: env.discoveryPort,
    socketReady: Boolean(started && socket && stats.boundAt),
    startedAt: iso(stats.startedAt),
    boundAt: iso(stats.boundAt),
    lastScanAt: iso(stats.lastScanAt),
    lastScanTargets: [...stats.lastScanTargets],
    lastPacketAt: iso(stats.lastPacketAt),
    lastValidPacketAt: iso(stats.lastValidPacketAt),
    lastIpProbeAt: iso(stats.lastIpProbeAt),
    lastIpProbeHost: stats.lastIpProbeHost,
    lastIpProbeOk: stats.lastIpProbeOk,
    lastIpProbeError: stats.lastIpProbeError,
    activeDevices,
    retainedDevices: devices.size,
    counters: {
      scanRequests: stats.scanRequests,
      sentPackets: stats.sentPackets,
      sendErrors: stats.sendErrors,
      receivedPackets: stats.receivedPackets,
      validPackets: stats.validPackets,
      ignoredPackets: stats.ignoredPackets
    },
    interfaces,
    issues,
    ipFallback: {
      enabled: true,
      path: IP_PROBE_PATH,
      timeoutMs: IP_PROBE_TIMEOUT_MS,
      accepts: "IPv4 privado/local"
    }
  };
}

export function startDeviceDiscovery() {
  if (started || !env.discoveryEnabled) return;
  started = true;
  stats.startedAt = Date.now();
  socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  socket.on("message", registerPacket);
  socket.on("error", error => {
    stats.lastError = error.message;
    console.warn("Descoberta automática indisponível:", error.message);
  });
  socket.bind(env.discoveryPort, "0.0.0.0", () => {
    stats.boundAt = Date.now();
    try { socket.setBroadcast(true); } catch {}
    console.log(`Descoberta de equipamentos ativa via UDP/${env.discoveryPort}.`);
    requestDiscovery();
  });
  cleanupTimer = setInterval(cleanExpired, 30_000);
  cleanupTimer.unref?.();
}

export function stopDeviceDiscovery() {
  started = false;
  stats.boundAt = null;
  if (cleanupTimer) clearInterval(cleanupTimer);
  cleanupTimer = null;
  if (socket) {
    try { socket.close(); } catch {}
  }
  socket = null;
}
