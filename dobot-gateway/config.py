from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()

def _bool(name: str, default=False):
    return str(os.getenv(name, str(default))).strip().lower() in {"1","true","yes","sim","on"}

@dataclass(frozen=True)
class Config:
    steelcontrol_url: str = os.getenv("STEELCONTROL_URL", "http://127.0.0.1:3000").rstrip("/")
    machine_id: int = int(os.getenv("MACHINE_ID", "0"))
    device_key: str = os.getenv("DEVICE_KEY", "").strip()
    mode: str = os.getenv("DOBOT_MODE", "mock").strip().lower()
    port: str = os.getenv("DOBOT_PORT", "AUTO").strip()
    baud: int = int(os.getenv("DOBOT_BAUD", "115200"))
    interval_ms: int = max(500, int(os.getenv("DOBOT_INTERVAL_MS", "1000")))
    allow_motion: bool = _bool("DOBOT_ALLOW_MOTION", False)

    def validate(self):
        if self.machine_id <= 0:
            raise RuntimeError("MACHINE_ID deve ser o ID da máquina cadastrada no SteelControl.")
        if len(self.device_key) < 16 or self.device_key.lower().startswith("cole-"):
            raise RuntimeError("DEVICE_KEY ausente. Gere e copie a chave exibida no cadastro da máquina.")
        if self.mode not in {"mock", "real"}:
            raise RuntimeError("DOBOT_MODE deve ser mock ou real.")
