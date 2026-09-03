# IHM / Controle Industrial do SteelControl

## Objetivo

O painel de controlador do SteelControl agora inclui uma IHM supervisionada para demonstração e integração real com controladores/gateways. Ela exibe o fluxo de processo, sensores, estado operacional, modo AUTO/MANUAL, intertravamentos e comandos START, STOP, RESET e ACK.

## Simulação

1. Cadastre uma máquina com controlador compatível (ESP32, CLP/PLC, controlador robótico, CNC, gateway industrial ou outro).
2. Mantenha **Modo de operação = Simulação do SteelControl**.
3. Abra o painel do controlador.
4. START/STOP e AUTO/MANUAL alteram o processo simulado. A animação, produção, ciclos e sensores acompanham o estado.

A simulação não envia comandos para hardware físico.

## Equipamento real

O controle remoto real é **opt-in**. No cadastro/edição da máquina:

1. Selecione **Equipamento real**.
2. Selecione o controlador e protocolo.
3. Marque **Habilitar comandos remotos no equipamento real** somente depois de testar a integração.
4. Configure a Device Key no gateway/ESP32.
5. Faça o equipamento publicar `dadosExtras.hmi` na telemetria.

Formato mínimo recomendado:

```json
{
  "dadosExtras": {
    "hmi": {
      "running": false,
      "mode": "AUTO",
      "alarm": false,
      "interlocks": {
        "startPermitted": true,
        "estopOk": true,
        "safetyDoorClosed": true,
        "guardOk": true
      },
      "sensors": {
        "entry": false,
        "middle": false,
        "exit": false
      }
    }
  }
}
```

O arquivo `device-examples/ESP32_HTTP_STEELCONTROL.ino` já implementa o protocolo da fila, ACK e o formato da IHM. O START remoto nasce bloqueado com `HMI_REMOTE_START_ARMED=false`; só altere depois de implementar e validar os intertravamentos físicos.

## Regras de segurança implementadas

- Comandos aceitos por allowlist fechada.
- Permissão por cargo no backend.
- Controle remoto real desativado por padrão.
- START real exige conexão estável/telemetria recente.
- START real exige `interlocks.startPermitted=true` informado pelo equipamento.
- E-stop/porta/proteção informados como inseguros bloqueiam START.
- Variáveis acima do limite de atenção bloqueiam START.
- Parada de segurança do SteelControl bloqueia START.
- STOP operacional cancela START/RESET/troca de modo ainda pendentes.
- Comandos da IHM possuem TTL curto e são cancelados no backend se expirarem antes de chegar ao equipamento.
- Reentrega continua protegida por ACK idempotente e Device Key.
- RESET da IHM não libera parada de segurança.

## Limite de responsabilidade

O STOP da IHM é uma **parada operacional**. Ele não é botão de emergência e não substitui E-stop físico, relé de segurança, Safety PLC, contatores de segurança, cortina de luz, chave de porta ou qualquer dispositivo exigido pelo projeto elétrico/mecânico da máquina.
