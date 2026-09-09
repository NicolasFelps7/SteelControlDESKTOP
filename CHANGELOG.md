# 2026-09-07 — Command Center V3: cores e tipografia

- Padronização da paleta de todos os dashboards (padrão, controladores, IHM e Dobot).
- Remoção de grandes blocos bege/âmbar e gradientes inconsistentes nos painéis técnicos.
- Dobot passou a usar o mesmo hero grafite do restante do Command Center.
- Cards de coordenadas, telemetria e controladores usam superfícies neutras e âmbar apenas como acento.
- Cadastro de máquinas recebeu tipografia corporativa natural, pesos menores e menos caixa alta/letter-spacing.
- Preview “Painel que será criado” e preset de robô foram neutralizados para não parecer template gerado.
- Tema escuro recebeu as mesmas regras de superfície/contraste.
- Nenhuma rota, API, regra de segurança, telemetria, IHM ou backend foi alterado.


## 2026-09-07 — Correção de contraste da logo no tema escuro

- Corrigido o desaparecimento visual da logo preta no sidebar em tema escuro.
- A marca lateral agora preserva as cores originais sobre uma placa neutra clara.
- Removida a inversão automática aplicada à logo do sidebar; logos internas continuam com contraste automático.
- Alteração exclusivamente visual/de tema, sem mudança em APIs, IHM, telemetria ou regras de segurança.


## 2026-09-07 — Plataforma realtime + hardening operacional

- Sessões JWT agora possuem `tokenVersion` para revogação server-side.
- `/auth/session-events` conectado ao backend e logout remoto instantâneo preparado para Desktop/Mobile.
- Desativação e troca de senha revogam sessões existentes.
- ACK de equipamento rejeita status desconhecido em vez de assumir sucesso.
- Liberação de parada em equipamento real exige conexão estável e telemetria recente.
- Registro de manutenção passou a ser transacional e não mascara parada de segurança ativa.

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

## 2026-09-07 — Command Center Industrial UI

- Nova camada visual `industrial-command-center.css` carregada por último em Home, Login, Máquinas, Dashboard e Minha Empresa.
- Dashboard reorganizado visualmente como centro de operação industrial: sidebar grafite, KPIs em faixa técnica, instrumentos compactos, gráficos/painéis planos e estados semânticos.
- Redução de sombras, gradientes, arredondamentos e cores decorativas para remover aparência de template genérico.
- Âmbar reservado para ação/destaque; verde, amarelo e vermelho reservados para estados operacionais.
- Tema escuro e responsividade preservados.
- Nenhuma alteração de backend, banco, autenticação, facial, IHM, telemetria, rotas ou regras de segurança.

## 2026-09-07 — Command Center V2
- Corrigido contraste da logo no sidebar em tema claro e escuro.
- Painel de controlador refinado com linguagem visual grafite/industrial.
- Melhorada legibilidade do título e status do controlador.
- IHM supervisória recebeu superfícies mais técnicas, menos arredondamento e maior contraste.
- Tema escuro da IHM refinado sem alterar comandos, telemetria ou regras de segurança.
