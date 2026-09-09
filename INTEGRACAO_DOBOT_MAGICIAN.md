# Integração Dobot Magician

O `dobot-gateway/` converte o protocolo USB/Serial do Dobot para o contrato do SteelControl.

- `MOCK`: demonstração sem hardware.
- `REAL`: comunicação serial com Dobot conectado.
- Movimentos físicos permanecem bloqueados por padrão com `DOBOT_ALLOW_MOTION=false`.
- STOP operacional não substitui E-Stop, relé de segurança ou Safety PLC.

Antes da banca, valide porta COM, Device Key, heartbeat, telemetria, fila de comandos e ACK.
