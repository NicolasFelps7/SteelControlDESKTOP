# Changelog

## 2026-09-03 — Confirmação profissional de manutenção

- removido o alerta nativo do navegador ao excluir uma manutenção;
- novo modal SteelControl com contexto da máquina e do registro;
- botão de exclusão mais claro, responsivo e acessível;
- feedback de sucesso por notificação visual;
- suporte completo aos seis idiomas e aos temas claro/escuro;
- cache atualizado para carregar imediatamente o novo visual.

## 2026-09-01 — Engineering hardening

Mudanças somente na camada de engenharia/entrega:

- quality gate consolidado;
- correção dos validadores para as rotas `/app/*`;
- validação dos painéis adaptativos atualizada para as rotas profissionais;
- scanner de segredos;
- manifesto SHA-256 do código congelado;
- Docker non-root + healthchecks;
- GitHub Actions com PostgreSQL E2E;
- Dependabot;
- documentação de release, segurança e evidência de testes.

**Nenhum arquivo funcional congelado foi alterado.**
