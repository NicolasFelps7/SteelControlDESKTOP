from __future__ import annotations

import hashlib
import json
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    from serial.tools import list_ports
except Exception:
    list_ports = None

from edge_profiles import MachineProfile, load_store, save_store

DISCOVERY_PORT = 4210
HTTP_PORT = 4211
SERVICE = "steelcontrol-device"
VERSION = 1


def _safe(v, limit=160):
    return str(v or "").strip()[:limit]


def _ports():
    if not list_ports:
        return []
    try:
        return list(list_ports.comports())
    except Exception:
        return []


def _identity(p):
    serial = _safe(getattr(p, "serial_number", None))
    hwid = _safe(getattr(p, "hwid", None))
    seed = serial or hwid or _safe(getattr(p, "device", None))
    digest = hashlib.sha256(seed.encode("utf-8", "ignore")).hexdigest()[:20]
    return f"EDGE-SERIAL-{digest}"


def _is_dobot(p):
    text = " ".join(_safe(getattr(p, k, None)) for k in ("description", "manufacturer", "product", "hwid")).lower()
    return "dobot" in text or "silicon labs" in text and "cp210" in text


class EdgeDiscoveryService:
    """Anuncia hardware serial/USB local para a descoberta SteelControl e recebe provisionamento."""
    def __init__(self, log=None, discovery_port=DISCOVERY_PORT, http_port=HTTP_PORT):
        self.log = log or (lambda msg: None)
        self.discovery_port = int(discovery_port)
        self.http_port = int(http_port)
        self._stop = threading.Event()
        self._nonce = hashlib.sha256(f"{time.time_ns()}-{socket.gethostname()}".encode()).hexdigest()[:32]
        self._udp = None
        self._http = None

    def start(self):
        threading.Thread(target=self._udp_loop, name="edge-discovery-udp", daemon=True).start()
        threading.Thread(target=self._http_loop, name="edge-discovery-http", daemon=True).start()
        self.log(f"Descoberta Edge ativa: anúncios UDP/{self.discovery_port} + provisionamento HTTP/{self.http_port}.")

    def stop(self):
        self._stop.set()
        try:
            if self._udp: self._udp.close()
        except Exception: pass
        try:
            if self._http: self._http.shutdown()
        except Exception: pass

    def devices(self):
        out = []
        for p in _ports():
            dev = _safe(getattr(p, "device", None))
            if not dev: continue
            dobot = _is_dobot(p)
            desc = _safe(getattr(p, "description", None)) or "Dispositivo serial/USB"
            manufacturer = _safe(getattr(p, "manufacturer", None)) or ("Dobot" if dobot else "Dispositivo local")
            out.append({
                "service": SERVICE,
                "version": VERSION,
                "id": _identity(p),
                "name": f"{'Dobot' if dobot else desc} ({dev})",
                "manufacturer": manufacturer,
                "model": desc,
                "serial": _safe(getattr(p, "serial_number", None)) or _identity(p),
                "firmware": "SteelControl Edge 2.1",
                "controller": "DOBOT_MAGICIAN" if dobot else "OUTRO",
                "protocol": "USB_SERIAL",
                "port": self.http_port,
                "provisionPath": "/steelcontrol/provision",
                "pairingNonce": f"{self._nonce}:{_identity(p)}",
                "capabilities": ["edge", "serial", "usb", "telemetry", "commands"],
                "discoverySource": "EDGE",
                "edge": {"host": socket.gethostname(), "serialPort": dev, "driver": "DOBOT_MAGICIAN" if dobot else "SERIAL_JSON"},
            })
        return out

    def _udp_loop(self):
        # O Edge anuncia periodicamente em vez de disputar a porta UDP/4210
        # com o backend quando ambos rodam no mesmo PC.
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._udp = sock
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        while not self._stop.is_set():
            try:
                devices = self.devices()
                for device in devices:
                    raw=json.dumps(device, ensure_ascii=False).encode("utf-8")
                    # localhost cobre Backend + Edge no mesmo PC; broadcast cobre Edge remoto.
                    for target in (("127.0.0.1", self.discovery_port), ("255.255.255.255", self.discovery_port)):
                        try:sock.sendto(raw, target)
                        except Exception:pass
            except Exception as e:
                if not self._stop.is_set(): self.log(f"Falha ao anunciar hardware do Edge: {e}")
            self._stop.wait(3.0)

    def _provision(self, payload):
        nonce = _safe(payload.get("pairingNonce"), 240)
        if not nonce.startswith(self._nonce + ":"):
            raise ValueError("Pareamento Edge inválido ou expirado. Execute uma nova busca.")
        device_id = nonce.split(":", 1)[1]
        port = next((p for p in _ports() if _identity(p) == device_id), None)
        if not port:
            raise ValueError("O dispositivo local não está mais conectado ao Edge.")
        machine_id = int(payload.get("machineId") or 0)
        key = _safe(payload.get("deviceKey"), 500)
        server = _safe(payload.get("apiBaseUrl"), 500).rstrip("/")
        if machine_id <= 0 or len(key) < 16 or not server.startswith(("http://", "https://")):
            raise ValueError("Pacote de provisionamento incompleto.")
        serial_port = _safe(getattr(port, "device", None))
        dobot = _is_dobot(port)
        store = load_store()
        profile = next((x for x in store.profiles if x.machine_id == machine_id and x.server_url.rstrip("/") == server), None)
        if not profile:
            profile = MachineProfile()
            store.profiles.append(profile)
        profile.label = f"{'Dobot' if dobot else (_safe(getattr(port, 'description', None)) or 'Máquina')} • {serial_port}"
        profile.server_url = server
        profile.machine_id = machine_id
        profile.device_key = key
        profile.driver = "DOBOT_MAGICIAN" if dobot else "SERIAL_JSON"
        profile.enabled = True
        profile.allow_commands = False
        profile.interval_ms = max(500, int(payload.get("telemetryIntervalMs") or 2000))
        profile.params = {"serialPort": serial_port, "baud": 115200}
        save_store(store)
        self.log(f"Máquina ID {machine_id} provisionada automaticamente no Edge ({serial_port}).")
        return {"ok": True, "machineId": machine_id, "edgeHost": socket.gethostname(), "serialPort": serial_port, "driver": profile.driver}

    def _http_loop(self):
        service = self
        class Handler(BaseHTTPRequestHandler):
            def _json(self, status, body):
                raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
                self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(raw))); self.end_headers(); self.wfile.write(raw)
            def do_GET(self):
                if urlparse(self.path).path != "/steelcontrol/discovery": return self._json(404, {"mensagem":"Não encontrado."})
                devices = service.devices()
                if len(devices) == 1: return self._json(200, devices[0])
                return self._json(200, {"service":"steelcontrol-edge", "version":1, "name":socket.gethostname(), "devices":devices})
            def do_POST(self):
                if urlparse(self.path).path != "/steelcontrol/provision": return self._json(404, {"mensagem":"Não encontrado."})
                try:
                    size = min(int(self.headers.get("Content-Length") or 0), 16384)
                    payload = json.loads(self.rfile.read(size).decode("utf-8"))
                    return self._json(200, service._provision(payload))
                except Exception as e:
                    return self._json(400, {"mensagem":str(e)})
            def log_message(self, fmt, *args):
                return
        try:
            self._http = ThreadingHTTPServer(("0.0.0.0", self.http_port), Handler)
            self._http.serve_forever(poll_interval=.5)
        except OSError as e:
            self.log(f"Servidor de provisionamento Edge indisponível: {e}")
