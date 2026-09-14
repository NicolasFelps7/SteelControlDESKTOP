from __future__ import annotations
from .base import BaseAdapter, AdapterError

DEFAULT_MAP={"temperatura":0,"vibracao":1,"corrente":2,"consumoEnergia":3,"producao":4,"ciclos":5}

def _decode(regs, idx, scale=1.0):
    if idx is None or int(idx)>=len(regs): return None
    return float(regs[int(idx)])*float(scale)

class _ModbusBase(BaseAdapter):
    def _read(self):
        start=int(self.params.get("startAddress") or 0); count=int(self.params.get("registerCount") or 16); unit=int(self.params.get("unitId") or 1)
        # pymodbus 3 usa device_id; versões anteriores usam slave.
        try: rr=self.client.read_holding_registers(address=start,count=count,device_id=unit)
        except TypeError: rr=self.client.read_holding_registers(address=start,count=count,slave=unit)
        if rr.isError(): raise AdapterError(f"Falha Modbus: {rr}")
        regs=list(rr.registers or [])
        mapping=self.params.get("registerMap") or DEFAULT_MAP; scales=self.params.get("scales") or {}
        out={}
        for key,idx in mapping.items():
            value=_decode(regs,idx,scales.get(key,1.0))
            if value is not None: out[key]=int(value) if key in {"producao","ciclos"} else value
        out.setdefault("dadosExtras",{})["modbusRegisters"]=len(regs)
        return out
    def read_telemetry(self): return self._read()
    def execute_command(self, command, payload=None):
        writes=(self.params.get("commandRegisters") or {})
        cfg=writes.get(command)
        if not cfg: raise AdapterError(f"Comando {command} sem registrador mapeado.")
        addr=int(cfg.get("address")); value=int((payload or {}).get("value",cfg.get("value",1))); unit=int(self.params.get("unitId") or 1)
        try: rr=self.client.write_register(address=addr,value=value,device_id=unit)
        except TypeError: rr=self.client.write_register(address=addr,value=value,slave=unit)
        if rr.isError(): raise AdapterError(f"Falha ao escrever Modbus: {rr}")
    def close(self):
        try:self.client.close()
        except Exception:pass
        super().close()

class ModbusTcpAdapter(_ModbusBase):
    name="Modbus TCP"
    def connect(self):
        try: from pymodbus.client import ModbusTcpClient
        except Exception as e: raise AdapterError("pymodbus não instalado.") from e
        host=str(self.params.get("host") or "").strip(); port=int(self.params.get("port") or 502)
        if not host: raise AdapterError("Informe o IP/host do equipamento Modbus TCP.")
        self.client=ModbusTcpClient(host=host,port=port,timeout=float(self.params.get("timeout") or 3)); self.connected=bool(self.client.connect())
        if not self.connected: raise AdapterError(f"Não foi possível conectar em {host}:{port}.")

class ModbusRtuAdapter(_ModbusBase):
    name="Modbus RTU"
    def connect(self):
        try: from pymodbus.client import ModbusSerialClient
        except Exception as e: raise AdapterError("pymodbus/pyserial não instalado.") from e
        port=str(self.params.get("serialPort") or self.params.get("portName") or "").strip()
        if not port: raise AdapterError("Informe a porta serial Modbus RTU.")
        self.client=ModbusSerialClient(port=port,baudrate=int(self.params.get("baud") or 9600),parity=str(self.params.get("parity") or "N"),stopbits=int(self.params.get("stopBits") or 1),bytesize=int(self.params.get("dataBits") or 8),timeout=float(self.params.get("timeout") or 2)); self.connected=bool(self.client.connect())
        if not self.connected: raise AdapterError(f"Não foi possível abrir {port}.")
