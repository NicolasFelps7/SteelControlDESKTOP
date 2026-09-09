# Integração de máquina real

Fluxo recomendado: equipamento/controlador -> gateway -> Device API SteelControl.

1. Cadastre a máquina e guarde a Device Key exibida uma única vez.
2. Gateway envia heartbeat e telemetria autenticados por `X-Device-Key`.
3. Gateway busca comandos com lease e confirma com ACK `CONCLUIDO` ou `FALHOU`.
4. Status de ACK diferente desses dois é rejeitado pelo backend.
5. Liberação de parada em equipamento real exige conexão estável, telemetria recente e sensores abaixo dos limites.

A parada do SteelControl é supervisória e não substitui a cadeia física de segurança.
