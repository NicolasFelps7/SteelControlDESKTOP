@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALAR_STEELCONTROL.ps1"
if errorlevel 1 (
  echo.
  echo A instalacao terminou com erro. Consulte o log em logs\instalacao-*.log
  pause
)
