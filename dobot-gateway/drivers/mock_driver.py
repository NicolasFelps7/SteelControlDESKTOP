from __future__ import annotations
import math, time
from .base import DobotDriver

class MockDobotDriver(DobotDriver):
    def __init__(self):
        self.started = time.monotonic(); self.connected = False
        self.production = 0; self.cycles = 0; self.suction = False; self.gripper = False
        self.target = None

    def connect(self): self.connected = True
    def close(self): self.connected = False

    def snapshot(self):
        t = time.monotonic() - self.started
        x = 225 + 24 * math.sin(t / 3.2)
        y = 35 * math.sin(t / 4.1)
        z = 72 + 15 * math.sin(t / 2.8)
        r = 25 * math.sin(t / 5.0)
        # Demonstração coerente: sensores são explicitamente MOCK.
        temp = 36.5 + 2.2 * math.sin(t / 18)
        vib = 0.8 + 0.35 * abs(math.sin(t / 2.1))
        current = 1.1 + 0.45 * abs(math.sin(t / 2.7))
        load = 42 + 12 * abs(math.sin(t / 4.0))
        return {
            "temperatura": round(temp,2), "vibracao": round(vib,3), "corrente": round(current,3),
            "consumoEnergia": round(load,2), "producao": self.production, "ciclos": self.cycles,
            "qualidadeSinal": 100, "latenciaMs": 1, "origem": "DOBOT_MOCK",
            "dadosExtras": {"dobot": {
                "mode": "MOCK", "connected": True, "port": "VIRTUAL", "baudRate": 115200,
                "pose": {"x": round(x,3), "y": round(y,3), "z": round(z,3), "r": round(r,3)},
                "joints": {"j1": round(y/2.4,3), "j2": round(35 + 8*math.sin(t/3.5),3),
                           "j3": round(-18 + 6*math.sin(t/3.8),3), "j4": round(r,3)},
                "alarms": [], "queue": "READY",
                "endEffector": {"suction": self.suction, "gripper": self.gripper},
                "sensors": {"temperature": "MOCK", "vibration": "MOCK", "current": "MOCK"}
            }}
        }

    def execute(self, command, payload, allow_motion):
        if command in {"DOBOT_STOP", "PARAR_SEGURANCA"}: return
        if command == "LIBERAR_OPERACAO": return
        if command == "DOBOT_CLEAR_ALARMS": return
        if command == "DOBOT_SUCTION_ON": self.suction = True; return
        if command == "DOBOT_SUCTION_OFF": self.suction = False; return
        if command == "DOBOT_GRIPPER_OPEN": self.gripper = False; return
        if command == "DOBOT_GRIPPER_CLOSE": self.gripper = True; return
        if command in {"DOBOT_HOME", "DOBOT_PTP"}:
            if not allow_motion: raise RuntimeError("Movimentação bloqueada por DOBOT_ALLOW_MOTION=false.")
            self.cycles += 1
            if command == "DOBOT_PTP": self.production += 1
            return
        raise RuntimeError(f"Comando não suportado: {command}")
