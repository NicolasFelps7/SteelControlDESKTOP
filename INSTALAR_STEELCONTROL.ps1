[CmdletBinding()]
param(
  [switch]$SkipDependencyInstall,
  [switch]$NoEdge,
  [switch]$NoShortcuts
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$FaceApi = Join-Path $Root 'face-api'
$EdgeDir = Join-Path $Root 'steelcontrol-edge'
$LogsDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
$LogFile = Join-Path $LogsDir ("instalacao-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
Start-Transcript -Path $LogFile -Force | Out-Null

function Finish-TranscriptSafe { try { Stop-Transcript | Out-Null } catch {} }
function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "[OK] $Text" -ForegroundColor Green }
function Write-Warn([string]$Text) { Write-Host "[AVISO] $Text" -ForegroundColor Yellow }
function Invoke-Native {
  param([Parameter(Mandatory=$true)][string]$File,[Parameter(ValueFromRemainingArguments=$true)][string[]]$NativeArgs)
  & $File @NativeArgs
  if ($LASTEXITCODE -ne 0) { throw "Falha ao executar: $File $($NativeArgs -join ' ')" }
}
function Test-Admin {
  return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
function Ensure-Admin {
  if (Test-Admin) { return }
  Write-Host 'Solicitando permissao de Administrador...' -ForegroundColor Yellow
  $Args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"{0}"' -f $MyInvocation.MyCommand.Path))
  if ($SkipDependencyInstall) { $Args += '-SkipDependencyInstall' }
  if ($NoEdge) { $Args += '-NoEdge' }
  if ($NoShortcuts) { $Args += '-NoShortcuts' }
  Start-Process powershell.exe -Verb RunAs -ArgumentList ($Args -join ' ') -WorkingDirectory $Root
  Finish-TranscriptSafe
  exit 0
}
function Has-Command([string]$Name) { return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable('Path','Machine')
  $user = [Environment]::GetEnvironmentVariable('Path','User')
  $env:Path = "$machine;$user"
}
function Get-Winget {
  $cmd = Get-Command winget -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}
function Install-WingetPackage([string]$Id,[string]$Label,[string[]]$ExtraArgs=@()) {
  $Winget = Get-Winget
  if (-not $Winget) { throw "winget nao encontrado. Instale '$Label' manualmente e rode o instalador novamente." }
  Write-Host "Instalando $Label via winget..." -ForegroundColor Yellow
  $args = @('install','--id',$Id,'-e','--accept-package-agreements','--accept-source-agreements') + $ExtraArgs
  & $Winget @args
  if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel instalar $Label automaticamente (winget id: $Id)." }
  Refresh-Path
}
function Get-PostgresBin([string]$ExeName) {
  $cmd = Get-Command $ExeName -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $base = Join-Path $env:ProgramFiles 'PostgreSQL'
  if (Test-Path $base) {
    $candidates = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue | Sort-Object { try { [int]($_.Name -replace '[^0-9].*$','') } catch { 0 } } -Descending
    foreach ($dir in $candidates) {
      $candidate = Join-Path $dir.FullName ("bin\{0}.exe" -f $ExeName)
      if (Test-Path $candidate) { return $candidate }
    }
  }
  return $null
}
function Get-PostgresService {
  return Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^postgresql' } | Sort-Object Name -Descending | Select-Object -First 1
}
function Read-Secret([string]$Prompt) {
  $sec = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function New-RandomSecret([int]$Bytes=48) {
  $buf = New-Object byte[] $Bytes
  [Security.Cryptography.RandomNumberGenerator]::Fill($buf)
  return [Convert]::ToBase64String($buf)
}
function Escape-EnvValue([string]$Value) { return $Value.Replace('"','\"') }
function Create-Shortcut([string]$Name,[string]$Script,[string]$Description) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $wsh = New-Object -ComObject WScript.Shell
  $lnk = $wsh.CreateShortcut((Join-Path $desktop "$Name.lnk"))
  $lnk.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Script`""
  $lnk.WorkingDirectory = $Root
  $lnk.Description = $Description
  $lnk.Save()
}

try {
  Ensure-Admin
  Clear-Host
  Write-Host '=================================================' -ForegroundColor DarkGray
  Write-Host '       STEELCONTROL - INSTALADOR FINAL 1.0' -ForegroundColor Cyan
  Write-Host '=================================================' -ForegroundColor DarkGray
  Write-Host "Projeto: $Root" -ForegroundColor Gray
  Write-Host "Log:     $LogFile" -ForegroundColor Gray

  Write-Step '1/8 - Verificando pre-requisitos'
  if (-not (Has-Command 'node')) {
    if ($SkipDependencyInstall) { throw 'Node.js nao encontrado.' }
    Install-WingetPackage 'OpenJS.NodeJS.LTS' 'Node.js LTS'
  }
  $nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
  if ($nodeMajor -lt 20 -or $nodeMajor -gt 22) { throw "Node.js $nodeMajor detectado. O SteelControl requer Node.js 20, 21 ou 22." }
  Write-Ok "Node.js $(& node --version)"

  $pythonOk = $false
  if (Has-Command 'py') {
    & py -3.11 -c "import sys; assert sys.maxsize > 2**32" *> $null
    $pythonOk = ($LASTEXITCODE -eq 0)
  }
  if (-not $pythonOk) {
    if ($SkipDependencyInstall) { throw 'Python 3.11 x64 nao encontrado.' }
    Install-WingetPackage 'Python.Python.3.11' 'Python 3.11 x64'
    Refresh-Path
    if (-not (Has-Command 'py')) { throw 'Python Launcher ainda nao foi encontrado apos a instalacao.' }
    & py -3.11 -c "import sys; assert sys.maxsize > 2**32" *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.11 x64 nao ficou disponivel.' }
  }
  Write-Ok 'Python 3.11 x64'

  $psql = Get-PostgresBin 'psql'
  if (-not $psql) {
    if ($SkipDependencyInstall) { throw 'PostgreSQL nao encontrado.' }
    Write-Warn 'PostgreSQL nao encontrado. O instalador do PostgreSQL sera aberto pelo winget.'
    Write-Warn 'Durante a instalacao, defina e GUARDE a senha do usuario postgres e mantenha a porta 5432.'
    Install-WingetPackage 'PostgreSQL.PostgreSQL.18' 'PostgreSQL 18'
    Refresh-Path
    $psql = Get-PostgresBin 'psql'
    if (-not $psql) { throw 'PostgreSQL foi instalado, mas psql.exe nao foi localizado. Reinicie o Windows e rode este instalador novamente.' }
  }
  Write-Ok "PostgreSQL localizado: $psql"

  $pgService = Get-PostgresService
  if ($pgService -and $pgService.Status -ne 'Running') {
    Start-Service $pgService.Name
    $pgService.WaitForStatus('Running',[TimeSpan]::FromSeconds(30))
  }
  if ($pgService) { Write-Ok "Servico PostgreSQL: $($pgService.Name)" }

  Write-Step '2/8 - Configurando banco de dados'
  $dbHost = 'localhost'; $dbPort = '5432'; $dbUser = 'postgres'; $dbName = 'steelcontrol_enterprise'
  $dbPassword = Read-Secret 'Digite a senha do usuario postgres'
  if ([string]::IsNullOrWhiteSpace($dbPassword)) { throw 'A senha do PostgreSQL nao pode ficar vazia.' }
  $env:PGPASSWORD = $dbPassword
  try {
    & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc 'SELECT 1;' *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel autenticar no PostgreSQL. Verifique a senha do usuario postgres.' }
    $exists = (& $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName';").Trim()
    if ($exists -ne '1') {
      Write-Host "Criando banco $dbName..." -ForegroundColor Yellow
      Invoke-Native $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
    }
  } finally { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
  Write-Ok "Banco: $dbName@$dbHost`:$dbPort"

  Write-Step '3/8 - Gerando configuracao segura do backend'
  $envPath = Join-Path $Backend '.env'
  if (Test-Path $envPath) {
    $backupEnv = "$envPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $envPath $backupEnv -Force
    Write-Warn "backend/.env existente preservado em: $backupEnv"
  }
  $encodedPassword = [Uri]::EscapeDataString($dbPassword)
  $jwt = New-RandomSecret 48
  $faceKey = New-RandomSecret 32
  $envText = @"
PORT=3000
NODE_ENV=production
DATABASE_URL="postgresql://$dbUser:$encodedPassword@$dbHost`:$dbPort/$dbName?schema=public"
JWT_SECRET="$(Escape-EnvValue $jwt)"
JWT_EXPIRES_IN="8h"
EMAIL_USER=""
EMAIL_APP_PASSWORD=""
EMAIL_FROM="SteelControl"
FACE_API_URL="http://127.0.0.1:8000"
FACE_API_KEY="$(Escape-EnvValue $faceKey)"
FACE_API_TIMEOUT_MS=60000
CORS_ORIGINS=""
DEVICE_COMMAND_LEASE_MS=15000
DISCOVERY_ENABLED=true
DISCOVERY_PORT=4210
DISCOVERY_ADVERTISE_URL=""
"@
  Set-Content -Path $envPath -Value $envText -Encoding UTF8
  Write-Ok 'backend/.env criado com JWT/FACE_API_KEY aleatorios.'

  Write-Step '4/8 - Instalando backend e banco'
  Push-Location $Backend
  try {
    Invoke-Native npm ci --include=dev
    Invoke-Native npx prisma generate
    Invoke-Native npx prisma migrate deploy
    Invoke-Native npm run seed
  } finally { Pop-Location }
  Write-Ok 'Backend instalado e banco migrado.'

  Write-Step '5/8 - Instalando Face API'
  $vsWhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
  $hasBuildTools = $false
  if (Test-Path $vsWhere) {
    $vs = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    $hasBuildTools = -not [string]::IsNullOrWhiteSpace(($vs | Select-Object -First 1))
  }
  if (-not $hasBuildTools -and -not $SkipDependencyInstall) {
    Write-Warn 'Microsoft C++ Build Tools nao encontrado. O InsightFace pode precisar dele.'
    $answer = Read-Host 'Instalar Build Tools automaticamente agora? [S/n]'
    if ([string]::IsNullOrWhiteSpace($answer) -or $answer -match '^[sS]') {
      Install-WingetPackage 'Microsoft.VisualStudio.2022.BuildTools' 'Visual Studio 2022 Build Tools' @('--override','--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended')
    }
  }
  $faceVenv = Join-Path $FaceApi 'venv'
  $facePy = Join-Path $faceVenv 'Scripts\python.exe'
  if (Test-Path $faceVenv) { Remove-Item $faceVenv -Recurse -Force }
  Invoke-Native py -3.11 -m venv $faceVenv
  Invoke-Native $facePy -m pip install --upgrade pip setuptools wheel
  Invoke-Native $facePy -m pip install --prefer-binary -r (Join-Path $FaceApi 'requirements.txt')
  Invoke-Native $facePy (Join-Path $FaceApi 'verificar_ambiente.py')
  Write-Ok 'Face API instalada.'

  Write-Step '6/8 - Instalando SteelControl Edge'
  if (-not $NoEdge) {
    & (Join-Path $EdgeDir 'INSTALAR_EDGE.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar SteelControl Edge.' }
    Write-Ok 'SteelControl Edge instalado.'
  } else { Write-Warn 'Edge ignorado por -NoEdge.' }

  Write-Step '7/8 - Criando atalhos e firewall'
  try {
    Get-NetFirewallRule -DisplayName 'SteelControl Discovery UDP 4210' -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName 'SteelControl Discovery UDP 4210' -Direction Inbound -Action Allow -Protocol UDP -LocalPort 4210 | Out-Null
  } catch { Write-Warn 'Nao foi possivel criar regra UDP/4210 automaticamente.' }
  if (-not $NoShortcuts) {
    Create-Shortcut 'SteelControl' (Join-Path $Root 'INICIAR_STEELCONTROL_PRODUCAO.ps1') 'Iniciar SteelControl em modo de producao'
    Create-Shortcut 'SteelControl - Parar' (Join-Path $Root 'PARAR_STEELCONTROL.ps1') 'Parar processos locais do SteelControl'
    Create-Shortcut 'SteelControl - Backup' (Join-Path $Root 'BACKUP_STEELCONTROL.ps1') 'Criar backup validado do SteelControl'
    Create-Shortcut 'SteelControl - Restaurar' (Join-Path $Root 'RESTAURAR_STEELCONTROL.ps1') 'Restaurar backup do SteelControl'
    Write-Ok 'Atalhos criados na Area de Trabalho.'
  }

  Write-Step '8/8 - Verificacao final'
  & (Join-Path $Root 'VERIFICAR_INSTALACAO.ps1') -Quiet
  if ($LASTEXITCODE -ne 0) { throw 'A verificacao final encontrou problemas.' }
  Set-Content -Path (Join-Path $Root '.steelcontrol-installed') -Value (Get-Date -Format 'o') -Encoding ASCII

  Write-Host ''
  Write-Host '=================================================' -ForegroundColor Green
  Write-Host ' STEELCONTROL INSTALADO COM SUCESSO' -ForegroundColor Green
  Write-Host '=================================================' -ForegroundColor Green
  Write-Host 'Atalho principal: SteelControl' -ForegroundColor Cyan
  Write-Host 'Sistema:          http://localhost:3000/app/login' -ForegroundColor Gray
  Write-Host "Log da instalacao: $LogFile" -ForegroundColor Gray
  Write-Host ''
  $start = Read-Host 'Deseja iniciar o SteelControl agora? [S/n]'
  if ([string]::IsNullOrWhiteSpace($start) -or $start -match '^[sS]') {
    & (Join-Path $Root 'INICIAR_STEELCONTROL_PRODUCAO.ps1')
  }
} catch {
  Write-Host ''
  Write-Host 'INSTALACAO INTERROMPIDA' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Log: $LogFile" -ForegroundColor Yellow
  Finish-TranscriptSafe
  exit 1
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Finish-TranscriptSafe
