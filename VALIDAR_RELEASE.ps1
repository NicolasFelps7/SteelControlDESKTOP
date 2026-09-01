$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "SteelControl - gate estrito de release" -ForegroundColor Cyan
Write-Host "Pré-requisitos: PostgreSQL + backend ativos e Face API preparada localmente." -ForegroundColor Yellow

& (Join-Path $Root "VALIDAR_PROJETO.ps1") -RequireE2E -StrictFaceRuntime

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "RELEASE GATE: APROVADO PARA ENTREGA" -ForegroundColor Green
