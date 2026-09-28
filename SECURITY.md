# SECURITY — SteelControl

## Modelo de ameaça resumido

### Autenticação
- Tokens JWT são assinados com segredo obrigatório e expiração curta.
- No desktop, a sessão usa cookie `HttpOnly`, `Secure` e `SameSite=Strict`; o JWT não é persistido no `localStorage`.
- Administradores autenticados por senha passam por MFA de código único quando `ADMIN_MFA_REQUIRED=true` (padrão de produção).
- O backend consulta o usuário atual no banco em toda rota protegida.
- Usuários desativados perdem acesso mesmo que ainda possuam token não expirado.
- Cargo e `empresaId` vêm do banco, não são confiados ao conteúdo antigo do token.

### Multi-tenant
Consultas de máquinas, funcionários e manutenção sempre devem filtrar por `empresaId`.

### E-mail
Códigos:
- 6 dígitos;
- validade limitada;
- limite de tentativas;
- limite de reenvio;
- rate limit por IP/e-mail;
- código armazenado em hash durante o período pendente.

### Biometria
Fluxo recomendado:
`Browser -> Node -> Python -> Node`.

O browser envia imagens, e não embeddings tratados como confiáveis.

No login:
1. usuário olha para a câmera;
2. move a cabeça;
3. retorna à posição frontal;
4. o backend recebe imagem de prova de vida + imagem frontal;
5. o backend valida o movimento usando a Face API;
6. o backend gera o embedding final;
7. a comparação acontece no Node.

Os templates são armazenados em envelope AES-256-GCM. Produção exige uma `SENSITIVE_DATA_KEY` independente; registros legados podem ser migrados com `npm run face:encrypt`.

### Limitações
A prova de vida por movimento é uma proteção de demonstração e não equivale a detecção anti-spoofing certificada.

### LGPD
Embeddings faciais são dados biométricos sensíveis. Para produção:
- consentimento explícito;
- política de finalidade;
- retenção mínima;
- exclusão/revogação;
- criptografia em repouso;
- controle de acesso;
- trilha de auditoria;
- avaliação jurídica/LGPD.

## Hardening da cadeia de entrega

A release possui controles adicionais fora da lógica da aplicação:

- scanner de segredos: `npm run check:secrets`;
- manifesto de integridade do código funcional: `npm run check:freeze`;
- validação de containers non-root/healthcheck: `npm run check:docker`;
- CI com `permissions: contents: read`;
- E2E com PostgreSQL efêmero em ambiente isolado;
- Dependabot para npm, pip e GitHub Actions.
- varredura semanal de dependências e execução manual autorizada do OWASP ZAP;
- Redis para rate limit distribuído quando `REDIS_URL` está configurada;
- endpoint Prometheus protegido por `MONITORING_TOKEN`.

## Containers

Os containers de produção não devem executar como root.

- backend: usuário `node`;
- Face API: usuário dedicado `steelcontrol`.

Os dois serviços possuem `HEALTHCHECK`.

## Política de segredos

Nunca versionar:

- `.env`;
- senha de app do Gmail;
- JWT secret;
- Face API key;
- URL de banco contendo credencial real;
- chaves privadas.

Os arquivos `.env.example` e `.env.production.example` devem conter somente placeholders.

## Processo de release

Antes de publicar uma versão:

1. executar `npm run quality`;
2. confirmar GitHub Actions verde;
3. executar o E2E;
4. validar backup/migrations do PostgreSQL;
5. criar tag Git imutável para a versão apresentada.


## Biometria facial — múltiplos templates e ambiguidade (V13)

- Um perfil mantém um único registro biométrico, que pode conter até três templates internos (frontal inicial, movimento/liveness e frontal final).
- Registros legados de um único vetor permanecem compatíveis.
- O reconhecimento agrupa templates por usuário e usa consenso entre evidências.
- A anti-duplicidade compara todas as capturas de enrollment contra todos os templates existentes sob lock transacional/advisory lock.
- Identidades com margem insuficiente não são escolhidas automaticamente: o backend retorna um challenge opaco de segundo fator.
- O segundo fator por e-mail usa código de 6 dígitos, hash bcrypt, TTL de 5 minutos e limites de tentativas/envios.
- O challenge não expõe ao cliente os candidatos biométricos detectados.
- No perfil `level9`, rate limits, MFA administrativo e challenges faciais usam Redis e falham de forma segura quando o armazenamento compartilhado está indisponível.

## Perfil de produção nível 9

- `SECURITY_PROFILE=level9` exige produção, HTTPS, MFA administrativo, Redis, sessão de até 30 minutos, token de monitoramento e CORS somente HTTPS.
- O backend não inicia se PostgreSQL ou Redis não responderem.
- O rate limit não regride para memória local quando Redis falha.
- Use `CONFIGURAR_PRODUCAO_NIVEL9.ps1` para gerar arquivos locais e `VALIDAR_NIVEL9.ps1` para o aceite técnico.

## Controle físico do Dobot

- Movimentos exigem `remoteControlEnabled=true` no cadastro e liberação local no Edge.
- O Edge nunca habilita movimento automaticamente durante o provisionamento.
- O backend e o Edge validam o mesmo envelope PTP e velocidade máxima de 60%.
- Comandos possuem TTL; PTP novo cancela PTP pendente e STOP cancela comandos operacionais na fila.
- STOP permanece disponível como comando de segurança mesmo com controle remoto desabilitado.
