from __future__ import annotations
import struct, time
from .base import BaseAdapter, AdapterError

HEADER=b"\xAA\xAA"
def checksum(payload:bytes)->int:return (-sum(payload))&0xFF
def packet(command_id:int,rw:int=0,queued:bool=False,params:bytes=b"")->bytes:
    ctrl=(1 if rw else 0)|(2 if queued else 0); payload=bytes([command_id,ctrl])+params
    return HEADER+bytes([len(payload)])+payload+bytes([checksum(payload)])

class DobotMagicianAdapter(BaseAdapter):
    name="Dobot Magician"
    def __init__(self,params=None):
        super().__init__(params); self.ser=None; self.port=None; self.suction=False; self.gripper=False; self.cycles=0; self.production=0
    def _candidates(self):
        try:
            from serial.tools import list_ports
            specified=str(self.params.get("serialPort") or self.params.get("portName") or self.params.get("dobotPort") or "AUTO")
            if specified.upper()!="AUTO": return [specified]
            ports=list(list_ports.comports()); pref=[p.device for p in ports if any(k in f"{p.description} {p.manufacturer} {p.hwid}".lower() for k in ["dobot","ch340","usb serial","silicon labs","wch"])]; return pref+[p.device for p in ports if p.device not in pref]
        except Exception:return []
    def connect(self):
        try:import serial
        except Exception as e:raise AdapterError("pyserial não instalado.") from e
        errors=[]
        for port in self._candidates():
            try:
                self.ser=serial.Serial(port,int(self.params.get("baud") or 115200),timeout=.7,write_timeout=.7); self.port=port; self._get_pose(); self.connected=True; return
            except Exception as e:
                errors.append(f"{port}: {e}")
                try:self.ser.close()
                except Exception:pass
                self.ser=None
        raise AdapterError("Dobot não encontrado. "+("; ".join(errors) if errors else "Nenhuma porta serial disponível."))
    def _read_frame(self,expected_id=None):
        deadline=time.monotonic()+1.2; buf=bytearray()
        while time.monotonic()<deadline:
            chunk=self.ser.read(1)
            if not chunk:continue
            buf+=chunk
            while len(buf)>=2 and bytes(buf[:2])!=HEADER:del buf[0]
            if len(buf)<3:continue
            total=3+buf[2]+1
            if len(buf)<total:
                buf+=self.ser.read(total-len(buf))
                if len(buf)<total:continue
            frame=bytes(buf[:total]);del buf[:total];payload=frame[3:-1]
            if ((sum(payload)+frame[-1])&0xFF)!=0:continue
            if expected_id is not None and payload[0]!=expected_id:continue
            return payload
        raise AdapterError("Timeout aguardando Dobot.")
    def _exchange(self,cid,rw=0,queued=False,params=b""):
        if not self.ser:raise AdapterError("Dobot não conectado.")
        self.ser.reset_input_buffer();self.ser.write(packet(cid,rw,queued,params));self.ser.flush();return self._read_frame(cid)
    def _get_pose(self):
        p=self._exchange(10,0,False)[2:]
        if len(p)<32:raise AdapterError("Resposta GetPose incompleta.")
        vals=struct.unpack('<8f',p[:32]);return dict(zip(["x","y","z","r","j1","j2","j3","j4"],vals))
    def _alarms(self):
        p=self._exchange(20,0,False)[2:18];out=[]
        for bi,v in enumerate(p):
            for bit in range(8):
                if v&(1<<bit):out.append(bi*8+bit)
        return out
    def read_telemetry(self):
        pose=self._get_pose();alarms=self._alarms()
        return {"producao":self.production,"ciclos":self.cycles,"qualidadeSinal":100,"latenciaMs":5,"origem":"DOBOT_REAL","dadosExtras":{"dobot":{"mode":"REAL","connected":True,"port":self.port,"baudRate":int(self.params.get("baud") or 115200),"pose":{k:round(pose[k],4) for k in ["x","y","z","r"]},"joints":{k:round(pose[k],4) for k in ["j1","j2","j3","j4"]},"alarms":alarms,"queue":"READY","endEffector":{"suction":self.suction,"gripper":self.gripper}}}}
    def execute_command(self,command,payload=None):
        payload=payload or {}
        if command in {"DOBOT_STOP","PARAR_SEGURANCA"}:self._exchange(242,1,False);return
        if command=="LIBERAR_OPERACAO":return
        if command=="DOBOT_CLEAR_ALARMS":self._exchange(21,1,False);return
        if command=="DOBOT_HOME":self._exchange(31,1,True,struct.pack('<I',0));self.cycles+=1;return
        if command=="DOBOT_PTP":self._exchange(84,1,True,bytes([1])+struct.pack('<4f',float(payload['x']),float(payload['y']),float(payload['z']),float(payload['r'])));self.cycles+=1;self.production+=1;return
        if command=="DOBOT_SUCTION_ON":self._exchange(62,1,False,bytes([1,1]));self.suction=True;return
        if command=="DOBOT_SUCTION_OFF":self._exchange(62,1,False,bytes([1,0]));self.suction=False;return
        if command=="DOBOT_GRIPPER_OPEN":self._exchange(63,1,False,bytes([1,0]));self.gripper=False;return
        if command=="DOBOT_GRIPPER_CLOSE":self._exchange(63,1,False,bytes([1,1]));self.gripper=True;return
        raise AdapterError(f"Comando Dobot não suportado: {command}")
    def close(self):
        try:
            if self.ser:self.ser.close()
        except Exception:pass
        super().close()
