from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

class AdapterError(RuntimeError):
    pass

class BaseAdapter(ABC):
    """Contrato comum dos drivers físicos do SteelControl Edge.

    Por segurança, adapters são somente leitura até que allow_commands seja
    explicitamente habilitado no perfil local.
    """
    name = "Base"

    def __init__(self, params: dict[str, Any] | None = None):
        self.params = params or {}
        self.connected = False

    @abstractmethod
    def connect(self) -> None: ...

    @abstractmethod
    def read_telemetry(self) -> dict[str, Any]: ...

    def execute_command(self, command: str, payload: dict[str, Any] | None = None) -> None:
        raise AdapterError(f"O driver {self.name} não possui execução de comandos configurada.")

    def close(self) -> None:
        self.connected = False

    def diagnostics(self) -> dict[str, Any]:
        return {"driver": self.name, "connected": self.connected}
