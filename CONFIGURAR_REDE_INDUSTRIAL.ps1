param(
  [Parameter(Mandatory=$true)][string]$IndustrialSubnet,
  [int]$BackendPort = 3000,
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($IndustrialSubnet -notmatch '^\d{1,3}(\.\d{1,3}){3}/\d{1,2}$') {
  throw 'Informe a sub-rede em CIDR, por exemplo 10.20.30.0/24.'
}

$rules = @(
  [pscustomobject]@{ Name='SteelControl API - Rede Industrial'; Action='Allow'; Profile='Domain,Private'; Remote=$IndustrialSubnet },
  [pscustomobject]@{ Name='SteelControl API - Bloqueio Publico'; Action='Block'; Profile='Public'; Remote='Any' }
)

Write-Host 'PLANO DE FIREWALL STEELCONTROL' -ForegroundColor Cyan
$rules | Format-Table Name,Action,Profile,Remote

if (-not $Apply) {
  Write-Host 'Nenhuma alteração foi feita. Revise e execute novamente com -Apply como Administrador.' -ForegroundColor Yellow
  exit 0
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Execute o PowerShell como Administrador.'
}

foreach ($rule in $rules) {
  Remove-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP `
    -LocalPort $BackendPort -Action $rule.Action -Profile $rule.Profile -RemoteAddress $rule.Remote | Out-Null
}

Write-Host 'Firewall aplicado. Valide o acesso do tablet e bloqueio fora da VLAN industrial.' -ForegroundColor Green
