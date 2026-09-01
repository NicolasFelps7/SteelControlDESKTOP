param(
  [switch]$RequireE2E,
  [switch]$StrictFaceRuntime
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Resultados = New-Object System.Collections.Generic.List[object]

function Add-Resultado {
  param(
    [string]$Etapa,
    [string]$Status,
    [string]$Detalhe
  )

  $Resultados.Add([PSCustomObject]@{
    Etapa = $Etapa
    Status = $Status
    Detalhe = $Detalhe
  }) | Out-Null
}

function Assert-ExitCode {
  param([string]$Mensagem)

  if ($LASTEXITCODE -ne 0) {
    throw $Mensagem
  }
}

function Invoke-Etapa {
  param(
    [string]$Nome,
    [scriptblock]$Acao
  )

  Write-Host ""
  Write-Host ">>> $Nome" -ForegroundColor Cyan

  try {
    & $Acao
    Add-Resultado -Etapa $Nome -Status "OK" -Detalhe "Concluída com sucesso."
    Write-Host "[OK] $Nome" -ForegroundColor Green
  }
  catch {
    Add-Resultado -Etapa $Nome -Status "FALHOU" -Detalhe $_.Exception.Message
    Write-Host "[FALHOU] $Nome" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    throw
  }
}

Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host " STEELCONTROL - QUALITY GATE / VALIDAÇÃO OFICIAL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host "Projeto: $Root"
Write-Host "RequireE2E: $RequireE2E | StrictFaceRuntime: $StrictFaceRuntime"

Invoke-Etapa "1. Sintaxe JavaScript" {
  $JsFiles = Get-ChildItem -Path $Root -Recurse -File |
    Where-Object {
      $_.Extension -in @(".js", ".mjs") -and
      $_.FullName -notmatch "[\\/](node_modules|\.git|venv|\.venv)[\\/]"
    }

  foreach ($file in $JsFiles) {
    node --check $file.FullName | Out-Null
    Assert-ExitCode "Erro de sintaxe JavaScript em $($file.FullName)."
  }

  Write-Host "Arquivos JavaScript verificados: $($JsFiles.Count)"
}

Invoke-Etapa "2. Prisma schema" {
  Push-Location (Join-Path $Root "backend")
  try {
    $DatabaseOriginal = $env:DATABASE_URL

    if (-not $env:DATABASE_URL) {
      $env:DATABASE_URL = "postgresql://postgres:placeholder@localhost:5432/steelcontrol_enterprise?schema=public"
    }

    $PrismaCmd = Join-Path (Get-Location) "node_modules\.bin\prisma.cmd"

    if (Test-Path $PrismaCmd) {
      & $PrismaCmd validate
    }
    else {
      npx --no-install prisma validate
    }

    Assert-ExitCode "Prisma schema inválido ou dependência Prisma não instalada. Execute npm ci em backend."

    if ($null -eq $DatabaseOriginal) {
      Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    }
    else {
      $env:DATABASE_URL = $DatabaseOriginal
    }
  }
  finally {
    Pop-Location
  }
}

Invoke-Etapa "3. Testes automatizados Node.js" {
  Push-Location $Root
  try {
    npm test
    Assert-ExitCode "Testes automatizados Node.js falharam."
  }
  finally {
    Pop-Location
  }
}

Invoke-Etapa "4. Face API - sintaxe e testes unitários" {
  $FaceDir = Join-Path $Root "face-api"
  $VenvPython = Join-Path $FaceDir "venv\Scripts\python.exe"
  $Python = $null

  if (Test-Path $VenvPython) {
    $Python = $VenvPython
  }
  elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $Python = "py"
  }
  elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $Python = "python"
  }
  elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $Python = "python3"
  }

  if (-not $Python) {
    throw "Python não encontrado. Instale Python 3.11+ ou crie face-api\venv."
  }

  & $Python -m py_compile `
    (Join-Path $FaceDir "app\main.py") `
    (Join-Path $FaceDir "app\face_rules.py") `
    (Join-Path $FaceDir "app\image_utils.py") `
    (Join-Path $FaceDir "verificar_ambiente.py")
  Assert-ExitCode "Sintaxe Python inválida."

  Push-Location $FaceDir
  try {
    $env:PYTHONPATH = "."
    & $Python -m unittest discover -s tests -p "test_*.py" -v
    Assert-ExitCode "Testes unitários da Face API falharam."
  }
  finally {
    Pop-Location
  }

  if ($StrictFaceRuntime) {
    if (-not (Test-Path $VenvPython)) {
      throw "Validação strict da Face API exige face-api\venv preparado."
    }

    & $VenvPython (Join-Path $FaceDir "verificar_ambiente.py") --strict
    Assert-ExitCode "Ambiente/modelo da Face API não está pronto para uso offline."
  }
}

Invoke-Etapa "5. Quality gates estáticos e segurança" {
  Push-Location $Root
  try {
    npm run check
    Assert-ExitCode "Check de produção falhou."

    npm run check:static
    Assert-ExitCode "Validação estática falhou."

    npm run check:controllers
    Assert-ExitCode "Validação dos controladores falhou."

    npm run check:dobot
    Assert-ExitCode "Validação profissional do Dobot falhou."

    npm run check:secrets
    Assert-ExitCode "Varredura de segredos falhou."

    npm run check:docker
    Assert-ExitCode "Hardening de Docker falhou."

    npm run check:freeze
    Assert-ExitCode "Manifesto de congelamento do código foi violado."
  }
  finally {
    Pop-Location
  }
}

Write-Host ""
Write-Host ">>> 6. E2E live" -ForegroundColor Cyan
$BackendAtivo = $false

try {
  $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2
  $BackendAtivo = ($health.status -eq "ok")
}
catch {
  $BackendAtivo = $false
}

if ($BackendAtivo) {
  try {
    Push-Location (Join-Path $Root "backend")
    npm run test:e2e
    Assert-ExitCode "Teste E2E falhou."
    Add-Resultado -Etapa "6. E2E live" -Status "OK" -Detalhe "Fluxo ponta a ponta executado."
    Write-Host "[OK] 6. E2E live" -ForegroundColor Green
  }
  finally {
    Pop-Location
  }
}
elseif ($RequireE2E) {
  Add-Resultado -Etapa "6. E2E live" -Status "FALHOU" -Detalhe "Backend não está ativo em http://localhost:3000."
  throw "E2E é obrigatório para release. Inicie backend + PostgreSQL e execute novamente."
}
else {
  Add-Resultado -Etapa "6. E2E live" -Status "N/A" -Detalhe "Backend não estava ativo; use -RequireE2E no gate de release."
  Write-Host "[N/A] Backend não ativo. E2E não foi executado neste modo." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host " RESUMO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkCyan

$Resultados | Format-Table -AutoSize

$Falhas = @($Resultados | Where-Object { $_.Status -eq "FALHOU" })

if ($Falhas.Count -gt 0) {
  Write-Host "QUALITY GATE: FALHOU" -ForegroundColor Red
  exit 1
}

Write-Host "QUALITY GATE: APROVADO" -ForegroundColor Green
if (-not $RequireE2E) {
  Write-Host "Para congelamento final de release, rode também: .\VALIDAR_RELEASE.ps1" -ForegroundColor Yellow
}
