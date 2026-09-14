param(
  [string]$Destino = "",
  [string]$Tag = "manual"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-DatabaseConfig {
  param([string]$EnvPath)
  if (-not (Test-Path $EnvPath)) { throw "Arquivo backend/.env nao encontrado." }
  $Line = Get-Content $EnvPath | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if (-not $Line) { throw "DATABASE_URL nao encontrada em backend/.env." }
  $Raw = ($Line -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
  try { $Uri = [Uri]$Raw } catch { throw "DATABASE_URL invalida." }
  if ($Uri.Scheme -notin @('postgresql','postgres')) { throw "DATABASE_URL nao aponta para PostgreSQL." }
  $UserInfo = $Uri.UserInfo -split ':',2
  $User = [Uri]::UnescapeDataString($UserInfo[0])
  $Password = if ($UserInfo.Count -gt 1) { [Uri]::UnescapeDataString($UserInfo[1]) } else { '' }
  $Database = [Uri]::UnescapeDataString($Uri.AbsolutePath.TrimStart('/'))
  $Port = if ($Uri.Port -gt 0) { $Uri.Port } else { 5432 }
  $Schema = 'public'
  if ($Uri.Query -match '(?:^|[?&])schema=([^&]+)') { $Schema = [Uri]::UnescapeDataString($Matches[1]) }
  [pscustomobject]@{ Host=$Uri.Host; Port=$Port; User=$User; Password=$Password; Database=$Database; Schema=$Schema }
}

function Find-PgTool {
  param([Parameter(Mandatory=$true)][string]$Name)
  $Cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($Cmd) { return $Cmd.Source }
  $Candidates = @()
  foreach ($Base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
    if (-not $Base) { continue }
    $PgRoot = Join-Path $Base 'PostgreSQL'
    if (Test-Path $PgRoot) {
      $Candidates += Get-ChildItem $PgRoot -Directory -ErrorAction SilentlyContinue |
        Sort-Object { $v = ($_.Name -replace '[^0-9.]','').Trim('.'); if ($v -match '^\d+$') { $v = "$v.0" }; try { [version]$v } catch { [version]'0.0' } } -Descending |
        ForEach-Object { Join-Path $_.FullName "bin\$Name.exe" }
    }
  }
  $Found = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $Found) { throw "$Name nao encontrado. Instale PostgreSQL Client Tools ou adicione a pasta bin ao PATH." }
  return $Found
}

function Protect-LocalText {
  param([string]$Text,[string]$Path)
  Add-Type -AssemblyName System.Security
  $Bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $Protected = [Security.Cryptography.ProtectedData]::Protect($Bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  [IO.File]::WriteAllBytes($Path,$Protected)
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $Root 'backend\.env'
$Db = Get-DatabaseConfig $EnvFile
$PgDump = Find-PgTool 'pg_dump'

if ([string]::IsNullOrWhiteSpace($Destino)) { $Destino = Join-Path $Root 'backups' }
New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$SafeTag = ($Tag -replace '[^a-zA-Z0-9_-]','_')
$BackupDir = Join-Path $Destino "SteelControl_${Stamp}_${SafeTag}"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$ConfigDir = Join-Path $BackupDir 'config'
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

Write-Host ""; Write-Host "STEELCONTROL - BACKUP" -ForegroundColor Cyan
Write-Host "Banco: $($Db.Database)@$($Db.Host):$($Db.Port)" -ForegroundColor Gray
Write-Host "Destino: $BackupDir" -ForegroundColor Gray

$DumpPath = Join-Path $BackupDir 'database.dump'
$OldPassword = $env:PGPASSWORD
$env:PGPASSWORD = $Db.Password
try {
  & $PgDump --format=custom --compress=6 --no-owner --no-privileges --schema=$($Db.Schema) --host=$($Db.Host) --port=$($Db.Port) --username=$($Db.User) --file=$DumpPath $Db.Database
  if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou com codigo $LASTEXITCODE." }
} finally { $env:PGPASSWORD = $OldPassword }
if (-not (Test-Path $DumpPath) -or (Get-Item $DumpPath).Length -lt 1024) { throw "Dump do banco nao foi criado corretamente." }

# Configuracao local e protegida por DPAPI do usuario Windows atual.
$EncryptedEnv = Join-Path $ConfigDir 'backend.env.dpapi'
Protect-LocalText -Text (Get-Content $EnvFile -Raw) -Path $EncryptedEnv

$ProjectFiles = @(
  'backend\.env.example', 'backend\.env.production.example', 'backend\package.json', 'backend\package-lock.json',
  'backend\prisma\schema.prisma', 'package.json'
)
foreach ($Rel in $ProjectFiles) {
  $Src = Join-Path $Root $Rel
  if (Test-Path $Src) {
    $Name = ($Rel -replace '[\\/]','__')
    Copy-Item $Src (Join-Path $ConfigDir $Name) -Force
  }
}

$EdgeSource = Join-Path $env:ProgramData 'SteelControl\Edge\edge-profiles.json'
if ($env:ProgramData -and (Test-Path $EdgeSource)) {
  Copy-Item $EdgeSource (Join-Path $ConfigDir 'edge-profiles.json') -Force
}

$Version='desconhecida'
try { $Version=(Get-Content (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json).version } catch {}
$Files = Get-ChildItem $BackupDir -File -Recurse | ForEach-Object {
  [pscustomobject]@{ path=$_.FullName.Substring($BackupDir.Length+1).Replace('\\','/'); bytes=$_.Length; sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash }
}
$Manifest = [ordered]@{
  schemaVersion=1; product='SteelControl'; appVersion=$Version; createdAt=(Get-Date).ToString('o'); tag=$SafeTag;
  database=[ordered]@{ host=$Db.Host; port=$Db.Port; name=$Db.Database; schema=$Db.Schema; user=$Db.User };
  security=[ordered]@{ backendEnv='DPAPI CurrentUser'; edgeProfiles='Device Keys continuam protegidas por DPAPI' };
  files=$Files
}
$Manifest | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $BackupDir 'manifest.json') -Encoding UTF8

Write-Host "Validando checksums..." -ForegroundColor Yellow
$Loaded = Get-Content (Join-Path $BackupDir 'manifest.json') -Raw | ConvertFrom-Json
foreach ($F in $Loaded.files) {
  $P = Join-Path $BackupDir ($F.path -replace '/','\\')
  if (-not (Test-Path $P)) { throw "Arquivo ausente no backup: $($F.path)" }
  $Hash=(Get-FileHash $P -Algorithm SHA256).Hash
  if ($Hash -ne $F.sha256) { throw "Checksum invalido: $($F.path)" }
}
Write-Host "BACKUP VALIDADO COM SUCESSO" -ForegroundColor Green
Write-Host $BackupDir -ForegroundColor Green
