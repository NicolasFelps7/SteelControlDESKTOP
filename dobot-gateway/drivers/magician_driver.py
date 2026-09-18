from __future__ import annotations
import struct, time
import serial
from serial.tools import list_ports
from .base import DobotDriver

HEADER = b"\xAA\xAA"

class DobotProtocolError(RuntimeError): pass

def checksum(payload: bytes) -> int:
    return (-sum(payload)) & 0xFF

def packet(command_id: int, rw: int = 0, queued: bool = False, params: bytes = b"") -> bytes:
    ctrl = (1 if rw else 0) | (2 if queued else 0)
    payload = bytes([command_id, ctrl]) + params
    return HEADER + bytes([len(payload)]) + payload + bytes([checksum(payload)])

class MagicianSerialDriver(DobotDriver):
    """Driver raw serial baseado no protocolo oficial do Dobot Magician.

    Leitura (GetPose/GetAlarms) é liberada por padrão. Movimentos só são executados
    quando DOBOT_ALLOW_MOTION=true no gateway.
    """
    def __init__(self, port="AUTO", baud=115200):
        self.port_spec = port; self.baud = baud; self.ser = None; self.port = None
        self.suction = False; self.gripper = False; self.cycles = 0; self.production = 0

    @staticmethod
    def ports():
        return [p.device for p in list_ports.comports()]

    def _candidate_ports(self):
        if self.port_spec and self.port_spec.upper() != "AUTO": return [self.port_spec]
        ports = list(list_ports.comports())
        preferred = [p.device for p in ports if any(k in (f"{p.description} {p.manufacturer} {p.hwid}").lower() for k in ["dobot","ch340","usb serial","silicon labs","wch"])]
        rest = [p.device for p in ports if p.device not in preferred]
        return preferred + rest

    def connect(self):
        errors=[]
        for port in self._candidate_ports():
            try:
                ser = serial.Serial(port, self.baud, timeout=0.7, write_timeout=0.7)
                self.ser=ser; self.port=port
                # Só aceitamos a porta se o Dobot responder a GetPose.
                self.get_pose()
                return
            except Exception as exc:
                errors.append(f"{port}: {exc}")
                try:
                    if self.ser: self.ser.close()
                except Exception: pass
                self.ser=None; self.port=None
        raise DobotProtocolError("Dobot Magician não encontrado. Portas testadas: " + ("; ".join(errors) or "nenhuma COM disponível"))

    def close(self):
        if self.ser:
            try: self.ser.close()
            finally: self.ser=None

    def _read_frame(self, expected_id=None):
        deadline=time.monotonic()+1.2; buf=bytearray()
        while time.monotonic()<deadline:
            chunk=self.ser.read(1)
            if not chunk: continue
            buf += chunk
            while len(buf)>=2 and bytes(buf[:2]) != HEADER: del buf[0]
            if len(buf)<3: continue
            length=buf[2]; total=3+length+1
            if len(buf)<total:
                more=self.ser.read(total-len(buf)); buf += more
                if len(buf)<total: continue
            frame=bytes(buf[:total]); del buf[:total]
            payload=frame[3:-1]
            if ((sum(payload)+frame[-1]) & 0xFF) != 0: continue
            if expected_id is not None and payload[0] != expected_id: continue
            return payload
        raise DobotProtocolError("Timeout aguardando resposta do Dobot.")

    def _exchange(self, command_id, rw=0, queued=False, params=b""):
        if not self.ser: raise DobotProtocolError("Dobot não conectado.")
        self.ser.reset_input_buffer(); self.ser.write(packet(command_id,rw,queued,params)); self.ser.flush()
        return self._read_frame(command_id)

    def get_pose(self):
        payload=self._exchange(10,0,False)
        params=payload[2:]
        if len(params)<32: raise DobotProtocolError("Resposta GetPose incompleta.")
        vals=struct.unpack('<8f',params[:32])
        return {"x":vals[0],"y":vals[1],"z":vals[2],"r":vals[3],
                "j1":vals[4],"j2":vals[5],"j3":vals[6],"j4":vals[7]}

    def get_alarms(self):
        payload=self._exchange(20,0,False)
        raw=list(payload[2:18])
        active=[]
        for byte_index,value in enumerate(raw):
            for bit in range(8):
                if value & (1<<bit): active.append(byte_index*8+bit)
        return active

    def clear_alarms(self): self._exchange(21,1,False)
    def stop(self): self._exchange(242,1,False)
    def home(self):
        # Execução imediata: não dependemos da fila interna do Dobot.
        self._exchange(31,1,False,struct.pack('<I',0)); self.cycles += 1
    def ptp(self,x,y,z,r):
        before=self.get_pose()
        self._exchange(84,1,False,bytes([1])+struct.pack('<4f',x,y,z,r))
        deadline=time.monotonic()+12.0; moved=False; last=before
        while time.monotonic()<deadline:
            time.sleep(.15); last=self.get_pose()
            moved=moved or any(abs(last[k]-before[k])>0.3 for k in ('x','y','z','r'))
            if abs(last['x']-x)<=1.5 and abs(last['y']-y)<=1.5 and abs(last['z']-z)<=1.5 and abs(last['r']-r)<=2.0:
                self.cycles += 1; self.production += 1; return
        if not moved:
            raise DobotProtocolError('Dobot aceitou o PTP, mas não iniciou movimento. Verifique alarmes/intertravamentos e a faixa do alvo.')
        raise DobotProtocolError(f"Dobot não atingiu o alvo PTP. Atual: X={last['x']:.2f} Y={last['y']:.2f} Z={last['z']:.2f} R={last['r']:.2f}")
    def suction_set(self,on): self._exchange(62,1,False,bytes([1,1 if on else 0])); self.suction=on
    def gripper_set(self,on): self._exchange(63,1,False,bytes([1,1 if on else 0])); self.gripper=on

    def snapshot(self):
        pose=self.get_pose(); alarms=self.get_alarms()
        return {
            "producao": self.production, "ciclos": self.cycles, "qualidadeSinal": 100, "latenciaMs": 5,
            "origem": "DOBOT_REAL",
            "dadosExtras": {"dobot": {
                "mode":"REAL","connected":True,"port":self.port,"baudRate":self.baud,
                "pose":{k:round(pose[k],4) for k in ["x","y","z","r"]},
                "joints":{"j1":round(pose["j1"],4),"j2":round(pose["j2"],4),"j3":round(pose["j3"],4),"j4":round(pose["j4"],4)},
                "alarms":alarms,"queue":"READY",
                "endEffector":{"suction":self.suction,"gripper":self.gripper},
                "sensors":{"temperature":"NOT_INSTALLED","vibration":"NOT_INSTALLED","current":"NOT_INSTALLED"}
            }}
        }

    def execute(self,command,payload,allow_motion):
        if command in {"DOBOT_STOP", "PARAR_SEGURANCA"}: self.stop(); return
        if command=="LIBERAR_OPERACAO": return
        if command=="DOBOT_CLEAR_ALARMS": self.clear_alarms(); return
        motion={"DOBOT_HOME","DOBOT_PTP","DOBOT_SUCTION_ON","DOBOT_SUCTION_OFF","DOBOT_GRIPPER_OPEN","DOBOT_GRIPPER_CLOSE"}
        if command in motion and not allow_motion:
            raise RuntimeError("Comando físico bloqueado. Defina DOBOT_ALLOW_MOTION=true somente após validar leitura e área segura.")
        if command=="DOBOT_HOME": self.home(); return
        if command=="DOBOT_PTP": self.ptp(float(payload["x"]),float(payload["y"]),float(payload["z"]),float(payload["r"])); return
        if command=="DOBOT_SUCTION_ON": self.suction_set(True); return
        if command=="DOBOT_SUCTION_OFF": self.suction_set(False); return
        if command=="DOBOT_GRIPPER_OPEN": self.gripper_set(False); return
        if command=="DOBOT_GRIPPER_CLOSE": self.gripper_set(True); return
        raise RuntimeError(f"Comando não suportado: {command}")
