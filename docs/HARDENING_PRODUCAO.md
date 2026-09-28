# Hardening de produção do SteelControl

## Controles implementados

| Controle | Implementação |
|---|---|
| HTTPS | Backend redireciona GET/HEAD e recusa mutações HTTP em produção; Caddy de exemplo encerra TLS. |
| Mobile | Release Android bloqueia cleartext; HTTP local exige build de desenvolvimento explícito. |
| Sessão desktop | JWT em cookie HttpOnly, Secure e SameSite=Strict; o frontend remove tokens antigos do localStorage. |
| CSRF | Operações autenticadas por cookie validam Origin/Sec-Fetch-Site. |
| Dobot | Liberação dupla (`remoteControlEnabled` no servidor + autorização local do Edge). STOP permanece disponível. |
| Fila | TTL curto, recusa de comando expirado no servidor/Edge e cancelamento de PTP antigo. |
| Movimento | Envelope PTP: X/Y -320..320 mm, Z -20..250 mm, R -180..180°, velocidade 1..60%. |
| Biometria | AES-256-GCM no banco, com chave independente e compatibilidade de leitura para registros legados. |
| Backup | Dump PostgreSQL e `.env` protegidos com DPAPI do usuário Windows. |
| Administradores | MFA por código de e-mail em login por senha, obrigatório por padrão em produção. |
| Escala | Redis opcional para rate limit distribuído; fallback local quando não configurado. |
| Observabilidade | health/readiness, métricas Prometheus protegidas e eventos de segurança estruturados. |
| Perfil nível 9 | Inicialização falha de forma segura se HTTPS, MFA, Redis, criptografia ou monitoramento estiverem ausentes. |

## Ativação segura

No Windows, execute primeiro:

```powershell
.\CONFIGURAR_PRODUCAO_NIVEL9.ps1
docker compose --env-file deploy/.env -f deploy/redis.compose.yml up -d
npm run check:security9
```

O configurador solicita domínio, PostgreSQL e e-mail sem imprimir as senhas, gera todas as chaves criptográficas e cria os arquivos locais ignorados pelo Git. Depois execute `VALIDAR_NIVEL9.ps1`.

1. Gere `JWT_SECRET`, `SENSITIVE_DATA_KEY`, `MONITORING_TOKEN` e `REDIS_PASSWORD` diferentes.
2. Configure o DNS e use `deploy/Caddyfile.example` para obter HTTPS.
3. Suba Redis com `docker compose -f deploy/redis.compose.yml up -d` e configure `REDIS_URL`.
4. Execute `npm --prefix backend run face:encrypt` uma vez para criptografar biometrias antigas.
5. Gere o app com `--dart-define=API_URL=https://steelcontrol.seu-dominio.com`. Não habilite HTTP em release.
6. No Dobot, habilite o controle no cadastro e separadamente no Edge somente depois de validar área, alarmes e HOME.

Para gerar o APK final sem permitir HTTP:

```powershell
cd SteelControlMOBILE-main
.\BUILD_PRODUCAO_NIVEL9.ps1
```

Para desenvolvimento local temporário do app:

```powershell
flutter run -d RX2X802JWQL --dart-define=API_URL=http://127.0.0.1:3000 --dart-define=ALLOW_INSECURE_HTTP=true
```

## Rede industrial

- VLAN de gestão: servidor, estações administrativas e monitoramento.
- VLAN industrial: Edge e equipamentos, sem acesso direto à internet.
- Firewall: Edge inicia conexão apenas para a API HTTPS; nenhuma porta serial deve ser publicada na rede.
- Wi-Fi do tablet: SSID corporativo separado, WPA2-Enterprise/WPA3 e sem comunicação lateral entre clientes.
- Execute `CONFIGURAR_REDE_INDUSTRIAL.ps1` primeiro sem `-Apply`, revise o plano e depois aplique como Administrador.

Separação por VLAN depende do switch/roteador da escola ou empresa; o software não consegue criar essa fronteira física sozinho.

## Pentest e aceite

Antes do TCC e antes de produção:

1. Execute `npm run quality` e `npm audit --audit-level=high`.
2. Rode o workflow **Security Scan / OWASP ZAP** contra um ambiente de homologação sem dados reais.
3. Teste IDOR entre duas empresas, CSRF, brute force, expiração de sessão, replay de comando e reconexão tardia do Edge.
4. No Dobot, teste coordenadas fora da faixa, velocidade acima de 60%, comando vencido e STOP com controle remoto desativado.
5. Faça restauração real de um backup em banco vazio; checksum sem teste de restore não é suficiente.
6. Registre evidências, risco residual, responsável e data da correção.

O pentest deve ser executado somente em infraestrutura autorizada e preferencialmente por uma pessoa diferente de quem implementou o sistema.

## Critério para declarar 9/10

O software está preparado para o nível 9 quando `VALIDAR_NIVEL9.ps1` terminar em verde. A implantação só pode ser apresentada como nível 9 depois de também existirem evidências do DNS/HTTPS ativo, teste real de restauração, MFA recebido por um administrador, VLAN/firewall aplicados e pentest autorizado sem achados críticos ou altos pendentes.
