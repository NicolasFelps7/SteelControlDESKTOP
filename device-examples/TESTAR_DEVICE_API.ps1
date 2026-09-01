$ErrorActionPreference = "Stop"

$Api = Read-Host "URL da API [http://localhost:3000]"
if ([string]::IsNullOrWhiteSpace($Api)) { $Api = "http://localhost:3000" }

$MaquinaId = Read-Host "ID da máquina"
$DeviceKey = Read-Host "Device Key gerada pelo SteelControl"

$Headers = @{
  "X-Device-Key" = $DeviceKey
}

Write-Host "\nEnviando telemetria real..." -ForegroundColor Cyan

$Body = @{
  temperatura = 42.7
  vibracao = 1.6
  corrente = 0.82
  producao = 35
  ciclos = 128
  consumoEnergia = 61.4
  qualidadeSinal = 92
  latenciaMs = 18
  origem = "ESP32"
} | ConvertTo-Json

$Resposta = Invoke-RestMethod `
  -Uri "$Api/device/$MaquinaId/telemetria" `
  -Method POST `
  -Headers $Headers `
  -ContentType "application/json" `
  -Body $Body

$Resposta | ConvertTo-Json -Depth 6

Write-Host "\nTelemetria enviada. Abra o dashboard: deve aparecer Máquina conectada." -ForegroundColor Green
