from __future__ import annotations
import logging, signal, time
from datetime import datetime,timezone
from config import Config
from steelcontrol_client import SteelControlClient
from drivers.mock_driver import MockDobotDriver
from drivers.magician_driver import MagicianSerialDriver

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log=logging.getLogger("steelcontrol.dobot")
running=True

def expired(payload):
    value=payload.get("expiresAt") if isinstance(payload,dict) else None
    if not value:return False
    try:return datetime.fromisoformat(str(value).replace("Z","+00:00"))<=datetime.now(timezone.utc)
    except Exception:return True

def stop(*_):
    global running; running=False

signal.signal(signal.SIGINT, stop)
try: signal.signal(signal.SIGTERM, stop)
except Exception: pass

def main():
    cfg=Config(); cfg.validate()
    client=SteelControlClient(cfg.steelcontrol_url,cfg.machine_id,cfg.device_key)
    remote=client.config()
    log.info("SteelControl conectado | máquina=%s | %s", remote.get("maquinaId"), remote.get("nome"))
    mode=cfg.mode
    driver=MockDobotDriver() if mode=="mock" else MagicianSerialDriver(cfg.port,cfg.baud)
    driver.connect()
    server_allows=((remote.get("integracaoMeta") or {}).get("dobot") or {}).get("remoteControlEnabled") is True
    motion_allowed=cfg.allow_motion and server_allows
    log.info("Dobot Gateway iniciado | modo=%s | movimento=%s", mode.upper(), "LIBERADO" if motion_allowed else "BLOQUEADO")
    next_heartbeat=0.0
    next_telemetry=0.0
    try:
        while running:
            started=time.monotonic()
            if started>=next_heartbeat:
                client.heartbeat(); next_heartbeat=started+5
            # Consulta a fila em alta frequência para resposta imediata. A telemetria
            # mantém sua própria frequência para não sobrecarregar o backend.
            command=client.next_command()
            if command:
                status="CONCLUIDO"
                try:
                    payload=command.get("payload") or {};name=command.get("comando","")
                    if expired(payload) and name not in {"DOBOT_STOP","PARAR_SEGURANCA"}:raise RuntimeError("Comando expirado recusado pelo gateway.")
                    driver.execute(name, payload, motion_allowed)
                    log.info("Comando %s concluído",command.get("comando"))
                except Exception as exc:
                    status="FALHOU"; log.error("Comando %s falhou: %s",command.get("comando"),exc)
                client.confirm(int(command["id"]),status)
            now=time.monotonic()
            if command or now>=next_telemetry:
                snapshot=driver.snapshot()
                snapshot["latenciaMs"]=max(0,int((time.monotonic()-started)*1000))
                client.telemetry(snapshot)
                next_telemetry=now+(cfg.interval_ms/1000)
                dobot=snapshot.get("dadosExtras",{}).get("dobot",{})
                pose=dobot.get("pose",{})
                log.info("%s | X %.1f Y %.1f Z %.1f | alarmes=%s", mode.upper(), pose.get("x",0),pose.get("y",0),pose.get("z",0),len(dobot.get("alarms",[])))
            elapsed=(time.monotonic()-started)*1000
            time.sleep(max(0.02,(cfg.command_poll_ms-elapsed)/1000))
    finally:
        driver.close(); log.info("Dobot Gateway encerrado")

if __name__=="__main__": main()
