# SteelControl Dobot Gateway

Gateway Python que conecta o **Dobot Magician** ao protocolo de dispositivos do SteelControl.

## Modos
- `mock`: funciona agora, sem o braço, e envia pose/juntas/telemetria identificadas como DOBOT_MOCK.
- `real`: detecta porta COM, valida o equipamento com GetPose e lê pose/alarmes por protocolo serial a 115200 bps.

## Segurança
Movimentos físicos começam bloqueados (`DOBOT_ALLOW_MOTION=false`). Leitura, heartbeat e diagnóstico funcionam normalmente. Só altere para `true` depois de testar o robô em área livre e confirmar HOME/limites físicos.

## Primeiro teste sem braço
1. No SteelControl cadastre máquina em **Equipamento real**, controlador **Dobot Magician**, protocolo **USB / Serial**.
2. Copie a Device Key mostrada uma única vez.
3. Copie `.env.example` para `.env` e preencha `MACHINE_ID` e `DEVICE_KEY`.
4. Execute `INICIAR_DOBOT_MOCK.bat`.
5. Abra a máquina no dashboard e use a aba **Dobot**.

## Quando o braço chegar
1. Conecte o USB.
2. Mantenha `DOBOT_ALLOW_MOTION=false`.
3. Execute `INICIAR_DOBOT_REAL.bat`.
4. Confirme que X/Y/Z/R, J1..J4 e alarmes aparecem no SteelControl.
5. Somente depois libere movimento no `.env`.
