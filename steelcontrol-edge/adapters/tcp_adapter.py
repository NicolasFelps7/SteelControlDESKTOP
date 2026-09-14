from __future__ import annotations
import json, socket
from .base import BaseAdapter, AdapterError

class TcpJsonAdapter(BaseAdapter):
    name = "TCP/IP genérico / JSON"
    def connect(self):
        host=str(self.params.get("host") or "").strip(); port=int(self.params.get("port") or 0)
        if not host or port<=0: raise AdapterError("Informe host e porta TCP.")
        self.sock=socket.create_connection((host,port), timeout=float(self.params.get("timeout") or 3.0))
        self.sock.settimeout(float(self.params.get("timeout") or 1.0)); self.buffer=b""; self.connected=True
    def _line(self):
        while b"\n" not in self.buffer:
            chunk=self.sock.recv(4096)
            if not chunk: raise AdapterError("Conexão TCP encerrada pelo equipamento.")
            self.buffer+=chunk
        line,self.buffer=self.buffer.split(b"\n",1); return line.decode("utf-8",errors="replace").strip()
    def read_telemetry(self):
        raw=self._line()
        if not raw:return {}
        try:data=json.loads(raw)
        except Exception as e: raise AdapterError(f"TCP recebeu pacote não-JSON: {raw[:120]}") from e
        if not isinstance(data,dict): raise AdapterError("Telemetria TCP precisa ser objeto JSON.")
        return data
    def execute_command(self, command, payload=None):
        self.sock.sendall((json.dumps({"comando":command,"payload":payload or {}},ensure_ascii=False)+"\n").encode("utf-8"))
    def close(self):
        try:self.sock.close()
        except Exception:pass
        super().close()
