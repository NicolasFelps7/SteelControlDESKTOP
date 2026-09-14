from __future__ import annotations
import requests
from .base import BaseAdapter, AdapterError

class HttpRestAdapter(BaseAdapter):
    name="HTTP / REST"
    def connect(self):
        self.session=requests.Session(); self.connected=True
    def _base(self):
        explicit=str(self.params.get("url") or "").strip()
        if explicit:return explicit.rstrip("/")
        host=str(self.params.get("host") or "").strip(); port=self.params.get("port")
        if not host: raise AdapterError("Informe host/URL do equipamento HTTP.")
        scheme=str(self.params.get("scheme") or "http")
        return f"{scheme}://{host}{':' + str(port) if port else ''}"
    def read_telemetry(self):
        endpoint=str(self.params.get("endpoint") or "/telemetry")
        r=self.session.get(self._base()+endpoint, timeout=float(self.params.get("timeout") or 5)); r.raise_for_status()
        data=r.json()
        if not isinstance(data,dict): raise AdapterError("Resposta HTTP de telemetria não é objeto JSON.")
        return data
    def execute_command(self, command, payload=None):
        endpoint=str(self.params.get("commandEndpoint") or "/command")
        r=self.session.post(self._base()+endpoint,json={"comando":command,"payload":payload or {}},timeout=float(self.params.get("timeout") or 5)); r.raise_for_status()
