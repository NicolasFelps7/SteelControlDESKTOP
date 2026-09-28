from __future__ import annotations
import threading,time,traceback
from datetime import datetime,timezone
from typing import Callable
from adapters import create_adapter,infer_driver,AdapterError
from edge_client import SteelControlClient
from edge_profiles import MachineProfile
from printer3d_normalizer import normalize_printer3d_telemetry

COMMAND_POLL_SECONDS = 0.1

class MachineRuntime:
    def __init__(self, profile:MachineProfile, log:Callable[[str,str],None], status:Callable[[str,str,dict],None]):
        self.profile=profile; self.log_cb=log; self.status_cb=status; self.stop_event=threading.Event(); self.thread=None; self.adapter=None
    def log(self,msg): self.log_cb(self.profile.id,msg)
    def status(self,state,**extra): self.status_cb(self.profile.id,state,extra)
    def start(self):
        if self.thread and self.thread.is_alive():return
        self.stop_event.clear(); self.thread=threading.Thread(target=self._run,name=f"edge-{self.profile.machine_id}",daemon=True); self.thread.start()
    def stop(self,wait=True):
        self.stop_event.set()
        try:
            if self.adapter:self.adapter.close()
        except Exception:pass
        # Não deixa um worker antigo conservar a COM enquanto o substituto
        # começa. Nunca tenta dar join na própria thread.
        if wait and self.thread and self.thread.is_alive() and threading.current_thread() is not self.thread:
            self.thread.join(timeout=4.0)
    def _params(self,server_cfg):
        p=dict(self.profile.params or {}); meta=server_cfg.get('integracaoMeta') or {}; edge=meta.get('edge') if isinstance(meta,dict) else None
        if isinstance(edge,dict): p={**edge,**p}
        # Cadastro do SteelControl é fallback automático.
        for src,dst in [('host','host'),('porta','port'),('unitId','unitId'),('endpoint','endpoint'),('topico','topic')]:
            if p.get(dst) in (None,'') and server_cfg.get(src) not in (None,''):p[dst]=server_cfg.get(src)
        p.setdefault('intervalMs',server_cfg.get('intervaloLeitura') or self.profile.interval_ms)
        dobot=meta.get('dobot') if isinstance(meta,dict) else None
        if isinstance(dobot,dict):
            p.setdefault('serialPort',dobot.get('port') or 'AUTO'); p.setdefault('baud',dobot.get('baudRate') or 115200)
            p['serverRemoteControlEnabled']=dobot.get('remoteControlEnabled') is True
        return p
    @staticmethod
    def _expired(payload):
        value=payload.get('expiresAt') if isinstance(payload,dict) else None
        if not value:return False
        try:return datetime.fromisoformat(str(value).replace('Z','+00:00'))<=datetime.now(timezone.utc)
        except Exception:return True
    def _run(self):
        backoff=1
        while not self.stop_event.is_set():
            try:
                c=SteelControlClient(self.profile.server_url,self.profile.machine_id,self.profile.device_key)
                cfg=c.config(); self.profile.label=str(cfg.get('nome') or self.profile.label)
                requested=self.profile.driver
                driver=infer_driver(cfg.get('controlador'),cfg.get('protocolo'),False) if requested=='AUTO' else requested
                params=self._params(cfg)
                server_allows=params.get('serverRemoteControlEnabled') is True
                commands_allowed=self.profile.allow_commands and (driver!='DOBOT_MAGICIAN' or server_allows)
                if driver=='DOBOT_MAGICIAN' and not commands_allowed:
                    self.log('Dobot em monitoramento: comandos exigem liberação no cadastro e no Edge local.')
                self.log(f"Configuração validada | driver={driver} | protocolo={cfg.get('protocolo') or '—'}")
                self.adapter=create_adapter(driver,params); self.adapter.connect(); self.status('ONLINE',driver=driver,controller=cfg.get('controlador'),protocol=cfg.get('protocolo')); self.log('Driver conectado.')
                backoff=1; last_hb=0; next_telemetry=0
                # Para ensino e confirmação de movimentos do Dobot, a pose
                # precisa chegar quase em tempo real. Outros controladores
                # continuam respeitando o intervalo configurado.
                interval=0.25 if driver=='DOBOT_MAGICIAN' else max(0.5,float(self.profile.interval_ms)/1000.0)
                while not self.stop_event.is_set():
                    cycle=time.time()
                    if cycle-last_hb>=10:
                        c.heartbeat(); last_hb=cycle
                    cmd=c.next_command()
                    command_executed=False
                    if cmd:
                        cid=cmd.get('id'); name=str(cmd.get('comando') or ''); payload=cmd.get('payload') or {}
                        # STOP sempre pode ser aceito quando o driver o implementa; demais comandos exigem liberação explícita.
                        emergency=name in {'DOBOT_STOP','PARAR_SEGURANCA','IHM_STOP'}
                        if self._expired(payload) and not emergency:
                            self.log(f"Comando expirado recusado pelo Edge: {name}"); c.confirm(cid,'FALHOU')
                        elif not commands_allowed and not emergency:
                            self.log(f"Comando BLOQUEADO por política local: {name}"); c.confirm(cid,'FALHOU')
                        else:
                            try:self.adapter.execute_command(name,payload); c.confirm(cid,'CONCLUIDO'); command_executed=True; self.log(f"Comando concluído: {name}")
                            except Exception as e:c.confirm(cid,'FALHOU'); self.log(f"Comando falhou: {name} | {e}")
                    # A leitura periódica continua respeitando o intervalo configurado,
                    # mas comandos são buscados independentemente a cada 100 ms. Após
                    # um comando, publicamos o novo estado imediatamente.
                    now=time.time()
                    if command_executed or now>=next_telemetry:
                        data=self.adapter.read_telemetry() or {}
                        if data:
                            if str(cfg.get('controlador') or '').upper() == 'IMPRESSORA_3D':
                                data = normalize_printer3d_telemetry(data, protocol=cfg.get('protocolo') or driver)
                            data.setdefault('origem',driver); c.telemetry(data)
                        next_telemetry=now+interval
                    elapsed=time.time()-cycle
                    self.stop_event.wait(max(0.01,COMMAND_POLL_SECONDS-elapsed))
            except Exception as e:
                self.status('ERROR',error=str(e)); self.log(f"Falha: {e}")
                try:
                    if self.adapter:self.adapter.close()
                except Exception:pass
                self.adapter=None
                if self.stop_event.wait(backoff):break
                backoff=min(backoff*2,30)
        self.status('STOPPED')

