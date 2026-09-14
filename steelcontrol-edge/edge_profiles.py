from __future__ import annotations
import json, os, uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any
from secret_store import protect_text, unprotect_text

DRIVER_NAMES={
 'AUTO':'Automático (pelo cadastro)', 'DOBOT_MAGICIAN':'Dobot Magician', 'MODBUS_TCP':'Modbus TCP',
 'MODBUS_RTU':'Modbus RTU', 'OPC_UA':'OPC UA', 'MQTT':'MQTT', 'HTTP_REST':'HTTP / REST',
 'TCP_IP':'TCP/IP genérico (JSON)', 'SERIAL_JSON':'Serial genérica (JSON)', 'MOCK':'Simulador'
}

def config_dir()->Path:
    base=os.environ.get('PROGRAMDATA') or os.environ.get('APPDATA') or str(Path.home())
    return Path(base)/'SteelControl'/'Edge'
def profiles_path()->Path:return config_dir()/'edge-profiles.json'

@dataclass
class MachineProfile:
    id:str=field(default_factory=lambda:str(uuid.uuid4()))
    label:str='Nova máquina'
    server_url:str='http://127.0.0.1:3000'
    machine_id:int=0
    device_key:str=''
    driver:str='AUTO'
    enabled:bool=True
    allow_commands:bool=False
    interval_ms:int=2000
    params:dict[str,Any]=field(default_factory=dict)
    def normalized(self):
        self.server_url=self.server_url.strip().rstrip('/'); self.machine_id=int(self.machine_id or 0)
        self.device_key=self.device_key.strip(); self.driver=(self.driver or 'AUTO').strip().upper(); self.interval_ms=max(500,int(self.interval_ms or 2000))
        self.label=(self.label or f'Máquina {self.machine_id}').strip(); return self
    def validate(self):
        self.normalized()
        if not self.server_url.startswith(('http://','https://')):raise ValueError('Servidor deve começar com http:// ou https://')
        if self.machine_id<=0:raise ValueError('ID da máquina inválido.')
        if len(self.device_key)<16:raise ValueError('Device Key inválida/incompleta.')
        if self.driver not in DRIVER_NAMES:raise ValueError(f'Driver inválido: {self.driver}')

@dataclass
class EdgeStore:
    profiles:list[MachineProfile]=field(default_factory=list)
    schema:int=2


def save_store(store:EdgeStore)->Path:
    target=profiles_path(); target.parent.mkdir(parents=True,exist_ok=True)
    items=[]
    for p in store.profiles:
        p.validate(); raw=asdict(p); raw.pop('device_key',None); raw['device_key_protected']=protect_text(p.device_key); items.append(raw)
    payload={'schema':2,'profiles':items}; target.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8'); return target

def load_store()->EdgeStore:
    target=profiles_path()
    if not target.exists():
        # Migra Edge 1.0 quando existir.
        legacy=config_dir()/'edge-config.json'
        if legacy.exists():
            try:
                d=json.loads(legacy.read_text(encoding='utf-8')); key=unprotect_text(str(d.get('device_key_protected') or ''))
                p=MachineProfile(label=f"Máquina {d.get('machine_id') or ''}",server_url=str(d.get('server_url') or 'http://127.0.0.1:3000'),machine_id=int(d.get('machine_id') or 0),device_key=key,driver='DOBOT_MAGICIAN',interval_ms=int(d.get('interval_ms') or 1000),params={'serialPort':d.get('port') or 'AUTO','baud':int(d.get('baud') or 115200)},allow_commands=bool(d.get('allow_motion',False)))
                if p.machine_id and p.device_key:return EdgeStore([p])
            except Exception:pass
        return EdgeStore()
    try:
        d=json.loads(target.read_text(encoding='utf-8')); out=[]
        for raw in d.get('profiles') or []:
            key=unprotect_text(str(raw.get('device_key_protected') or ''))
            out.append(MachineProfile(id=str(raw.get('id') or uuid.uuid4()),label=str(raw.get('label') or 'Máquina'),server_url=str(raw.get('server_url') or 'http://127.0.0.1:3000'),machine_id=int(raw.get('machine_id') or 0),device_key=key,driver=str(raw.get('driver') or 'AUTO'),enabled=bool(raw.get('enabled',True)),allow_commands=bool(raw.get('allow_commands',False)),interval_ms=int(raw.get('interval_ms') or 2000),params=dict(raw.get('params') or {})).normalized())
        return EdgeStore(out)
    except Exception:return EdgeStore()
