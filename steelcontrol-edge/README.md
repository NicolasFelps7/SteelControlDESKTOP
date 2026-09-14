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
Configurações avançadas podem ser colocadas em `integracaoMeta.edge` pelo integrador, por exemplo mapas de registradores Modbus ou NodeIds OPC UA.
