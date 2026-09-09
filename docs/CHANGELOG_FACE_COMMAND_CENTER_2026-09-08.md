# Facial Command Center — 2026-09-08

## Objetivo
Alinhar a experiência de reconhecimento facial do Desktop ao visual profissional já utilizado no SteelControl Mobile, sem alterar a arquitetura, as regras biométricas, o backend ou a Face API.

## Alterações
- Login facial redesenhado como console biométrico industrial.
- Câmera em destaque com scan visual, badges CAM 01 / VERIFY e guia técnico.
- Etapas visuais: posição inicial, prova de vida, retorno ao centro e validação de identidade.
- Progresso visual sincronizado ao estado do fluxo existente no JavaScript.
- Cadastro facial de funcionários em Minha Empresa redesenhado no mesmo padrão.
- Campos de nome da biometria, consentimento, qualidade e status preservados.
- Novo CSS isolado `facial-command-center.css`, carregado por último para evitar regressões funcionais.
- Traduções das novas etapas do login adicionadas em pt/en/es/fr/de/it.

## Não alterado
- InsightFace / Face API Python.
- Thresholds biométricos.
- Prova de vida existente.
- Regras de face única por perfil e rosto duplicado.
- Endpoints Node/Express.
- PostgreSQL/Prisma.
