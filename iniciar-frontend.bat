@echo off
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Instalando dependencias do frontend...
    call npm install
)

if not exist .env (
    echo Copiando .env.example para .env
    copy .env.example .env
)

echo Iniciando frontend em http://localhost:5173
call npm run dev
pause
