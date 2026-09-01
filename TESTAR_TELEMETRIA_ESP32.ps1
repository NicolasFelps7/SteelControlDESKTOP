$ErrorActionPreference = "Stop"

$Api = "http://localhost:3000"

Write-Host ""
Write-Host "=== STEELCONTROL - TESTE DE TELEMETRIA ESP32 ===" -ForegroundColor Cyan

$loginBody = @{
    email = "admin@steelcontrol.com"
    senha = "Steel123!"
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Uri "$Api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$headers = @{
    Authorization = "Bearer $($login.token)"
}

$maquinas = Invoke-RestMethod `
    -Uri "$Api/maquinas" `
    -Method GET `
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

Write-Host "Máquina encontrada: $($maquina.nome) (ID $($maquina.id))"

if ($maquina.modoSimulacao -ne $false) {
    Write-Host ""
    Write-Host "ATENÇÃO: a máquina ainda está em Modo simulação." -ForegroundColor Yellow
    Write-Host "No SteelControl: Máquinas > Editar > Modo de operação > Equipamento real / ESP32 > Salvar."
    Write-Host "Depois execute este script novamente."
    exit 1
}

$telemetria = @{
    temperatura = 42.7
    producao = 35
    ciclos = 128
    consumoEnergia = 61.4
    origem = "TESTE_ESP32"
} | ConvertTo-Json

$resposta = Invoke-RestMethod `
    -Uri "$Api/maquinas/$($maquina.id)/telemetria" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $telemetria

Write-Host ""
Write-Host "TELEMETRIA ENVIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "Temperatura: $($resposta.temperatura) C"
Write-Host "Ciclos: $($resposta.ciclos)"
Write-Host "Consumo: $($resposta.consumoEnergia)"
Write-Host "Conexão: $($resposta.estadoConexao.texto)"
Write-Host ""
Write-Host "Volte ao dashboard. Em até 2 segundos deve aparecer 'Máquina conectada'." -ForegroundColor Cyan
