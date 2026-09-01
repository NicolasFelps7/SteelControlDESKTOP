# Evidência de validação — 01/09/2026

Validação executada sobre o pacote recebido antes da geração da versão hardened.

## Resultado executado neste ambiente

| Gate | Resultado |
|---|---|
| Testes Node.js | **39/39 PASS** |
| Testes unitários Face API | **13/13 PASS** |
| Sintaxe Python dos módulos principais | **PASS** |
| `check-production` | **PASS** |
| Validação estática | **PASS** |
| Painéis/controladores | **PASS** |
| Dobot professional check | **PASS** |
| Varredura de segredos | **PASS** |
| Docker hardening contract | **PASS** |
| Freeze SHA-256 | **113/113 arquivos íntegros** |

Saída consolidada disponível pelo comando:

```bash
npm run quality
```

## Observação sobre E2E e Prisma

Este ambiente de análise não possui PostgreSQL nem Docker disponíveis para subir a infraestrutura do E2E. Por isso, a prova live não foi executada aqui.

Para não transformar essa limitação do ambiente em uma limitação do projeto, o pipeline GitHub Actions incluído sobe **PostgreSQL 16 efêmero**, aplica migrations/seed e executa `backend/test/e2e-live.js` automaticamente.

O mesmo pipeline executa `npx prisma validate` depois de `npm ci`.

Assim, após o primeiro push, o repositório passa a ter evidência pública e reproduzível do gate completo.

## Integridade funcional

O hardening não alterou os arquivos funcionais congelados. O manifesto `CODE_FREEZE.sha256` valida **113 arquivos** de aplicação, testes e integração industrial.
