from __future__ import annotations
import threading,time,traceback
from typing import Callable
from adapters import create_adapter,infer_driver,AdapterError
from edge_client import SteelControlClient
from edge_profiles import MachineProfile

class MachineRuntime:
    def __init__(self, profile:MachineProfile, log:Callable[[str,str],None], status:Callable[[str,str,dict],None]):
        self.profile=profile; self.log_cb=log; self.status_cb=status; self.stop_event=threading.Event(); self.thread=None; self.adapter=None
    def log(self,msg): self.log_cb(self.profile.id,msg)
    def status(self,state,**extra): self.status_cb(self.profile.id,state,extra)
    def start(self):
        if self.thread and self.thread.is_alive():return
        self.stop_event.clear(); self.thread=threading.Thread(target=self._run,name=f"edge-{self.profile.machine_id}",daemon=True); self.thread.start()
    def stop(self):
        self.stop_event.set()
        try:
            if self.adapter:self.adapter.close()
        except Exception:pass
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
        return p
    def _run(self):
        backoff=1
        while not self.stop_event.is_set():
            try:
                c=SteelControlClient(self.profile.server_url,self.profile.machine_id,self.profile.device_key)
                cfg=c.config(); self.profile.label=str(cfg.get('nome') or self.profile.label)
                requested=self.profile.driver
                driver=infer_driver(cfg.get('controlador'),cfg.get('protocolo'),False) if requested=='AUTO' else requested
                params=self._params(cfg); self.log(f"Configuração validada | driver={driver} | protocolo={cfg.get('protocolo') or '—'}")
                self.adapter=create_adapter(driver,params); self.adapter.connect(); self.status('ONLINE',driver=driver,controller=cfg.get('controlador'),protocol=cfg.get('protocolo')); self.log('Driver conectado.')
                backoff=1; last_hb=0
                interval=max(0.5,float(self.profile.interval_ms)/1000.0)
                while not self.stop_event.is_set():
                    cycle=time.time()
                    if cycle-last_hb>=10:
                        c.heartbeat(); last_hb=cycle
                    data=self.adapter.read_telemetry() or {}
                    if data:
                        data.setdefault('origem',driver); c.telemetry(data)
                    cmd=c.next_command()
                    if cmd:
                        cid=cmd.get('id'); name=str(cmd.get('comando') or ''); payload=cmd.get('payload') or {}
                        # STOP sempre pode ser aceito quando o driver o implementa; demais comandos exigem liberação explícita.
                        emergency=name in {'DOBOT_STOP','PARAR_SEGURANCA','IHM_STOP'}
                        if not self.profile.allow_commands and not emergency:
                            self.log(f"Comando BLOQUEADO por política local: {name}"); c.confirm(cid,'FALHOU')
                        else:
                            try:self.adapter.execute_command(name,payload); c.confirm(cid,'CONCLUIDO'); self.log(f"Comando concluído: {name}")
                            except Exception as e:c.confirm(cid,'FALHOU'); self.log(f"Comando falhou: {name} | {e}")
                    elapsed=time.time()-cycle
                    self.stop_event.wait(max(0.05,interval-elapsed))
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
    def __init__(self,log,status):self.log=log;self.status=status;self.runtimes={}
    def start(self,p:MachineProfile):
        self.stop(p.id); rt=MachineRuntime(p,self.log,self.status); self.runtimes[p.id]=rt; rt.start()
    def stop(self,pid):
        rt=self.runtimes.pop(pid,None)
        if rt:rt.stop()
    def start_all(self,profiles):
        for p in profiles:
            if p.enabled:self.start(p)
    def stop_all(self):
        for pid in list(self.runtimes):self.stop(pid)
