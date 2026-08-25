@echo off
cd /d "%~dp0backend"

if not exist vendor (
    echo Instalando dependencias do backend...
    composer install
)

if not exist .env (
    echo Copiando .env.example para .env - por padrao usa SQLite local. Edite se quiser MySQL.
    copy .env.example .env
)

findstr /r /c:"^DB_DRIVER=sqlite" .env >nul
if %errorlevel%==0 (
    if not exist database\watta.sqlite (
        echo Criando banco SQLite local...
        composer db:sqlite
    )
)

echo Iniciando backend em http://localhost:8080
php -S localhost:8080 -t public
pause
