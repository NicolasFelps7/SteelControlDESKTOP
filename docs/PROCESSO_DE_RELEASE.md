# Processo profissional de release

## 1. Desenvolvimento

Antes de enviar mudanças:

```bash
npm run quality
```

No Windows, também é recomendado:

```powershell
.\VALIDAR_PROJETO.ps1
```

## 2. Pull request

O template de PR exige confirmação de:

- ausência de segredos;
- execução dos checks;
- E2E quando houver mudança de comportamento industrial;
- respeito ao freeze.

## 3. CI

O GitHub Actions roda dois gates independentes:

### Static + Unit + Security

- Prisma validate;
- testes Node;
- validação estática;
- controladores;
- Dobot;
- secrets;
- Docker hardening;
- freeze;
- sintaxe Python;
- testes da Face API.

### PostgreSQL E2E

Sobe um PostgreSQL 16 limpo, aplica migrations, executa seed, inicia o backend e prova:

```text
login
→ cadastro da máquina
→ Device Key
→ telemetria normal
→ condição crítica
→ PARAR_SEGURANCA
→ perda simulada de ACK
→ reentrega do mesmo comando
→ ACK idempotente
→ normalização
→ liberação
→ manutenção
→ diagnóstico
→ auditoria
```

## 4. Gate de release local

Com PostgreSQL/backend e Face API preparados:

```powershell
.\VALIDAR_RELEASE.ps1
```

A release só deve ser marcada quando:

- CI verde;
- E2E verde;
- `.env` fora do Git;
- migrations revisadas;
- backup do banco definido;
- variáveis de produção configuradas no provedor;
- healthchecks respondendo.

## 5. Publicação

Sugestão:

1. criar commit final;
2. aguardar o GitHub Actions ficar verde;
3. criar tag, por exemplo `tcc-final`;
4. preservar o commit/tag apresentado à banca;
5. não alterar a tag depois da apresentação.
