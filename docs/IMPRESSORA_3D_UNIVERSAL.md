# SteelControl — IHM dedicada para impressora 3D

A impressora 3D continua sendo cadastrada pelo controlador `IMPRESSORA_3D`, mas não usa mais o painel industrial genérico. Ao selecionar esse equipamento, o SteelControl apresenta uma **IHM própria de produção aditiva**, desenhada para os sinais típicos de uma impressora 3D.

## O que a IHM mostra

- trabalho/arquivo atual, progresso, camada, tempo decorrido, restante e ETA;
- processo térmico com leitura e alvo;
- velocidade, ventoinha, fluxo/alimentação, potência/exposição;
- material, consumo e material restante quando o equipamento informar;
- posição X/Y/Z/E quando disponível;
- ecossistema, origem da telemetria, firmware, host/IP e última leitura;
- alarmes, porta/tampa, emergência e intertravamentos;
- tendência térmica local no Desktop;
- representação visual da impressora na IHM.

## Tecnologias

O mesmo painel se adapta sem trocar de tela:

- **FDM / FFF:** bico/extrusor, mesa, câmara, fluxo, ventoinha e filamento;
- **SLA / MSLA / DLP:** resina/processo, plataforma, câmara, exposição/UV e lift;
- **SLS:** leito/processo, câmara, alimentação de pó e potência de laser;
- **proprietárias:** utiliza os campos equivalentes que o bridge/Edge fornecer.

Campos que a máquina não fornece permanecem como `--`. A interface não cria leituras inexistentes.

## Contrato de telemetria

O Edge normaliza os sinais em `dadosExtras.impressora3d`. O schema mais novo é `steelcontrol-printer3d-hmi-v2`, mantendo compatibilidade com o contrato anterior. Exemplo:

```json
{
  "dadosExtras": {
    "impressora3d": {
      "technology": "FDM",
      "state": "printing",
      "filename": "peca_tcc.gcode",
      "progress": 72,
      "nozzle": { "current": 207, "target": 210 },
      "bed": { "current": 59, "target": 60 },
      "chamber": { "current": 34 },
      "layer": { "current": 184, "total": 256 },
      "elapsedSeconds": 5400,
      "remainingSeconds": 2100,
      "speedPercent": 100,
      "fanPercent": 80,
      "flowPercent": 100,
      "material": "PLA",
      "position": { "x": 112.4, "y": 83.1, "z": 36.8, "e": 842.0 },
      "firmware": "Klipper",
      "host": "100.64.0.12",
      "safety": { "door": false, "interlock": true }
    }
  }
}
```

A IHM remota é apresentada em modo de monitoramento. Comandos físicos continuam sujeitos às políticas de autorização e segurança do SteelControl/Edge.
