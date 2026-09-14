# Backup e restauração do SteelControl

## Objetivo

O SteelControl possui rotinas locais para criar um backup validado do PostgreSQL e das configurações essenciais. Os backups ficam em `backups/` e **não devem ser enviados ao Git**.

## Criar backup

Feche alterações administrativas importantes e execute na raiz do projeto:

```powershell
.\BACKUP_STEELCONTROL.ps1
```

O script:

- lê a conexão PostgreSQL de `backend/.env`;
- localiza `pg_dump`;
- cria `database.dump` em formato custom do PostgreSQL;
- salva cópias das configurações não secretas;
- protege `backend/.env` com Windows DPAPI (CurrentUser);
- inclui `edge-profiles.json` quando existir (as Device Keys continuam protegidas por DPAPI);
- gera `manifest.json` com SHA-256 e valida todos os arquivos.

## Restaurar

1. Feche o backend/SteelControl.
2. Escolha a pasta do backup.
3. Execute:

```powershell
.\RESTAURAR_STEELCONTROL.ps1 -Backup ".\backups\SteelControl_YYYYMMDD_HHMMSS_manual"
```

Antes de restaurar, o script cria automaticamente um **backup de segurança do estado atual** e exige a confirmação digitando `RESTAURAR`.

Para também restaurar o `.env` protegido e os perfis locais do Edge (somente no mesmo usuário Windows/máquina compatível):

```powershell
.\RESTAURAR_STEELCONTROL.ps1 -Backup ".\backups\..." -RestaurarConfiguracaoLocal -RestaurarEdge
```

## Regras de segurança

- O restore recusa executar se detectar o backend ouvindo na porta 3000.
- A senha do PostgreSQL não aparece no `manifest.json`.
- `backend/.env` nunca é copiado em texto puro para o backup.
- Backups são ignorados pelo Git.
- Não use `-SemBackupDeSeguranca` em produção; ele existe apenas para recuperação controlada.
