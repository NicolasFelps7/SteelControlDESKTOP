from __future__ import annotations
import struct, time
from .base import BaseAdapter, AdapterError

HEADER=b"\xAA\xAA"
ALARM_DESCRIPTIONS={
    0:"reinicialização pendente",
    18:"alvo fora do alcance ou dos limites das juntas",
}
DOBOT_LIMITS={"x":(-320.0,320.0),"y":(-320.0,320.0),"z":(-20.0,250.0),"r":(-180.0,180.0),"velocidade":(1.0,60.0)}

def validate_ptp(payload):
    values={}
    for key in ("x","y","z","r"):
        try:value=float(payload[key])
        except (KeyError,TypeError,ValueError):raise AdapterError(f"Coordenada {key.upper()} inválida.")
        low,high=DOBOT_LIMITS[key]
        if value<low or value>high:raise AdapterError(f"{key.upper()} fora do envelope seguro ({low:g} a {high:g}).")
        values[key]=value
    try:speed=float(payload.get("velocidade",30))
    except (TypeError,ValueError):raise AdapterError("Velocidade inválida.")
    low,high=DOBOT_LIMITS["velocidade"]
    if speed<low or speed>high:raise AdapterError(f"Velocidade fora do limite seguro ({low:g}% a {high:g}%).")
    values["velocidade"]=speed
    return values
def checksum(payload:bytes)->int:return (-sum(payload))&0xFF
def packet(command_id:int,rw:int=0,queued:bool=False,params:bytes=b"")->bytes:
    ctrl=(1 if rw else 0)|(2 if queued else 0); payload=bytes([command_id,ctrl])+params
    return HEADER+bytes([len(payload)])+payload+bytes([checksum(payload)])

