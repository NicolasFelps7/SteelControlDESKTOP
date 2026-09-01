$ErrorActionPreference = "Stop"

$FaceApiDir = Join-Path $PSScriptRoot "face-api"
$VenvPython = Join-Path $FaceApiDir "venv\Scripts\python.exe"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  STEELCONTROL - TESTES DA FACE API" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $VenvPython)) {
    throw "Ambiente Python nao encontrado. Execute primeiro .\INICIAR_STEELCONTROL.ps1 para instalar a Face API."
}

Push-Location $FaceApiDir

try {
    & $VenvPython -m unittest discover -s tests -v

    if ($LASTEXITCODE -ne 0) {
        throw "Os testes da Face API falharam (codigo $LASTEXITCODE)."
    }

    Write-Host ""
    Write-Host "Face API validada com sucesso." -ForegroundColor Green
}
finally {
    Pop-Location
}
