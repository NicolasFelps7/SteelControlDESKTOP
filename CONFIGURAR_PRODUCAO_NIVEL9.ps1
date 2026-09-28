$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendEnv = Join-Path $Root 'backend\.env'
$FaceEnv = Join-Path $Root 'face-api\.env'
$DeployEnv = Join-Path $Root 'deploy\.env'
$Caddyfile = Join-Path $Root 'deploy\Caddyfile'

function New-HexSecret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
  return (($buffer | ForEach-Object { $_.ToString('x2') }) -join '')
}

function New-Base64Secret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($buffer)
}

function Read-Secret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Escape-Env([string]$Value) {
  if ($Value -match "[`r`n]") { throw 'Valores de ambiente não podem conter quebra de linha.' }
  return $Value.Replace('\', '\\').Replace('"', '\"')
}

function Save-Utf8([string]$Path, [string]$Content) {
  [IO.File]::WriteAllText($Path, $Content, (New-Object Text.UTF8Encoding($false)))
}

function Protect-SecretFile([string]$Path) {
  if ($env:OS -ne 'Windows_NT') { return }
  try {
    & icacls $Path /inheritance:r /grant:r "$($env:USERNAME):(R,W)" 'SYSTEM:(F)' 'Administrators:(F)' | Out-Null
  } catch {
    Write-Warning "Não foi possível restringir automaticamente as permissões de $Path."
  }
}

function Backup-Existing([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backup = "$Path.backup.$stamp"
  Copy-Item $Path $backup
  Protect-SecretFile $backup
  Write-Host "Configuração anterior preservada em $backup" -ForegroundColor Yellow
}

Write-Host ''
Write-Host '===================================================' -ForegroundColor DarkGray
Write-Host ' SteelControl - Configuração de Produção Nível 9' -ForegroundColor Cyan
Write-Host '===================================================' -ForegroundColor DarkGray
Write-Host 'Nenhuma senha será colocada no código ou exibida no terminal.' -ForegroundColor Gray

$domain = (Read-Host 'Domínio HTTPS, sem https:// (ex.: steelcontrol.exemplo.com)').Trim().ToLowerInvariant()
if ($domain -notmatch '^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$' -or $domain -notmatch '\.') {
  throw 'Domínio inválido.'
}

$databaseUrl = Read-Secret 'DATABASE_URL do PostgreSQL'
if ($databaseUrl -notmatch '^postgres(?:ql)?://') { throw 'DATABASE_URL deve começar com postgresql://.' }

$emailUser = (Read-Host 'E-mail usado no MFA dos administradores').Trim()
if ($emailUser -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw 'E-mail inválido.' }
$emailPassword = Read-Secret 'Senha de aplicativo do e-mail (não use a senha normal da conta)'
if ([string]::IsNullOrWhiteSpace($emailPassword)) { throw 'A senha de aplicativo é obrigatória.' }

$smtpHost = (Read-Host 'SMTP_HOST (Enter para Gmail)').Trim()
$smtpPort = if ($smtpHost) { (Read-Host 'SMTP_PORT [587]').Trim() } else { '587' }
if (-not $smtpPort) { $smtpPort = '587' }
if ($smtpPort -notmatch '^\d+$' -or [int]$smtpPort -lt 1 -or [int]$smtpPort -gt 65535) { throw 'SMTP_PORT inválida.' }
$smtpSecure = if ($smtpHost) { (Read-Host 'SMTP usa TLS direto? [false]').Trim().ToLowerInvariant() } else { 'false' }
if (-not $smtpSecure) { $smtpSecure = 'false' }
if ($smtpSecure -notin @('true', 'false')) { throw 'Informe true ou false em SMTP_SECURE.' }

$faceApiUrl = (Read-Host 'FACE_API_URL [http://127.0.0.1:8000]').Trim()
if (-not $faceApiUrl) { $faceApiUrl = 'http://127.0.0.1:8000' }
if ($faceApiUrl -notmatch '^https://' -and $faceApiUrl -notmatch '^http://(127\.0\.0\.1|localhost)(:\d+)?$') {
  throw 'Em nível 9, a Face API deve usar HTTPS ou ficar apenas no loopback local.'
}

$jwtSecret = New-HexSecret 48
$sensitiveKey = New-Base64Secret 32
$faceApiKey = New-HexSecret 32
$monitoringToken = New-HexSecret 32
$redisPassword = New-HexSecret 32

$backendContent = @"
NODE_ENV=production
SECURITY_PROFILE=level9
PORT=3000
DATABASE_URL="$(Escape-Env $databaseUrl)"
JWT_SECRET="$jwtSecret"
JWT_EXPIRES_IN="30m"
SESSION_COOKIE_MAX_AGE_MS=1800000
ENFORCE_HTTPS=true
SENSITIVE_DATA_KEY="$sensitiveKey"
ADMIN_MFA_REQUIRED=true
EMAIL_USER="$(Escape-Env $emailUser)"
EMAIL_APP_PASSWORD="$(Escape-Env $emailPassword)"
EMAIL_FROM="SteelControl <$emailUser>"
SMTP_HOST="$(Escape-Env $smtpHost)"
SMTP_PORT=$smtpPort
SMTP_SECURE=$smtpSecure
FACE_API_URL="$(Escape-Env $faceApiUrl)"
FACE_API_KEY="$faceApiKey"
FACE_API_TIMEOUT_MS=60000
CORS_ORIGINS="https://$domain"
DEVICE_COMMAND_LEASE_MS=15000
REDIS_URL="redis://:$redisPassword@127.0.0.1:6379/0"
MONITORING_TOKEN="$monitoringToken"
DISCOVERY_ENABLED=true
DISCOVERY_PORT=4210
DISCOVERY_ADVERTISE_URL="https://$domain"
"@

$faceContent = @"
STEELCONTROL_ENV=production
FACE_CORS_ORIGINS=""
FACE_API_KEY="$faceApiKey"
"@

$redisContent = "REDIS_PASSWORD=$redisPassword`n"
$caddyContent = @"
$domain {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000 {
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
    header_up X-Real-IP {remote_host}
  }
  header {
    -Server
  }
}
"@

Backup-Existing $BackendEnv
Backup-Existing $FaceEnv
Backup-Existing $DeployEnv
Save-Utf8 $BackendEnv $backendContent
Save-Utf8 $FaceEnv $faceContent
Save-Utf8 $DeployEnv $redisContent
Save-Utf8 $Caddyfile $caddyContent
Protect-SecretFile $BackendEnv
Protect-SecretFile $FaceEnv
Protect-SecretFile $DeployEnv

Write-Host ''
Write-Host 'Configuração nível 9 criada com sucesso.' -ForegroundColor Green
Write-Host "Backend: $BackendEnv" -ForegroundColor DarkGray
Write-Host "Face API: $FaceEnv" -ForegroundColor DarkGray
Write-Host "Proxy HTTPS: $Caddyfile" -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Próximos comandos:' -ForegroundColor Cyan
Write-Host '  docker compose --env-file deploy/.env -f deploy/redis.compose.yml up -d'
Write-Host '  npm run check:security9'
Write-Host '  npm --prefix backend run face:encrypt'
Write-Host 'Depois, configure o DNS e inicie o Caddy com deploy/Caddyfile.'
