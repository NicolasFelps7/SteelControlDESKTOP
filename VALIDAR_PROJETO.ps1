$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "=== SteelControl - validação da versão congelada ===" -ForegroundColor Cyan

Write-Host "[1/6] Sintaxe JavaScript..."
$JsFiles = Get-ChildItem -Path $Root -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch "node_modules" }
foreach ($file in $JsFiles) {
  node --check $file.FullName | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Erro de sintaxe JavaScript em $($file.FullName)." }
}
Write-Host "OK: $($JsFiles.Count) arquivos JavaScript" -ForegroundColor Green

Write-Host "[2/6] Prisma schema..."
Push-Location "$Root\backend"
try {
  if (-not (Test-Path ".env")) {
    Write-Host "Aviso: backend\.env não existe. Prisma validate usará uma URL temporária somente para validar o schema." -ForegroundColor Yellow
    $env:DATABASE_URL = "postgresql://postgres:placeholder@localhost:5432/steelcontrol_enterprise?schema=public"
  }
  npx prisma validate
  if ($LASTEXITCODE -ne 0) { throw "Prisma schema inválido." }
  Write-Host "[3/6] Testes automatizados..."
  npm test
  if ($LASTEXITCODE -ne 0) { throw "Testes automatizados falharam." }
} finally { Pop-Location }

Write-Host "[4/6] Python / Face API..."
$FacePython = Join-Path $Root "face-api\venv\Scripts\python.exe"
if (Test-Path $FacePython) {
  & $FacePython -m py_compile "$Root\face-api\app\main.py" "$Root\face-api\verificar_ambiente.py"
  if ($LASTEXITCODE -ne 0) { throw "Sintaxe Python inválida." }
  & $FacePython "$Root\face-api\verificar_ambiente.py" --strict
  if ($LASTEXITCODE -ne 0) { throw "Ambiente/modelo da Face API não está pronto para uso offline." }
} else {
  py -m py_compile "$Root\face-api\app\main.py" "$Root\face-api\verificar_ambiente.py"
  if ($LASTEXITCODE -ne 0) { throw "Sintaxe Python inválida." }
  throw "face-api\venv ainda não existe. Execute INICIAR_STEELCONTROL.ps1 uma vez antes da validação final."
}
Write-Host "OK: Face API congelada e modelo disponível offline." -ForegroundColor Green

Write-Host "[5/6] Estrutura estática / frontend offline..."
node "$Root\tools\validar-estatico.mjs"
if ($LASTEXITCODE -ne 0) { throw "Validação estática falhou." }
Write-Host "OK: frontend offline e referências locais válidas." -ForegroundColor Green

Write-Host "[6/6] E2E live (quando backend estiver ativo)..."

$BackendAtivo = $false
try {
  $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2
  $BackendAtivo = ($health.status -eq "ok")
} catch {
  $BackendAtivo = $false
}

if ($BackendAtivo) {
  Write-Host "Backend ativo. Executando E2E completo..." -ForegroundColor Cyan
  Push-Location "$Root\backend"
  try {
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) { throw "Teste E2E falhou." }
  } finally { Pop-Location }
} else {
  Write-Host "Backend não está ativo; E2E live não foi executado. Ligue npm run dev e rode novamente este script." -ForegroundColor Yellow
}

Write-Host "=== Validação concluída ===" -ForegroundColor Green
