from __future__ import annotations
from .base import BaseAdapter, AdapterError

class OpcUaAdapter(BaseAdapter):
    name="OPC UA"
    def connect(self):
        try: from asyncua.sync import Client
        except Exception as e: raise AdapterError("Biblioteca asyncua não instalada.") from e
        endpoint=str(self.params.get("endpoint") or "").strip()
        if not endpoint:
            host=str(self.params.get("host") or "").strip(); port=int(self.params.get("port") or 4840)
            if not host: raise AdapterError("Informe endpoint ou host OPC UA.")
            endpoint=f"opc.tcp://{host}:{port}"
        self.client=Client(endpoint,timeout=float(self.params.get("timeout") or 4));
        if self.params.get("username"): self.client.set_user(str(self.params["username"])); self.client.set_password(str(self.params.get("password") or ""))
        self.client.connect(); self.connected=True
    def read_telemetry(self):
        nodes=self.params.get("nodes") or {}
        if not nodes: raise AdapterError("Configure integrationMeta.edge.nodes para OPC UA.")
        out={}
        for key,node_id in nodes.items(): out[key]=self.client.get_node(str(node_id)).get_value()
        return out
    def execute_command(self, command, payload=None):
        nodes=self.params.get("commandNodes") or {}; node_id=nodes.get(command)
        if not node_id: raise AdapterError(f"Comando {command} sem nó OPC UA configurado.")
        value=(payload or {}).get("value",True); self.client.get_node(str(node_id)).set_value(value)
    def close(self):
        try:self.client.disconnect()
        except Exception:pass
        super().close()
