from __future__ import annotations
import json, queue, time
from .base import BaseAdapter, AdapterError

class MqttAdapter(BaseAdapter):
    name="MQTT"
    def connect(self):
        try: import paho.mqtt.client as mqtt
        except Exception as e: raise AdapterError("paho-mqtt não instalado.") from e
        self.q=queue.Queue(maxsize=20); host=str(self.params.get("host") or "").strip(); port=int(self.params.get("port") or 1883); self.topic=str(self.params.get("topic") or self.params.get("topico") or "").strip()
        if not host or not self.topic: raise AdapterError("Informe broker e tópico MQTT.")
        self.command_topic=str(self.params.get("commandTopic") or (self.topic.rstrip("/")+"/command"))
        try:self.client=mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        except Exception:self.client=mqtt.Client()
        username=self.params.get("username"); password=self.params.get("password")
        if username:self.client.username_pw_set(str(username),str(password or ""))
        def on_connect(client,userdata,flags,reason_code,*args): client.subscribe(self.topic)
        def on_message(client,userdata,msg):
            try:
                data=json.loads(msg.payload.decode("utf-8",errors="replace"))
                if isinstance(data,dict):
                    try:self.q.put_nowait(data)
                    except queue.Full:
                        try:self.q.get_nowait(); self.q.put_nowait(data)
                        except Exception:pass
            except Exception:pass
        self.client.on_connect=on_connect; self.client.on_message=on_message; self.client.connect(host,port,keepalive=30); self.client.loop_start(); self.connected=True
    def read_telemetry(self):
        try:return self.q.get(timeout=float(self.params.get("readTimeout") or 0.25))
        except queue.Empty:return {}
    def execute_command(self, command, payload=None):
        info=self.client.publish(self.command_topic,json.dumps({"comando":command,"payload":payload or {}},ensure_ascii=False),qos=int(self.params.get("qos") or 1));
        if getattr(info,"rc",0)!=0: raise AdapterError(f"Falha MQTT publish rc={info.rc}")
    def close(self):
        try:self.client.loop_stop(); self.client.disconnect()
        except Exception:pass
        super().close()
