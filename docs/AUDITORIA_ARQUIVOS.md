# Auditoria e limpeza de arquivos

Esta revisão organiza o SteelControl Desktop sem alterar regras de negócio, rotas, banco, Face API, telemetria, IHM ou segurança operacional.

## Removido por ser resíduo de outro projeto

Os arquivos Flutter abaixo estavam na raiz do Desktop, mas não existiam `lib/`, `android/`, `ios/` ou a estrutura de aplicativo correspondente. Eles pertenciam ao projeto Mobile e foram removidos do Desktop:

- `.metadata`
- `analysis_options.yaml`
- `pubspec.yaml`
- `pubspec.lock`
- `PREPARAR_APP.ps1`
- `INICIAR_TABLET.ps1`
- `.github/workflows/flutter-quality.yml` — workflow de CI do projeto Mobile que fazia o GitHub tentar executar Flutter dentro do repositório Desktop.

## Removido por estar obsoleto ou sem referência

- notas antigas `LEIA-ME*.txt` usadas apenas durante aplicação de patches;
- changelogs fragmentados da raiz, mantendo `CHANGELOG.md` como histórico principal;
- changelogs temporários/datatados em `docs/`;
- `frontend/assets/css/industrial-sidebar-v4.css`, substituído pela sidebar atual e não carregado por nenhuma página;
- `frontend/assets/img/logo.png` e `frontend/assets/img/nicolas.png`, idênticos entre si e sem referência no código;
- `frontend/assets/img/steel-icon-light.svg`, sem referência no frontend/backend.

## Arquivos renomeados

### CSS

- `desktop-finish-v7.css` → `desktop-layout.css`
- `industrial-command-center-v2.css` → `brand-contrast.css`
- `industrial-command-center-v3.css` → `industrial-theme.css`
- `industrial-sidebar-v5.css` → `sidebar.css`

### Imagens

- `dash.png` → `steelcontrol-wordmark.png`
- `industrial-home.jpg` → `home-industrial.jpg`
- `industrial-login.jpg` → `login-industrial.jpg`
- `login-brand.png` → `steelcontrol-login-brand.png`

### Documentação

- `HOSPEDAGEM_PRONTA.md` → `docs/DEPLOY.md`
- `INTEGRACAO_DOBOT_MAGICIAN.md` → `docs/integracoes/DOBOT.md`
- `INTEGRACAO_MAQUINA_REAL.md` → `docs/integracoes/MAQUINA_REAL.md`
- `PAINEIS_ADAPTATIVOS_CONTROLADORES.md` → `docs/CONTROLADORES.md`
- `VERSAO_CONGELADA_TCC.md` → `docs/RELEASE_TCC.md`
- `docs/AUTO_DISCOVERY.md` → `docs/DESCOBERTA_AUTOMATICA.md`
- `docs/PLATAFORMA_TOP.md` → `docs/VISAO_PLATAFORMA.md`
- `docs/VALIDACAO_2026-09-01.md` → `docs/VALIDACAO.md`

## Estrutura principal esperada

- `backend/` — API Node/Express, Prisma e testes
- `frontend/` — páginas, estilos, scripts e imagens do Desktop
- `face-api/` — serviço Python de reconhecimento facial
- `dobot-gateway/` — integração do Dobot
- `device-examples/` — exemplos de integração de dispositivos
- `tools/` — validações e release
- `docs/` — documentação técnica organizada

`README.md`, `SECURITY.md`, `CHANGELOG.md`, `package.json` e os scripts principais permanecem na raiz.
