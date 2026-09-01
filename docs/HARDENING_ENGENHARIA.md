# Hardening e acabamento de engenharia — SteelControl

Data do pacote: **01/09/2026**.

## Escopo

Este hardening foi feito **sem alterar a lógica funcional do sistema**. Permaneceram byte a byte iguais os arquivos congelados de:

- backend de aplicação (`backend/src`);
- schema/migrations e testes do backend;
- frontend;
- Face API (`face-api/app` e testes);
- gateway Dobot;
- exemplos de dispositivos;
- dependências bloqueadas do backend e Face API.

A integridade é comprovada por `CODE_FREEZE.sha256` e validada por:

```bash
npm run check:freeze
```

## O que foi melhorado

### Quality gate

O projeto agora possui um gate único:

```bash
npm run quality
```

Ele executa:

1. testes automatizados Node.js;
2. check de produção;
3. validação estática do frontend;
4. validação dos painéis/controladores;
5. check profissional do Dobot;
6. varredura de segredos;
7. contrato de hardening dos Dockerfiles;
8. verificação do freeze do código funcional.

No Windows:

```powershell
.\VALIDAR_PROJETO.ps1
```

Para o congelamento estrito da release:

```powershell
.\VALIDAR_RELEASE.ps1
```

O gate estrito exige backend/PostgreSQL ativos para executar o E2E e ambiente local da Face API preparado.

### CI/CD

Foi criado `.github/workflows/quality-gate.yml`.

Em `push`/`pull_request`, o GitHub executa automaticamente:

- instalação reproduzível com `npm ci`;
- Prisma validate;
- 39 testes Node;
- checks estáticos e de segurança;
- testes unitários da Face API;
- E2E real com PostgreSQL 16 efêmero;
- upload do log do backend usado no E2E.

### Segurança de entrega

Foi adicionado `tools/check-secrets.mjs`, que bloqueia:

- `.env` real;
- chaves privadas;
- padrões comuns de tokens;
- ausência das proteções principais no `.gitignore`.

O `.gitignore` e `.dockerignore` também foram reforçados.

### Containers

Os Dockerfiles agora possuem:

- usuário não-root;
- `HEALTHCHECK`;
- imagens base versionadas, sem `latest`;
- contexto de build protegido contra segredos e arquivos locais;
- cache do modelo facial criado pelo mesmo usuário que executa a Face API.

### Freeze verificável

`CODE_FREEZE.sha256` contém SHA-256 dos arquivos funcionais congelados.

Isso permite demonstrar para a banca que o hardening foi aplicado na camada de engenharia/entrega, sem alterar o comportamento da aplicação.

## O que não foi feito de propósito

Para reduzir risco antes da banca, este pacote **não**:

- refatora controllers grandes;
- troca autenticação;
- adiciona Redis;
- altera regras de máquina;
- altera reconhecimento facial;
- altera telas/estilos;
- altera banco/schema/migrations;
- altera protocolo ESP32/Dobot.

Esses itens podem ser roadmap pós-TCC.
