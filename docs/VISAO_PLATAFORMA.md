# SteelControl — Plataforma TOP

## Implementado nesta evolução
- Revogação server-side de JWT por `tokenVersion`.
- Logout remoto SSE Desktop/Mobile.
- ACK estrito.
- Safety release real condicionada a conexão estável + telemetria fresca.
- Manutenção transacional sem mascarar parada de segurança.
- Qualidade facial obrigatória no backend para cadastro.
- Face API fail-closed em container de produção e comparação de chave em tempo constante.
- Realtime de máquina consumível pelo Mobile.

## Próxima camada — exige infraestrutura/hardware real
- Redis/NATS para realtime multi-instância.
- MQTT, Modbus TCP e OPC UA validados em equipamentos reais.
- Prometheus/Grafana/OpenTelemetry.
- OEE/analytics alimentados por dados de disponibilidade, performance e qualidade confiáveis.
- Ordens de Serviço completas/CMMS.
- Backup/PITR, DR, pentest e testes de carga.

Esses itens não devem ser apresentados como implementados antes de existir infraestrutura e validação reais.
