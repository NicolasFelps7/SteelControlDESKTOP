# Dobot — modos Manual e Automático

O painel exclusivo do Dobot oferece dois modos de operação supervisionada.

## Manual

Mantém os comandos HOME, STOP, limpeza de alarmes, ventosa, garra e movimento cartesiano PTP X/Y/Z/R. Use o modo manual também para posicionar o braço e ensinar os pontos do ciclo.

## Automático — pick-and-place

O ciclo usa cinco pontos ensinados a partir da pose real recebida do SteelControl Edge:

- P0 — espera
- P1 — acima da peça
- P2 — coleta
- P3 — acima do destino
- P4 — entrega

Sequência: P0 → P1 → P2 → ventosa ON → P1 → P3 → P4 → ventosa OFF → P3 → P0.

O operador escolhe de 1 a 20 repetições no Desktop e velocidade automática limitada a 40%. No Mobile há presets de repetição e a mesma limitação de velocidade. O ciclo valida que todos os pontos foram ensinados antes de iniciar e acompanha a telemetria para confirmar cada destino.

Enquanto o automático está ativo, o retorno ao modo manual fica intertravado. PAUSAR atua entre etapas e PARAR envia DOBOT_STOP. A parada da interface é operacional e não substitui um dispositivo físico de emergência ou circuito de segurança certificado.

Os pontos do Desktop são guardados localmente por máquina no navegador. No Mobile eles permanecem durante a sessão atual da tela.
