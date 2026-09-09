# Correção Desktop ↔ Mobile — 2026-09-07

- Adicionada rota autenticada `GET /api/maquinas/sync` (montada pelo prefixo atual de máquinas) antes das rotas dinâmicas `/:id`.
- A resposta inclui `empresaId`, `usuarioId`, `total` e `maquinas`.
- Corrigida colisão em que `/maquinas/sync` era interpretado como `/:id` e `sync` virava `NaN`, causando erro Prisma 500.
- `buscar()` agora rejeita IDs inválidos com HTTP 400 antes de consultar o Prisma.
- Nenhuma regra de segurança, telemetria, IHM ou multiempresa foi removida.
