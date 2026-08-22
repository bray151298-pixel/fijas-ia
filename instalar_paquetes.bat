@echo off
chcp 65001 >nul
title Tipster IA - Instalador de paquetes
color 0E

echo.
echo  ===============================================================
echo               T I P S T E R   I A  -  I N S T A L A D O R
echo  ===============================================================
echo.
echo  Este script instala los paquetes Python necesarios para que
echo  funcionen todas las funciones del sistema, incluida la IA.
echo.
echo  ---------------------------------------------------------------
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

echo  [1/3] Activando entorno virtual...
call ".venv\Scripts\activate.bat"

echo  [2/3] Actualizando pip...
python -m pip install --upgrade pip

echo.
echo  [3/3] Instalando paquetes desde requirements.txt
echo        (esto incluye anthropic, google-generativeai, etc.)
echo.
pip install -r requirements.txt

echo.
echo  ---------------------------------------------------------------
if errorlevel 1 (
    echo   [ERROR] Algun paquete fallo al instalar.
    echo   Revisa los mensajes arriba en rojo.
    color 0C
) else (
    echo   [OK] Todos los paquetes instalados correctamente.
    echo.
    echo   Ahora puedes:
    echo     1. Editar D:\tipster\.env y agregar tu GOOGLE_API_KEY
    echo     2. Hacer doble click en "Tipster IA" del escritorio
    color 0A
)
echo  ---------------------------------------------------------------
echo.
pause