class EdgeRuntimeManager:
    def __init__(self,log,status):self.log=log;self.status=status;self.runtimes={};self.lock=threading.RLock()
    @staticmethod
    def _identity(p):return (str(p.server_url).strip().rstrip('/').lower(),int(p.machine_id or 0))
    @staticmethod
    def _serial_port(p):
        params=p.params or {}; port=str(params.get('serialPort') or params.get('portName') or '').strip().upper()
        return port if port and port!='AUTO' else None
    @classmethod
    def _conflicts(cls,a,b):
        if cls._identity(a)==cls._identity(b):return True
        pa,pb=cls._serial_port(a),cls._serial_port(b)
        return bool(pa and pb and pa==pb)
    def start(self,p:MachineProfile):
        # Remove qualquer worker da mesma máquina ou da mesma COM, mesmo que
        # um novo provisionamento tenha criado outro UUID local.
        with self.lock:
            conflicts=[(pid,rt) for pid,rt in self.runtimes.items() if self._conflicts(rt.profile,p)]
            for pid,_ in conflicts:self.runtimes.pop(pid,None)
        for _,rt in conflicts:rt.stop(wait=True)
        rt=MachineRuntime(p,self.log,self.status)
        with self.lock:self.runtimes[p.id]=rt
        rt.start()
    def stop(self,pid):
        with self.lock:rt=self.runtimes.pop(pid,None)
        if rt:rt.stop(wait=True)
    def start_all(self,profiles):
        for p in profiles:
            if p.enabled:self.start(p)
    def stop_all(self):
        with self.lock:pids=list(self.runtimes)
        for pid in pids:self.stop(pid)
    def reconcile(self,profiles):
        active_ids={p.id for p in profiles}
        with self.lock:orphans=[pid for pid in self.runtimes if pid not in active_ids]
        for pid in orphans:self.stop(pid)
