from .base import BaseAdapter, AdapterError
from .mock_adapter import MockAdapter
from .serial_adapter import SerialJsonAdapter
from .tcp_adapter import TcpJsonAdapter
from .http_adapter import HttpRestAdapter
from .modbus_adapter import ModbusTcpAdapter, ModbusRtuAdapter
from .mqtt_adapter import MqttAdapter
from .opcua_adapter import OpcUaAdapter
from .dobot_adapter import DobotMagicianAdapter

DRIVERS={
    "MOCK": MockAdapter,
    "DOBOT_MAGICIAN": DobotMagicianAdapter,
    "USB_SERIAL": SerialJsonAdapter,
    "SERIAL_JSON": SerialJsonAdapter,
    "MODBUS_RTU": ModbusRtuAdapter,
    "MODBUS_TCP": ModbusTcpAdapter,
    "OPC_UA": OpcUaAdapter,
    "MQTT": MqttAdapter,
    "HTTP_REST": HttpRestAdapter,
    "TCP_IP": TcpJsonAdapter,
}

def infer_driver(controller: str|None, protocol: str|None, simulation: bool=False) -> str:
    if simulation: return "MOCK"
    c=(controller or "").upper(); p=(protocol or "").upper()
    if c=="DOBOT_MAGICIAN": return "DOBOT_MAGICIAN"
    return p if p in DRIVERS else "SERIAL_JSON" if p=="USB_SERIAL" else (p or "MOCK")

def create_adapter(driver: str, params: dict):
    d=(driver or "").upper()
    cls=DRIVERS.get(d)
    if not cls: raise AdapterError(f"Driver '{d}' não instalado no Edge.")
    return cls(params)
