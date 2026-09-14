$ErrorActionPreference = 'SilentlyContinue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runtime = Join-Path $Root '.steelcontrol-runtime.json'
Write-Host 'SteelControl - encerramento local' -ForegroundColor Cyan
if (-not (Test-Path $Runtime)) {
  Write-Host 'Nenhum registro de processos iniciado por este launcher.' -ForegroundColor Yellow
  exit 0
}
$state = Get-Content $Runtime -Raw | ConvertFrom-Json
foreach ($prop in @('backendPid','facePid')) {
  $pidValue = $state.$prop
  if ($pidValue) {
    $p = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($p) {
      Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
      Write-Host "Processo $prop (PID $pidValue) encerrado." -ForegroundColor Green
    }
  }
}
Remove-Item $Runtime -Force -ErrorAction SilentlyContinue
