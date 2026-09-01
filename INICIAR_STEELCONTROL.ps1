$ErrorActionPreference = "Stop"

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)] [string] $File,
    [Parameter(ValueFromRemainingArguments = $true)] [string[]] $NativeArgs
  )

  # $Args e uma variavel automatica do PowerShell. Usa-la como parametro fazia
  # comandos como `npx prisma generate` virarem apenas `npx` no Windows.
  & $File @NativeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar: $File $($NativeArgs -join ' ')"
  }
}

function Get-Python311 {
  $Launcher = Get-Command py -ErrorAction SilentlyContinue
  if (-not $Launcher) {
    throw @"
Python Launcher nao encontrado.
Instale o Python 3.11 (64 bits) e marque a opcao "py launcher" durante a instalacao.
Download oficial: https://www.python.org/downloads/release/python-3119/
"@
  }

  & py -3.11 -c "import sys; assert sys.maxsize > 2**32; print(sys.executable)" *> $null
  if ($LASTEXITCODE -ne 0) {
    throw @"
Python 3.11 de 64 bits nao foi encontrado.
Este projeto usa Python 3.11 para evitar incompatibilidades do InsightFace no Windows.
Instale-o e execute este arquivo novamente:
https://www.python.org/downloads/release/python-3119/
"@
  }

  return "py"
}

function Test-MsvcBuildTools {
  $VsWhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
  if (-not (Test-Path $VsWhere)) { return $false }

  $Installation = & $VsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
  return -not [string]::IsNullOrWhiteSpace(($Installation | Select-Object -First 1))
}


$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$FaceApi = Join-Path $Root "face-api"

Write-Host "" 
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "     STEELCONTROL - INICIALIZACAO" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$EnvFile = Join-Path $Backend ".env"
if (-not (Test-Path $EnvFile)) {
  Write-Host "ERRO: backend/.env nao existe." -ForegroundColor Red
  Write-Host "Copie seu .env da versao anterior ou use backend/.env.example." -ForegroundColor Yellow
  Read-Host "Pressione ENTER para sair"
  exit 1
}

# PostgreSQL do ambiente utilizado durante o desenvolvimento do TCC.
try {
  $Pg = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
  if ($Pg -and $Pg.Status -ne "Running") {
    Write-Host "Tentando iniciar PostgreSQL..." -ForegroundColor Yellow
    Start-Service "postgresql-x64-18"
  }
  if ($Pg) {
    Write-Host "PostgreSQL: OK" -ForegroundColor Green
  }
} catch {
  Write-Host "Nao foi possivel iniciar o PostgreSQL automaticamente. Se necessario, abra o PowerShell como administrador." -ForegroundColor Yellow
}

Push-Location $Backend
try {
  if (-not (Test-Path (Join-Path $Backend "node_modules"))) {
    Write-Host "Instalando dependencias do backend..." -ForegroundColor Yellow
    Invoke-Native npm ci
  }

  Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
  Invoke-Native npx prisma generate

  Write-Host "Aplicando migrations..." -ForegroundColor Yellow
  Invoke-Native npx prisma migrate deploy

  Write-Host "Garantindo usuario administrador seed..." -ForegroundColor Yellow
  Invoke-Native npm run seed
} finally {
  Pop-Location
}

$VenvPython = Join-Path $FaceApi "venv\Scripts\python.exe"
$Requirements = Join-Path $FaceApi "requirements.txt"
$InstallMarker = Join-Path $FaceApi "venv\.steelcontrol-requirements.sha256"
$null = Get-Python311

# Um venv pode existir mesmo depois de uma instalacao interrompida. Tambem recriamos
# ambientes feitos com outra versao do Python, pois isso causava o erro stringzilla.
if (Test-Path $VenvPython) {
  $VenvVersion = & $VenvPython -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
  if (($LASTEXITCODE -ne 0) -or ($VenvVersion -ne "3.11")) {
    Write-Host "Recriando ambiente Python incompatível/incompleto..." -ForegroundColor Yellow
    Remove-Item (Join-Path $FaceApi "venv") -Recurse -Force
  }
}

if (-not (Test-Path $VenvPython)) {
  Write-Host "Criando ambiente Python da Face API..." -ForegroundColor Yellow
  Push-Location $FaceApi
  try {
    Invoke-Native py -3.11 -m venv venv
  } finally {
    Pop-Location
  }
}

$RequirementsHash = (Get-FileHash $Requirements -Algorithm SHA256).Hash
$InstalledHash = if (Test-Path $InstallMarker) { (Get-Content $InstallMarker -Raw).Trim() } else { "" }
if ($InstalledHash -ne $RequirementsHash) {
  if (-not (Test-MsvcBuildTools)) {
    throw @"
O Microsoft C++ Build Tools nao esta instalado.
Ele e obrigatorio porque o InsightFace 0.7.3 e distribuido como codigo-fonte e precisa ser compilado.

1. Abra: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Instale "Desenvolvimento para desktop com C++".
3. Mantenha marcados MSVC x64/x86 e Windows SDK.
4. Reinicie o Windows e rode INICIAR_STEELCONTROL.ps1 novamente.
"@
  }

  Write-Host "Instalando dependencias da Face API (a primeira vez pode demorar)..." -ForegroundColor Yellow
  try {
    Invoke-Native $VenvPython -m pip install --upgrade pip setuptools wheel
    Invoke-Native $VenvPython -m pip install --prefer-binary -r $Requirements
    Set-Content -Path $InstallMarker -Value $RequirementsHash -Encoding ASCII
  } catch {
    Remove-Item $InstallMarker -Force -ErrorAction SilentlyContinue
    throw
  }
}

Write-Host "Verificando ambiente da Face API..." -ForegroundColor Yellow
& $VenvPython (Join-Path $FaceApi "verificar_ambiente.py")
if ($LASTEXITCODE -ne 0) { throw "Ambiente Python incompatível com requirements.txt." }

# Os processos so sao abertos depois que todas as preparacoes terminam. Assim uma
# falha na Face API nao deixa o backend executando sozinho em outra janela.
Write-Host "Abrindo backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$Backend'; npm run dev"
)

Write-Host "Abrindo Face API..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$FaceApi'; & '.\venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
)

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/app/login"

Write-Host ""
Write-Host "SteelControl iniciado." -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "Face API: http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "Sistema:  http://localhost:3000/app/login" -ForegroundColor Green
Write-Host ""
