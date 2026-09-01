# Escopo exato das alterações

Comparação feita contra o ZIP original recebido em 01/09/2026.

## Arquivos existentes ajustados

Somente arquivos de infraestrutura, validação, documentação e entrega:

- `.dockerignore`
- `.gitignore`
- `Dockerfile`
- `README.md`
- `SECURITY.md`
- `VALIDAR_PROJETO.ps1`
- `face-api/Dockerfile`
- `package.json`
- `tools/check-controller-panels.mjs`
- `tools/validar-estatico.mjs`

## Arquivos adicionados

- `.gitattributes`
- `.github/dependabot.yml`
- `.github/pull_request_template.md`
- `.github/workflows/quality-gate.yml`
- `CHANGELOG.md`
- `CODE_FREEZE.sha256`
- `HOSPEDAGEM_PRONTA.md`
- `INTEGRACAO_DOBOT_MAGICIAN.md`
- `INTEGRACAO_MAQUINA_REAL.md`
- `PAINEIS_ADAPTATIVOS_CONTROLADORES.md`
- `VALIDAR_RELEASE.ps1`
- `VERSAO_CONGELADA_TCC.md`
- `docs/CHECKLIST_SEGURANCA_RELEASE.md`
- `docs/HARDENING_ENGENHARIA.md`
- `docs/PROCESSO_DE_RELEASE.md`
- `docs/VALIDACAO_2026-09-01.md`
- `face-api/.dockerignore`
- `tools/check-code-freeze.mjs`
- `tools/check-docker-hardening.mjs`
- `tools/check-secrets.mjs`

## Arquivos funcionais

**0 arquivos funcionais foram alterados.**

O conteúdo de 113 arquivos sob backend funcional, frontend, Face API, Dobot, dispositivos, testes e schema/migrations foi preservado. O `CODE_FREEZE.sha256` permite verificar isso em qualquer checkout Windows/Linux.
