from __future__ import annotations
import logging, signal, time
from config import Config
from steelcontrol_client import SteelControlClient
from drivers.mock_driver import MockDobotDriver
from drivers.magician_driver import MagicianSerialDriver

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log=logging.getLogger("steelcontrol.dobot")
running=True

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
    log.info("Dobot Gateway iniciado | modo=%s | movimento=%s", mode.upper(), "LIBERADO" if cfg.allow_motion else "BLOQUEADO")
    next_heartbeat=0.0
    try:
        while running:
            started=time.monotonic()
            if started>=next_heartbeat:
                client.heartbeat(); next_heartbeat=started+5
            # comando seguro: backend faz whitelist e gateway aplica trava física
            command=client.next_command()
            if command:
                status="CONCLUIDO"
                try:
                    driver.execute(command.get("comando",""), command.get("payload") or {}, cfg.allow_motion)
                    log.info("Comando %s concluído",command.get("comando"))
                except Exception as exc:
                    status="FALHOU"; log.error("Comando %s falhou: %s",command.get("comando"),exc)
                client.confirm(int(command["id"]),status)
            snapshot=driver.snapshot()
            snapshot["latenciaMs"]=max(0,int((time.monotonic()-started)*1000))
            client.telemetry(snapshot)
            dobot=snapshot.get("dadosExtras",{}).get("dobot",{})
            pose=dobot.get("pose",{})
            log.info("%s | X %.1f Y %.1f Z %.1f | alarmes=%s", mode.upper(), pose.get("x",0),pose.get("y",0),pose.get("z",0),len(dobot.get("alarms",[])))
            elapsed=(time.monotonic()-started)*1000
            time.sleep(max(0.05,(cfg.interval_ms-elapsed)/1000))
    finally:
        driver.close(); log.info("Dobot Gateway encerrado")

if __name__=="__main__": main()
