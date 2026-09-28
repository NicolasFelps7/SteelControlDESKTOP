# SteelControl Edge 2.0

Gateway multi-máquina do SteelControl. O cliente configura equipamentos sem abrir código, editar `.env` ou usar VS Code.

## Drivers disponíveis

- Dobot Magician (USB/Serial)
- Modbus TCP
- Modbus RTU
- OPC UA
- MQTT
- HTTP / REST
- TCP/IP genérico com JSON por linha
- Serial genérica com JSON por linha
- Simulador MOCK

O modo **AUTO** consulta o cadastro da máquina no SteelControl e escolhe o adaptador pelo `controlador`/`protocolo`.

## Fluxo do cliente

1. Cadastrar a máquina no Desktop ou Mobile como **Equipamento real**.
2. Selecionar controlador/protocolo e preencher IP/porta/tópico/endpoint quando aplicável.
3. Gerar a Device Key.
4. No Desktop, usar **Copiar para SteelControl Edge** (ou copiar ID, servidor e chave manualmente).
5. No Edge 2.0, clicar **Importar**.
6. Testar a credencial e salvar.
7. Manter o driver em **AUTO** ou escolher explicitamente.
8. Iniciar a máquina ou **Iniciar todas**.

Um único Edge pode manter várias máquinas simultaneamente.

## Segurança

- Device Keys são protegidas por Windows DPAPI em `%ProgramData%\SteelControl\Edge\edge-profiles.json`.
- Cada máquina tem uma Device Key própria.
- Comandos físicos ficam **bloqueados por padrão**; telemetria continua disponível.
- Para liberar comandos o operador precisa marcar a opção e digitar `LIBERAR`.
- E-stop físico, Safety PLC, relés e intertravamentos continuam obrigatórios; o Edge não os substitui.

## Configuração específica de protocolo

Os campos comuns do cadastro (`host`, `porta`, `unitId`, `endpoint`, `topico`) são enviados ao Edge automaticamente pelo backend.

O Edge consulta a fila de comandos a cada 100 ms, independentemente do intervalo
de telemetria configurado. No Dobot Magician, mobile e desktop usam exatamente
o mesmo caminho autenticado até o Edge. O envio serial ao braço é imediato e o
resultado é confirmado por telemetria real antes de concluir o movimento.

A versão 2.1.3 também impede duas instâncias do Edge no mesmo computador e
encerra o worker anterior antes de reabrir uma porta COM. Isso evita o erro
`PermissionError: Acesso negado` causado por duas rotinas disputando o Dobot.

Na versão 2.1.4, perfis `DOBOT_MAGICIAN` autenticados são liberados
automaticamente para receber a fila validada do backend. O provisionamento não
volta mais um perfil existente para “comandos bloqueados”.

Na versão 2.1.5, **Limpar alarmes** não usa mais a parada forçada durante a
recuperação. A rotina limpa a fila, libera uma parada anterior, apaga os bits de
alarme, confirma o estado real e reinicializa os parâmetros do controlador.
Isso evita que firmwares do Magician/Lite mantenham o alarme 0 ativo por causa
da própria sequência de limpeza, sem ignorar ou mascarar alarmes reais.

Na versão 2.1.6, a recuperação segue a ordem do SDK do Magician
`StopExec -> ClearQueue -> ClearAllAlarmsState -> StartExec`. A fila somente é
reiniciada depois que o controlador confirma a limpeza; isso impede que um alvo
PTP inválido dispare novamente o alarme 18 durante a recuperação. Firmwares que
mantêm apenas o bit 0 após confirmarem a limpeza podem executar HOME e a fila
validada; o valor bruto continua registrado em `rawAlarms`. Qualquer outro bit
permanece bloqueante.

Na versão 2.1.7, a fila autenticada e auditável continua no SteelControl, mas
HOME, PTP e efetuadores são enviados ao protocolo serial em modo imediato. Isso
evita que determinados firmwares Magician/Lite aceitem o item sem avançar a fila
interna. O Edge só conclui PTP depois de confirmar movimento e posição pela pose
real; limites, alarmes, permissão local e STOP permanecem ativos.
Configurações avançadas podem ser colocadas em `integracaoMeta.edge` pelo integrador, por exemplo mapas de registradores Modbus ou NodeIds OPC UA.
