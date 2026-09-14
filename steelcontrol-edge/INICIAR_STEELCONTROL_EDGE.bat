@echo off
setlocal
cd /d "%~dp0"
set "PY=%~dp0..\.venv-edge\Scripts\python.exe"
if not exist "%PY%" (
  echo SteelControl Edge ainda nao foi instalado neste computador.
  echo Execute INSTALAR_EDGE.ps1 uma vez como usuario normal.
  echo.
  pause
  exit /b 1
)
"%PY%" "%~dp0edge_app.py"
endlocal
