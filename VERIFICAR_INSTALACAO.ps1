[CmdletBinding()]
param([switch]$Quiet)
$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$problems = New-Object System.Collections.Generic.List[string]
function Check([bool]$Ok,[string]$Label) {
  if ($Ok) { if (-not $Quiet) { Write-Host "[OK] $Label" -ForegroundColor Green } }
  else { $problems.Add($Label); if (-not $Quiet) { Write-Host "[ERRO] $Label" -ForegroundColor Red } }
}

if (-not $Quiet) { Write-Host 'SteelControl - Verificacao de instalacao' -ForegroundColor Cyan }
$node = Get-Command node -ErrorAction SilentlyContinue
Check ($null -ne $node) 'Node.js disponivel'
$pyOk = $false
if (Get-Command py -ErrorAction SilentlyContinue) { & py -3.11 -c "import sys; assert sys.maxsize > 2**32" *> $null; $pyOk = ($LASTEXITCODE -eq 0) }
Check $pyOk 'Python 3.11 x64 disponivel'
$pg = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^postgresql' } | Select-Object -First 1
Check ($null -ne $pg) 'Servico PostgreSQL instalado'
Check (Test-Path (Join-Path $Root 'backend\.env')) 'backend/.env configurado'
Check (Test-Path (Join-Path $Root 'backend\node_modules\@prisma\client')) 'Dependencias do backend instaladas'
Check (Test-Path (Join-Path $Root 'face-api\venv\Scripts\python.exe')) 'Face API instalada'
Check (Test-Path (Join-Path $Root '.venv-edge\Scripts\python.exe')) 'SteelControl Edge instalado'
Check (Test-Path (Join-Path $Root 'BACKUP_STEELCONTROL.ps1')) 'Backup disponivel'
Check (Test-Path (Join-Path $Root 'RESTAURAR_STEELCONTROL.ps1')) 'Restore disponivel'

if ($problems.Count -gt 0) {
  if (-not $Quiet) {
    Write-Host "`nProblemas encontrados:" -ForegroundColor Red
    $problems | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  }
  exit 1
}
if (-not $Quiet) { Write-Host "`nINSTALACAO VALIDADA COM SUCESSO" -ForegroundColor Green }
exit 0
