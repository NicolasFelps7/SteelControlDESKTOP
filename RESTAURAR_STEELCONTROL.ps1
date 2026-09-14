param(
  [string]$Backup = "",
  [switch]$Latest,
  [switch]$RestaurarConfiguracaoLocal,
  [switch]$RestaurarEdge,
  [switch]$SemBackupDeSeguranca
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-DatabaseConfig {
  param([string]$EnvPath)
  if (-not (Test-Path $EnvPath)) { throw "Arquivo backend/.env nao encontrado." }
  $Line = Get-Content $EnvPath | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if (-not $Line) { throw "DATABASE_URL nao encontrada em backend/.env." }
  $Raw = ($Line -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
  $Uri=[Uri]$Raw; $UserInfo=$Uri.UserInfo -split ':',2
  [pscustomobject]@{
    Host=$Uri.Host; Port=$(if($Uri.Port -gt 0){$Uri.Port}else{5432}); User=[Uri]::UnescapeDataString($UserInfo[0]);
    Password=$(if($UserInfo.Count -gt 1){[Uri]::UnescapeDataString($UserInfo[1])}else{''}); Database=[Uri]::UnescapeDataString($Uri.AbsolutePath.TrimStart('/'))
  }
}
function Find-PgTool {
  param([string]$Name)
  $Cmd=Get-Command $Name -ErrorAction SilentlyContinue; if($Cmd){return $Cmd.Source}
  $Candidates=@(); foreach($Base in @($env:ProgramFiles,${env:ProgramFiles(x86)})){
    if(-not $Base){continue}; $PgRoot=Join-Path $Base 'PostgreSQL'; if(Test-Path $PgRoot){
      $Candidates += Get-ChildItem $PgRoot -Directory -ErrorAction SilentlyContinue | Sort-Object { $v = ($_.Name -replace '[^0-9.]','').Trim('.'); if ($v -match '^\d+$') { $v = "$v.0" }; try { [version]$v } catch { [version]'0.0' } } -Descending | ForEach-Object { Join-Path $_.FullName "bin\$Name.exe" }
    }
  }
  $Found=$Candidates|Where-Object{Test-Path $_}|Select-Object -First 1; if(-not $Found){throw "$Name nao encontrado."}; return $Found
}
function Unprotect-LocalText {
  param([string]$Path)
  Add-Type -AssemblyName System.Security
  $Protected=[IO.File]::ReadAllBytes($Path)
  $Bytes=[Security.Cryptography.ProtectedData]::Unprotect($Protected,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  return [Text.Encoding]::UTF8.GetString($Bytes)
}
function Get-BackupInfo {
  param([string]$Path)
  $ManifestPath = Join-Path $Path 'manifest.json'
  $DumpPath = Join-Path $Path 'database.dump'
  if (-not (Test-Path $ManifestPath) -or -not (Test-Path $DumpPath)) { return $null }
  try {
    $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    if ($Manifest.product -ne 'SteelControl') { return $null }
    $Created = try { [datetimeoffset]::Parse($Manifest.createdAt) } catch { [datetimeoffset](Get-Item $ManifestPath).LastWriteTime }
    $DbName = if ($Manifest.database -and $Manifest.database.name) { [string]$Manifest.database.name } else { 'desconhecido' }
    $Tag = if ($Manifest.tag) { [string]$Manifest.tag } else { '-' }
    $Version = if ($Manifest.appVersion) { [string]$Manifest.appVersion } else { 'desconhecida' }
    [pscustomobject]@{ Path=(Resolve-Path $Path).Path; Created=$Created; Database=$DbName; Tag=$Tag; Version=$Version; Manifest=$Manifest }
  } catch { return $null }
}
function Get-AvailableBackups {
  param([string]$Root)
  $BackupRoot = Join-Path $Root 'backups'
  if (-not (Test-Path $BackupRoot)) { return @() }
  $Items = @()
  foreach ($Dir in Get-ChildItem $BackupRoot -Directory -ErrorAction SilentlyContinue) {
    $Info = Get-BackupInfo $Dir.FullName
    if ($Info) { $Items += $Info }
  }
  return @($Items | Sort-Object Created -Descending)
}
function Select-BackupInteractive {
  param([object[]]$Backups)
  if (-not $Backups -or $Backups.Count -eq 0) { throw 'Nenhum backup SteelControl valido foi encontrado na pasta backups.' }
  Write-Host ''
  Write-Host 'BACKUPS DISPONIVEIS' -ForegroundColor Cyan
  Write-Host '-------------------' -ForegroundColor DarkGray
  for ($i=0; $i -lt $Backups.Count; $i++) {
    $B=$Backups[$i]
    $When=$B.Created.ToLocalTime().ToString('dd/MM/yyyy HH:mm:ss')
    Write-Host ("[{0}] {1} | banco={2} | tag={3} | versao={4}" -f ($i+1),$When,$B.Database,$B.Tag,$B.Version)
  }
  Write-Host '[0] Cancelar' -ForegroundColor DarkGray
  while ($true) {
    $Choice=Read-Host 'Escolha o numero do backup'
    $N=0
    if ([int]::TryParse($Choice,[ref]$N)) {
      if ($N -eq 0) { return $null }
      if ($N -ge 1 -and $N -le $Backups.Count) { return $Backups[$N-1] }
    }
    Write-Host 'Opcao invalida. Digite um numero da lista.' -ForegroundColor Yellow
  }
}

$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
$SelectedInfo=$null

if ($Latest) {
  $Available=Get-AvailableBackups $Root
  if (-not $Available -or $Available.Count -eq 0) { throw 'Nenhum backup SteelControl valido foi encontrado na pasta backups.' }
  $SelectedInfo=$Available[0]
} elseif (-not [string]::IsNullOrWhiteSpace($Backup)) {
  if (-not (Test-Path $Backup)) { throw "Backup nao encontrado: $Backup" }
  $SelectedInfo=Get-BackupInfo (Resolve-Path $Backup).Path
  if (-not $SelectedInfo) { throw 'A pasta informada nao contem um backup SteelControl valido.' }
} else {
  $SelectedInfo=Select-BackupInteractive (Get-AvailableBackups $Root)
  if (-not $SelectedInfo) { Write-Host 'Operacao cancelada.' -ForegroundColor Yellow; exit 0 }
}

$Backup=$SelectedInfo.Path
$Manifest=$SelectedInfo.Manifest
$ManifestPath=Join-Path $Backup 'manifest.json'; $DumpPath=Join-Path $Backup 'database.dump'

Write-Host ''
Write-Host 'STEELCONTROL - RESTAURACAO' -ForegroundColor Cyan
Write-Host ('Backup:  ' + $Backup) -ForegroundColor Gray
Write-Host ('Criado:  ' + $SelectedInfo.Created.ToLocalTime().ToString('dd/MM/yyyy HH:mm:ss')) -ForegroundColor Gray
Write-Host ('Banco:   ' + $SelectedInfo.Database) -ForegroundColor Gray
Write-Host ('Tag:     ' + $SelectedInfo.Tag) -ForegroundColor Gray
Write-Host ('Versao:  ' + $SelectedInfo.Version) -ForegroundColor Gray

Write-Host ''
Write-Host 'Validando integridade do backup...' -ForegroundColor Yellow
foreach($F in $Manifest.files){
  $P=Join-Path $Backup ($F.path -replace '/','\\'); if(-not(Test-Path $P)){throw "Arquivo ausente: $($F.path)"}
  if((Get-FileHash $P -Algorithm SHA256).Hash -ne $F.sha256){throw "Checksum invalido: $($F.path)"}
}
Write-Host 'Backup integro.' -ForegroundColor Green

$Listening=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if($Listening){throw 'O backend ainda esta executando na porta 3000. Feche o SteelControl antes de restaurar.'}

if(-not $SemBackupDeSeguranca){
  Write-Host ''
  Write-Host 'Criando backup automatico de seguranca do estado atual...' -ForegroundColor Yellow
  & (Join-Path $Root 'BACKUP_STEELCONTROL.ps1') -Tag 'pre_restore'
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'O backup de seguranca falhou. A restauracao foi cancelada.' }
  Write-Host 'Backup de seguranca concluido.' -ForegroundColor Green
}

$Db=Get-DatabaseConfig (Join-Path $Root 'backend\.env')
Write-Host ''
Write-Host 'RESUMO ANTES DE RESTAURAR' -ForegroundColor Cyan
Write-Host ("Banco atual:      {0}@{1}:{2}" -f $Db.Database,$Db.Host,$Db.Port)
Write-Host ("Backup escolhido: {0} ({1})" -f $SelectedInfo.Database,$SelectedInfo.Created.ToLocalTime().ToString('dd/MM/yyyy HH:mm:ss'))
Write-Host 'A restauracao substituira o estado atual do banco pelo estado desse backup.' -ForegroundColor Yellow
$Confirm=Read-Host 'Digite RESTAURAR para continuar'
if($Confirm -ne 'RESTAURAR'){Write-Host 'Operacao cancelada. Nenhum dado foi restaurado.' -ForegroundColor Yellow; exit 0}

$PgRestore=Find-PgTool 'pg_restore'; $OldPassword=$env:PGPASSWORD; $env:PGPASSWORD=$Db.Password
try {
  Write-Host ''
  Write-Host 'Restaurando PostgreSQL...' -ForegroundColor Yellow
  & $PgRestore --clean --if-exists --no-owner --no-privileges --exit-on-error --host=$($Db.Host) --port=$($Db.Port) --username=$($Db.User) --dbname=$($Db.Database) $DumpPath
  if($LASTEXITCODE -ne 0){throw "pg_restore falhou com codigo $LASTEXITCODE."}
} finally {$env:PGPASSWORD=$OldPassword}

if($RestaurarConfiguracaoLocal){
  $ProtectedEnv=Join-Path $Backup 'config\backend.env.dpapi'
  if(Test-Path $ProtectedEnv){
    $Text=Unprotect-LocalText $ProtectedEnv
    Set-Content (Join-Path $Root 'backend\.env') -Value $Text -Encoding UTF8
    Write-Host 'backend/.env restaurado (DPAPI).' -ForegroundColor Green
  } else { Write-Host 'Backup nao possui configuracao local protegida.' -ForegroundColor Yellow }
}
if($RestaurarEdge){
  $EdgeBackup=Join-Path $Backup 'config\edge-profiles.json'
  if(Test-Path $EdgeBackup){
    $EdgeDir=Join-Path $env:ProgramData 'SteelControl\Edge'; New-Item -ItemType Directory -Force -Path $EdgeDir | Out-Null
    Copy-Item $EdgeBackup (Join-Path $EdgeDir 'edge-profiles.json') -Force
    Write-Host 'Perfis do Edge restaurados.' -ForegroundColor Green
  } else { Write-Host 'Backup nao possui perfis do Edge.' -ForegroundColor Yellow }
}

Write-Host ''
Write-Host 'RESTAURACAO CONCLUIDA COM SUCESSO' -ForegroundColor Green
Write-Host ('Backup restaurado: ' + $SelectedInfo.Created.ToLocalTime().ToString('dd/MM/yyyy HH:mm:ss')) -ForegroundColor Green
Write-Host 'Agora execute .\INICIAR_STEELCONTROL.ps1 e valide login, maquinas e auditoria.' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Dica: para restaurar automaticamente o backup mais recente no futuro:' -ForegroundColor DarkGray
Write-Host '  .\RESTAURAR_STEELCONTROL.ps1 -Latest' -ForegroundColor DarkGray