class DobotMagicianAdapter(BaseAdapter):
    name="Dobot Magician"
    def __init__(self,params=None):
        super().__init__(params); self.ser=None; self.port=None; self.suction=False; self.gripper=False; self.cycles=0; self.production=0; self.queue_stopped=False; self.startup_reset_acknowledged=False; self.last_motion_target=None
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
                self.ser=serial.Serial(port,int(self.params.get("baud") or 115200),timeout=.7,write_timeout=.7); self.port=port; self._get_pose()
                alarms=self._alarms()
                if alarms:
                    try:self._recover_alarms()
                    except AdapterError:pass
                else:self._initialize_controller()
                self.connected=True; return
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
    @staticmethod
    def _queue_index(response):
        params=response[2:]
        # O protocolo atual devolve uint64. Mantemos compatibilidade com
        # firmwares antigos que ainda respondem com quatro bytes.
        if len(params)>=8:return struct.unpack('<Q',params[:8])[0]
        return struct.unpack('<I',params[:4])[0] if len(params)>=4 else None
    def _current_queue_index(self):
        return self._queue_index(self._exchange(246,0,False))
    def _wait_queue_index(self,index,timeout=5.0):
        if index is None:return
        deadline=time.monotonic()+timeout
        while time.monotonic()<deadline:
            current=self._current_queue_index()
            # O índice é monotônico. Comparar apenas por igualdade podia perder
            # a confirmação quando o controlador avançava mais de um item entre
            # duas leituras.
            if current is not None and current>=index:return
            alarms=self._blocking_alarms()
            if alarms:raise AdapterError(f"Dobot bloqueou a fila por alarme(s): {self._describe_alarms(alarms)}. Use Limpar alarmes e, se persistir, reinicie o braço.")
            time.sleep(.05)
        raise AdapterError(f"Dobot recebeu o comando #{index}, mas a fila não o executou.")
    def _initialize_controller(self):
        # Sequência compatível com o controlador do Magician/Lite: a fila deve
        # estar rodando antes de receber os parâmetros e movimentos.
        self._exchange(240,1,False)
        self._exchange(245,1,False)
        self._exchange(80,1,True,struct.pack('<8f',*[200.0]*8))
        self._exchange(81,1,True,struct.pack('<4f',200.0,200.0,200.0,200.0))
        self._exchange(82,1,True,struct.pack('<2f',10.0,200.0))
        speed=max(1.0,min(100.0,float(self.params.get('speed') or 40.0)))
        response=self._exchange(83,1,True,struct.pack('<2f',speed,speed))
        self._exchange(240,1,False)
        self._wait_queue_index(self._queue_index(response),3.0)
        self.queue_stopped=False
    def _queue_and_start(self,cid,params=b""):
        if self.queue_stopped:
            self._exchange(245,1,False)
        # Mantém a fila em execução antes e depois de inserir o comando. Isso
        # também recupera a fila depois de um STOP anterior.
        self._exchange(240,1,False)
        response=self._exchange(cid,1,True,params)
        self._exchange(240,1,False)
        self.queue_stopped=False
        return response
    def _set_speed(self,value):
        speed=max(1.0,min(100.0,float(value or 40.0)))
        # Parâmetro imediato: evita depender do estado residual da fila interna
        # do braço. A fila segura do SteelControl continua no backend/Edge.
        self._exchange(83,1,False,struct.pack('<2f',speed,speed))
    def _ensure_motion_ready(self):
        alarms=self._blocking_alarms()
        if alarms:raise AdapterError(f"Dobot possui alarme(s) ativo(s): {self._describe_alarms(alarms)}. Clique em Limpar alarmes; se persistir, coloque o braço em uma posição segura dentro da área de trabalho e reinicie-o.")
    def _blocking_alarms(self,alarms=None):
        alarms=self._alarms() if alarms is None else list(alarms)
        # Alguns firmwares do Magician/Lite mantêm o bit 0 visível mesmo após
        # confirmar ClearAllAlarmsState. Ele só deixa de bloquear depois que a
        # limpeza foi reconhecida nesta sessão. Todos os demais bits continuam
        # sendo bloqueantes sem exceção.
        if self.startup_reset_acknowledged:
            return [code for code in alarms if code!=0]
        return alarms
    @staticmethod
    def _describe_alarms(alarms):
        return ", ".join(f"{code} ({ALARM_DESCRIPTIONS.get(code,'consulte o manual Dobot')})" for code in alarms)
    def _recover_alarms(self):
        # Um PTP inválido pode deixar a fila interna tentando executar o mesmo
        # alvo. Primeiro interrompemos e descartamos essa fila; somente depois
        # enviamos ClearAllAlarmsState. Reiniciar a fila antes de confirmar a
        # limpeza fazia o alarme 18 reaparecer imediatamente.
        self.startup_reset_acknowledged=False
        alarms=self._alarms()
        for _ in range(5):
            self._exchange(241,1,False)
            self._exchange(245,1,False)
            self.queue_stopped=True
            self._exchange(21,1,False)
            time.sleep(.25)
            alarms=self._alarms()
            if not alarms:
                self.last_motion_target=None
                self._initialize_controller();self.queue_stopped=False;return
            if alarms==[0]:
                # ClearAllAlarmsState foi aceito, mas este firmware mantém o
                # aviso de boot no bitmap. Registramos o reconhecimento e ainda
                # exigimos que HOME/fila sejam realmente concluídos.
                self.startup_reset_acknowledged=True
                self.last_motion_target=None
                self._initialize_controller();self.queue_stopped=False;return
        target=""
        if self.last_motion_target:
            target=" Último alvo rejeitado: "+" ".join(f"{key.upper()}={self.last_motion_target[key]:.2f}" for key in ("x","y","z","r")) + "."
        raise AdapterError(f"Alarmes continuam ativos: {self._describe_alarms(alarms)}.{target} O alvo precisa ser ensinado novamente dentro da área alcançável; se o alarme permanecer após PARAR e limpar, desligue/ligue a alimentação do Dobot.")
    def _verify_effector(self,cid,enabled,on):
        state=self._exchange(cid,0,False)[2:]
        if len(state)>=2 and (bool(state[0])!=bool(enabled) or bool(state[1])!=bool(on)):
            raise AdapterError('O Dobot processou a fila, mas o efetuador não confirmou o estado solicitado.')
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
        pose=self._get_pose();raw_alarms=self._alarms();alarms=self._blocking_alarms(raw_alarms)
        return {"producao":self.production,"ciclos":self.cycles,"qualidadeSinal":100,"latenciaMs":5,"origem":"DOBOT_REAL","dadosExtras":{"dobot":{"mode":"REAL","connected":True,"port":self.port,"baudRate":int(self.params.get("baud") or 115200),"pose":{k:round(pose[k],4) for k in ["x","y","z","r"]},"joints":{k:round(pose[k],4) for k in ["j1","j2","j3","j4"]},"alarms":alarms,"rawAlarms":raw_alarms,"startupResetAcknowledged":self.startup_reset_acknowledged,"queue":"READY","endEffector":{"suction":self.suction,"gripper":self.gripper}}}}
    def execute_command(self,command,payload=None):
        payload=payload or {}
        if command in {"DOBOT_STOP","PARAR_SEGURANCA"}:self._exchange(242,1,False);self.queue_stopped=True;self.startup_reset_acknowledged=False;return
        if command=="LIBERAR_OPERACAO":return
        if command=="DOBOT_CLEAR_ALARMS":
            self._recover_alarms();return
        if command=="DOBOT_HOME":
            self._ensure_motion_ready()
            self._exchange(30,1,False,struct.pack('<4f',200.0,0.0,0.0,0.0))
            self._exchange(31,1,False,struct.pack('<I',0));self.cycles+=1;return
        if command=="DOBOT_PTP":
            target=validate_ptp(payload);x=target['x'];y=target['y'];z=target['z'];r=target['r']
            self._ensure_motion_ready();self.last_motion_target={key:target[key] for key in ('x','y','z','r')};self._set_speed(target['velocidade'])
            before=self._get_pose()
            # MOVJ_XYZ (modo 1), imediato. O comando continua protegido pela
            # fila autenticada do SteelControl, mas não fica preso na fila
            # interna de firmwares Magician/Lite que não avançam o índice.
            self._exchange(84,1,False,bytes([1])+struct.pack('<4f',x,y,z,r))
            deadline=time.monotonic()+12.0; moved=False; last=before
            while time.monotonic()<deadline:
                time.sleep(.15)
                last=self._get_pose()
                alarms=self._blocking_alarms()
                if alarms:
                    raise AdapterError(f"Dobot rejeitou o alvo PTP X={x:.2f} Y={y:.2f} Z={z:.2f} R={r:.2f}: {self._describe_alarms(alarms)}. Pressione PARAR, limpe os alarmes e ensine novamente este ponto.")
                moved=moved or any(abs(last[k]-before[k])>0.3 for k in ('x','y','z','r'))
                if abs(last['x']-x)<=1.5 and abs(last['y']-y)<=1.5 and abs(last['z']-z)<=1.5 and abs(last['r']-r)<=2.0:
                    self.last_motion_target=None;self.cycles+=1;self.production+=1;return
            if not moved:
                raise AdapterError('Dobot aceitou o PTP, mas não iniciou movimento. Verifique alarmes/intertravamentos e a faixa do alvo.')
            raise AdapterError(f"Dobot não atingiu o alvo PTP. Atual: X={last['x']:.2f} Y={last['y']:.2f} Z={last['z']:.2f} R={last['r']:.2f}")
        if command=="DOBOT_SUCTION_ON":self._exchange(62,1,False,bytes([1,1]));self._verify_effector(62,True,True);self.suction=True;return
        if command=="DOBOT_SUCTION_OFF":self._exchange(62,1,False,bytes([0,0]));self._verify_effector(62,False,False);self.suction=False;return
        if command=="DOBOT_GRIPPER_OPEN":self._exchange(63,1,False,bytes([1,0]));self._verify_effector(63,True,False);self.gripper=False;return
        if command=="DOBOT_GRIPPER_CLOSE":self._exchange(63,1,False,bytes([1,1]));self._verify_effector(63,True,True);self.gripper=True;return
        raise AdapterError(f"Comando Dobot não suportado: {command}")
    def close(self):
        try:
            if self.ser:self.ser.close()
        except Exception:pass
        super().close()
