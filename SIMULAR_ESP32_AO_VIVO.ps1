$ErrorActionPreference = "Stop"

$Api = "http://localhost:3000"

Write-Host ""
Write-Host "=== STEELCONTROL - ESP32 AO VIVO ===" -ForegroundColor Cyan
Write-Host "Conectando ao SteelControl..."

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

Write-Host "Máquina: $($maquina.nome) | ID: $($maquina.id)" -ForegroundColor Green

if ($maquina.modoSimulacao -ne $false) {
    Write-Host ""
    Write-Host "A máquina ainda está em Modo simulação." -ForegroundColor Yellow
    Write-Host "Abra: Máquinas > Editar > Modo de operação > Equipamento real / ESP32 > Salvar."
    exit 1
}

$ciclos = [int]$maquina.ciclos
$producao = [int]$maquina.producao

Write-Host ""
Write-Host "Enviando telemetria a cada 2 segundos." -ForegroundColor Cyan
Write-Host "Para parar o ESP32 falso, pressione CTRL + C." -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $ciclos += Get-Random -Minimum 1 -Maximum 3
    $producao += Get-Random -Minimum 0 -Maximum 4

    $temperatura = [math]::Round(
        (Get-Random -Minimum 360 -Maximum 451) / 10,
        1
    )

    $consumo = [math]::Round(
        (Get-Random -Minimum 540 -Maximum 721) / 10,
        1
    )

    $telemetria = @{
        temperatura = $temperatura
        producao = $producao
        ciclos = $ciclos
        consumoEnergia = $consumo
        origem = "TESTE_ESP32"
    } | ConvertTo-Json

    $resposta = Invoke-RestMethod `
        -Uri "$Api/maquinas/$($maquina.id)/telemetria" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $telemetria

    $hora = Get-Date -Format "HH:mm:ss"

    Write-Host (
        "[$hora] " +
        "TEMP $temperatura C | " +
        "CICLOS $ciclos | " +
        "PRODUCAO $producao | " +
        "CONSUMO $consumo | " +
        "STATUS $($resposta.estadoConexao.texto)"
    ) -ForegroundColor Green

    Start-Sleep -Seconds 2
}
