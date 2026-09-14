from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from pathlib import Path

from secret_store import protect_text, unprotect_text


def config_dir() -> Path:
    base = os.environ.get("PROGRAMDATA") or os.environ.get("APPDATA") or str(Path.home())
    return Path(base) / "SteelControl" / "Edge"


def config_path() -> Path:
    return config_dir() / "edge-config.json"


@dataclass
class EdgeConfig:
    server_url: str = "http://127.0.0.1:3000"
    machine_id: int = 0
    device_key: str = ""
    mode: str = "mock"
    port: str = "AUTO"
    baud: int = 115200
    interval_ms: int = 1000
    allow_motion: bool = False

    def normalized(self) -> "EdgeConfig":
        server = self.server_url.strip().rstrip("/")
        mode = self.mode.strip().lower()
        port = self.port.strip() or "AUTO"
        return EdgeConfig(
            server_url=server,
            machine_id=int(self.machine_id or 0),
            device_key=self.device_key.strip(),
            mode=mode,
            port=port,
            baud=int(self.baud or 115200),
            interval_ms=max(500, int(self.interval_ms or 1000)),
            allow_motion=bool(self.allow_motion),
        )


def save_config(cfg: EdgeConfig) -> Path:
    cfg = cfg.normalized()
    if cfg.machine_id <= 0:
        raise ValueError("Informe um ID de máquina válido.")
    if len(cfg.device_key) < 16:
        raise ValueError("Informe a Device Key gerada pelo SteelControl.")
    if cfg.mode not in {"mock", "real"}:
        raise ValueError("Modo inválido. Use MOCK ou REAL.")
    if not cfg.server_url.startswith(("http://", "https://")):
        raise ValueError("Servidor deve começar com http:// ou https://")

    target = config_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = asdict(cfg)
    payload.pop("device_key", None)
    payload["device_key_protected"] = protect_text(cfg.device_key)
    payload["schema"] = 1
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return target


def load_config() -> EdgeConfig:
    target = config_path()
    if not target.exists():
        return EdgeConfig()
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
        key = unprotect_text(str(payload.get("device_key_protected") or ""))
        return EdgeConfig(
            server_url=str(payload.get("server_url") or "http://127.0.0.1:3000"),
            machine_id=int(payload.get("machine_id") or 0),
            device_key=key,
            mode=str(payload.get("mode") or "mock"),
            port=str(payload.get("port") or "AUTO"),
            baud=int(payload.get("baud") or 115200),
            interval_ms=int(payload.get("interval_ms") or 1000),
            allow_motion=bool(payload.get("allow_motion", False)),
        ).normalized()
    except Exception:
        return EdgeConfig()
