# SteelControl — Hospedagem

Arquitetura recomendada: frontend servido pelo Node/Express, PostgreSQL gerenciado e Face API em serviço Python separado.

## Produção
- Use HTTPS na borda/reverse proxy.
- Configure `JWT_SECRET`, `DATABASE_URL`, `FACE_API_URL`, `FACE_API_KEY`, SMTP/Gmail e `CORS_ORIGINS`.
- Execute `prisma migrate deploy` antes do Node.
- Face API em container usa `STEELCONTROL_ENV=production` e recusa iniciar sem `FACE_API_KEY` forte.
- Nunca publique `.env`, keystore, Device Key em texto puro ou credenciais Gmail.

## Escala
O código atual é adequado para uma instância supervisionada. Para múltiplas instâncias, use Redis/NATS equivalente para Pub/Sub, rate limit, códigos temporários e presença realtime.
