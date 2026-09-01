$ErrorActionPreference = "Stop"

$Api = "http://localhost:3000"

$login = Invoke-RestMethod `
    -Uri "$Api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = "admin@steelcontrol.com"
        senha = "Steel123!"
    } | ConvertTo-Json)

$headers = @{
    Authorization = "Bearer $($login.token)"
}

$maquinas = Invoke-RestMethod `
    -Uri "$Api/maquinas" `
    -Headers $headers

$maquina = $maquinas |
    Where-Object {
        $_.nome -match "Braço|Braco|rob"
    } |
    Select-Object -First 1

if (-not $maquina) {
    $maquina = $maquinas | Select-Object -First 1
}

if (-not $maquina) {
    throw "Nenhuma máquina cadastrada."
}

if ($maquina.modoSimulacao -ne $false) {
    throw "Coloque a máquina em Equipamento real / ESP32 antes do teste."
}

$body = @{
    temperatura = 76.5
    producao = [int]$maquina.producao
    ciclos = [int]$maquina.ciclos + 1
    consumoEnergia = 63.2
    origem = "TESTE_ESP32"
} | ConvertTo-Json

$resposta = Invoke-RestMethod `
    -Uri "$Api/maquinas/$($maquina.id)/telemetria" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body

Write-Host ""
Write-Host "ALERTA DE TEMPERATURA ENVIADO!" -ForegroundColor Red
Write-Host "Temperatura: $($resposta.temperatura) C"
Write-Host "Status: $($resposta.status)"
Write-Host "Manutencao: $($resposta.manutencao)"
