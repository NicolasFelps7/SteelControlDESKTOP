# Changelog

## 2026-09-03 — IHM industrial supervisionada

- nova IHM visual para controladores genéricos, com processo, sensores, intertravamentos, métricas e alarmes;
- comandos START, STOP operacional, RESET, ACK e seleção AUTO/MANUAL;
- modo simulação funcional sem hardware e integração real pela fila autenticada de comandos;
- controle remoto real desativado por padrão e START condicionado a telemetria recente e intertravamentos positivos;
- TTL para comandos críticos, cancelamento de comandos conflitantes e preservação do ACK/idempotência existentes;
- exemplo ESP32 atualizado com telemetria da IHM e bloqueio seguro de partida remota por padrão;
- traduções e tema claro/escuro;
- testes e validadores ampliados para a IHM.


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

## 2026-09-03 — Descoberta automática de equipamentos

- Descoberta LAN via UDP/4210 com registro efêmero no backend.
- Aprovação exclusiva de administrador antes do cadastro.
- Provisionamento automático de Machine ID + Device Key para dispositivos compatíveis.
- `discoveryId` único no PostgreSQL para impedir dupla reivindicação.
- Desktop e Mobile com área “Descoberta automática”.
- Exemplo ESP32 atualizado com anúncio UDP, nonce de pareamento, endpoint de provisionamento e persistência NVS.
- Controle remoto permanece desativado por padrão; segurança física não é substituída.

## 2026-09-03 — descoberta resiliente

- adicionado botão **Procurar novamente** com broadcast por todas as interfaces IPv4 privadas detectadas;
- adicionado fallback seguro por IPv4 em `POST /descoberta/por-ip`;
- adicionado diagnóstico em `GET /descoberta/diagnostico`;
- Desktop mostra possíveis causas de falha, interfaces, UDP e última resposta válida;
- firmware ESP32 2.1 expõe `GET /steelcontrol/discovery` sem revelar Device Key;
- controle remoto continua desativado após descoberta/provisionamento.
