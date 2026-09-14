from __future__ import annotations
import json
from .base import BaseAdapter, AdapterError

class SerialJsonAdapter(BaseAdapter):
    name = "Serial genérica / JSON"
    def connect(self):
        try: import serial
        except Exception as e: raise AdapterError("pyserial não instalado.") from e
        port=str(self.params.get("port") or self.params.get("serialPort") or "").strip()
        if not port or port.upper()=="AUTO":
            try:
                from serial.tools import list_ports
                ports=list(list_ports.comports())
                if not ports: raise AdapterError("Nenhuma porta serial detectada.")
                port=ports[0].device
            except AdapterError: raise
            except Exception as e: raise AdapterError(f"Falha ao detectar porta serial: {e}") from e
        self.ser=serial.Serial(port=port, baudrate=int(self.params.get("baud") or 115200), timeout=float(self.params.get("timeout") or 1.0))
        self.connected=True
    def read_telemetry(self):
        raw=self.ser.readline().decode("utf-8", errors="replace").strip()
        if not raw: return {}
        try: data=json.loads(raw)
        except Exception as e: raise AdapterError(f"Serial recebeu pacote não-JSON: {raw[:120]}") from e
        if not isinstance(data, dict): raise AdapterError("Telemetria serial precisa ser um objeto JSON.")
        return data
    def execute_command(self, command, payload=None):
        packet={"comando":command,"payload":payload or {}}
        self.ser.write((json.dumps(packet, ensure_ascii=False)+"\n").encode("utf-8")); self.ser.flush()
    def close(self):
        try: self.ser.close()
        except Exception: pass
        super().close()
