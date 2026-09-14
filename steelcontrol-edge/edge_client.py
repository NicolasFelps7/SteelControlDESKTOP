from __future__ import annotations
import requests

class SteelControlClient:
    def __init__(self, base_url:str, machine_id:int, device_key:str, timeout=8):
        self.base=base_url.rstrip('/'); self.machine_id=int(machine_id); self.timeout=timeout
        self.session=requests.Session(); self.session.headers.update({'X-Device-Key':device_key,'Accept':'application/json'})
    def _url(self,path): return f"{self.base}/device/{self.machine_id}{path}"
    def config(self):
        r=self.session.get(self._url('/config'),timeout=self.timeout); r.raise_for_status(); return r.json()
    def heartbeat(self):
        r=self.session.post(self._url('/heartbeat'),json={},timeout=self.timeout); r.raise_for_status(); return r.json()
    def telemetry(self,payload):
        r=self.session.post(self._url('/telemetria'),json=payload,timeout=self.timeout); r.raise_for_status(); return r.json()
    def next_command(self):
        r=self.session.get(self._url('/comandos/proximo'),timeout=self.timeout)
        if r.status_code==204:return None
        r.raise_for_status(); return r.json()
    def confirm(self,command_id,status):
        r=self.session.post(self._url(f'/comandos/{int(command_id)}/confirmar'),json={'status':status},timeout=self.timeout); r.raise_for_status(); return r.json()
