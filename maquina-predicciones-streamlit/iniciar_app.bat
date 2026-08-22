@echo off
chcp 65001 >nul
title Maquina de Predicciones de Futbol
color 0A

REM ---- Posicionarse en la carpeta del .bat ----
cd /d "%~dp0"

echo ============================================================
echo   MAQUINA DE PREDICCIONES DE FUTBOL
echo   Iniciando aplicacion...
echo ============================================================
echo.

REM ---- Verificar que Python esta instalado ----
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    echo.
    echo Descargalo desde: https://www.python.org/downloads/
    echo IMPORTANTE: durante la instalacion marca la casilla
    echo             "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

REM ---- Crear entorno virtual si no existe ----
if not exist ".venv\Scripts\activate.bat" (
    echo [SETUP] Primera ejecucion: creando entorno virtual...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado.
    echo.
)

REM ---- Activar entorno ----
call .venv\Scripts\activate.bat

REM ---- Instalar/actualizar dependencias si falta streamlit ----
python -c "import streamlit" 2>nul
if errorlevel 1 (
    echo [SETUP] Instalando dependencias por primera vez...
    echo Esto puede tardar 1-3 minutos. Sirve cafe.
    echo.
    pip install --upgrade pip
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente.
    echo.
)

REM ---- Verificar que existe el archivo de claves ----
if not exist ".streamlit\secrets.toml" (
    echo [AVISO] Falta el archivo de claves API.
    echo.
    echo Voy a crear .streamlit\secrets.toml a partir del ejemplo.
    echo Despues ABRELO con el bloc de notas y pega tus claves de:
    echo   - GEMINI:    https://aistudio.google.com/app/apikey
    echo   - RAPIDAPI:  https://rapidapi.com/api-sports/api/api-football
    echo.
    copy ".streamlit\secrets.toml.example" ".streamlit\secrets.toml" >nul
    notepad ".streamlit\secrets.toml"
    echo.
    echo Guarda el archivo, cierra el bloc de notas y pulsa una tecla...
    pause >nul
)

REM ---- Lanzar Streamlit (abre el navegador automaticamente) ----
echo.
echo ============================================================
echo   Arrancando servidor Streamlit...
echo   Tu navegador se abrira solo en unos segundos.
echo   Para CERRAR la app: pulsa Ctrl+C aqui o cierra esta ventana.
echo ============================================================
echo.

streamlit run app.py

REM ---- Si Streamlit cae, no cierres la ventana inmediatamente ----
echo.
echo La app se ha detenido.
pause
