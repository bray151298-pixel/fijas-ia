@echo off
chcp 65001 >nul
title Tipster IA - Servidor en marcha
color 0B

echo.
echo  ===============================================================
echo                       T I P S T E R   I A
echo                  Sistema de apuestas con IA
echo  ===============================================================
echo.

REM Cambiar a la carpeta del proyecto
cd /d "%~dp0"

REM Verificar que el entorno virtual existe
if not exist ".venv\Scripts\activate.bat" (
    echo  [ERROR] No se encuentra el entorno virtual .venv
    echo.
    echo  Crealo primero ejecutando en PowerShell:
    echo     python -m venv .venv
    echo     .\.venv\Scripts\Activate.ps1
    echo     pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Activar venv
echo  [1/3] Activando entorno virtual...
call ".venv\Scripts\activate.bat"

REM Verificar que uvicorn esta instalado
where uvicorn >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] uvicorn no esta instalado en el entorno virtual.
    echo  Ejecuta: pip install -r requirements.txt
    pause
    exit /b 1
)

echo  [2/3] Iniciando servidor en http://localhost:8000
echo  [3/3] Abriendo navegador en 5 segundos...
echo.
echo  ---------------------------------------------------------------
echo   Para detener el servidor: presiona Ctrl+C o cierra esta ventana
echo  ---------------------------------------------------------------
echo.

REM Abre el navegador despues de 5 segundos en background
start "" /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:8000"

REM Lanza el servidor (esto bloquea hasta Ctrl+C)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo  Servidor detenido.
pause
