# Checklist de segurança para release

## Git / segredos

- [ ] `backend/.env` não está versionado.
- [ ] `face-api/.env` não está versionado.
- [ ] `dobot-gateway/.env` não está versionado.
- [ ] Nenhuma senha real foi colocada em README, scripts ou prints.
- [ ] `npm run check:secrets` está verde.

## Banco

- [ ] Banco de produção não usa credenciais de desenvolvimento.
- [ ] Backup foi testado.
- [ ] `prisma migrate deploy` foi usado, nunca `migrate reset`.
- [ ] A URL do banco usa TLS quando o provedor exigir.

## JWT / e-mail / Face API

- [ ] `SECURITY_PROFILE=level9` e `npm run check:security9` está verde.
- [ ] `JWT_SECRET` possui 64+ caracteres aleatórios.
- [ ] `SENSITIVE_DATA_KEY`, `MONITORING_TOKEN` e `FACE_API_KEY` são diferentes.
- [ ] Senha de app do Gmail está somente no secret manager do provedor.
- [ ] `FACE_API_KEY` possui 32+ caracteres.
- [ ] A Face API usa HTTPS ou loopback local; nenhuma API pública usa HTTP.
- [ ] MFA de administrador foi recebido e validado.
- [ ] Redis está saudável e o backend recusa iniciar sem ele.

## Containers

- [ ] Backend roda como usuário `node`.
- [ ] Face API roda como usuário `steelcontrol`.
- [ ] Healthchecks estão ativos.
- [ ] Nenhum `.env` entra no build context.
- [ ] Imagens não usam tag `latest`.

## Industrial

- [ ] Device Keys de teste foram revogadas antes da demonstração final.
- [ ] Dobot permanece em MOCK quando não houver braço real conectado.
- [ ] Movimento real só é habilitado no gateway mediante configuração explícita.
- [ ] Área física do robô está isolada antes de testar comandos reais.

## Entrega

- [ ] `npm run quality` verde.
- [ ] GitHub Actions verde.
- [ ] E2E verde.
- [ ] Commit/tag final registrado.
- [ ] `VALIDAR_NIVEL9.ps1` finalizou em verde.
- [ ] Pentest autorizado não possui achados críticos ou altos pendentes.
