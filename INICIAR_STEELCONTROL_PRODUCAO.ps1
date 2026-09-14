$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$FaceApi = Join-Path $Root 'face-api'
$Runtime = Join-Path $Root '.steelcontrol-runtime.json'

function Invoke-Native {
  param([Parameter(Mandatory=$true)][string]$File,[Parameter(ValueFromRemainingArguments=$true)][string[]]$NativeArgs)
  & $File @NativeArgs
  if ($LASTEXITCODE -ne 0) { throw "Falha: $File $($NativeArgs -join ' ')" }
}
function Test-Port([int]$Port) {
  try { return (Test-NetConnection 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue) } catch { return $false }
}

Write-Host ''
Write-Host '=============================================' -ForegroundColor DarkGray
Write-Host ' SteelControl - Inicializacao de Producao' -ForegroundColor Cyan
Write-Host '=============================================' -ForegroundColor DarkGray

if (-not (Test-Path (Join-Path $Backend '.env'))) { throw 'backend/.env nao encontrado. Execute INSTALAR_STEELCONTROL.bat primeiro.' }
$facePy = Join-Path $FaceApi 'venv\Scripts\python.exe'
if (-not (Test-Path $facePy)) { throw 'Face API nao instalada. Execute INSTALAR_STEELCONTROL.bat primeiro.' }

$pg = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^postgresql' } | Sort-Object Name -Descending | Select-Object -First 1
if ($pg -and $pg.Status -ne 'Running') {
  try { Start-Service $pg.Name; $pg.WaitForStatus('Running',[TimeSpan]::FromSeconds(30)) } catch { Write-Host 'Nao foi possivel iniciar PostgreSQL automaticamente.' -ForegroundColor Yellow }
}

Push-Location $Backend
try {
  Invoke-Native npx prisma migrate deploy
} finally { Pop-Location }

$state = [ordered]@{}
if (Test-Port 3000) {
  Write-Host 'Backend ja esta ativo na porta 3000.' -ForegroundColor Yellow
} else {
  $node = Start-Process -FilePath 'node.exe' -ArgumentList @('src/server.js') -WorkingDirectory $Backend -PassThru -WindowStyle Minimized
  $state.backendPid = $node.Id
  Write-Host "Backend iniciado (PID $($node.Id))." -ForegroundColor Green
}
if (Test-Port 8000) {
  Write-Host 'Face API ja esta ativa na porta 8000.' -ForegroundColor Yellow
} else {
  $face = Start-Process -FilePath $facePy -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $FaceApi -PassThru -WindowStyle Minimized
  $state.facePid = $face.Id
  Write-Host "Face API iniciada (PID $($face.Id))." -ForegroundColor Green
}
$state.startedAt = (Get-Date -Format 'o')
$state | ConvertTo-Json | Set-Content -Path $Runtime -Encoding UTF8

$deadline = (Get-Date).AddSeconds(25)
do {
  Start-Sleep -Milliseconds 700
  $apiOk = Test-Port 3000
  $faceOk = Test-Port 8000
} while ((-not ($apiOk -and $faceOk)) -and (Get-Date) -lt $deadline)

if (-not $apiOk) { throw 'Backend nao respondeu na porta 3000.' }
if (-not $faceOk) { throw 'Face API nao respondeu na porta 8000.' }

Write-Host 'SteelControl ONLINE.' -ForegroundColor Green
Start-Process 'http://localhost:3000/app/login'
