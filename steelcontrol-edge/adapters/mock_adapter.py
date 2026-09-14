from __future__ import annotations
import math, time
from .base import BaseAdapter

class MockAdapter(BaseAdapter):
    name = "Simulador Edge"
    def connect(self): self.connected = True
    def read_telemetry(self):
        t=time.time()
        return {
            "temperatura": round(36 + math.sin(t/8)*2.2, 2),
            "vibracao": round(1.1 + abs(math.sin(t/5))*0.7, 2),
            "corrente": round(2.5 + abs(math.sin(t/7))*1.2, 2),
            "consumoEnergia": round(45 + abs(math.sin(t/9))*15, 1),
            "status": "Ligada",
            "dadosExtras": {"edgeDriver": self.name, "simulado": True}
        }
    def execute_command(self, command, payload=None): return None
