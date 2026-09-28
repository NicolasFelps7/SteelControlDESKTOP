$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Invoke-Native {
  param([Parameter(Mandatory=$true)][string]$File,[Parameter(ValueFromRemainingArguments=$true)][string[]]$NativeArgs)
  & $File @NativeArgs
  if ($LASTEXITCODE -ne 0) { throw "Falha: $File $($NativeArgs -join ' ')" }
}

Write-Host 'SteelControl - validação nível 9' -ForegroundColor Cyan
Push-Location $Root
try {
  Invoke-Native npm run quality
  Invoke-Native npm --prefix backend audit --audit-level=moderate
  Invoke-Native npm run check:security9
  Invoke-Native python -m compileall -q steelcontrol-edge dobot-gateway face-api
} finally { Pop-Location }

$redisOk = Test-NetConnection 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $redisOk) { throw 'Redis não respondeu em 127.0.0.1:6379.' }

Write-Host 'NÍVEL 9 APROVADO: código, dependências, configuração e Redis validados.' -ForegroundColor Green

