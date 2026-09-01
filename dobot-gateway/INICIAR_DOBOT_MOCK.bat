@echo off
setlocal
cd /d "%~dp0"
if not exist .env (copy .env.example .env >nul & echo Configure MACHINE_ID e DEVICE_KEY em dobot-gateway\.env & pause & exit /b 1)
if not exist venv (py -m venv venv)
call venv\Scripts\activate.bat
pip install -r requirements.txt
set DOBOT_MODE=mock
python main.py
pause
