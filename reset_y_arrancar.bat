@echo off
chcp 65001 >nul
title Tipster IA - Reset y arranque limpio
color 0E

echo.
echo  ===============================================================
echo            R E S E T   T O T A L   T I P S T E R
echo  ===============================================================
echo.

REM 1. Matar TODOS los procesos Python (servidor zombie)
echo  [1/4] Matando procesos Python colgados...
taskkill /F /IM python.exe >nul 2>nul
taskkill /F /IM pythonw.exe >nul 2>nul
timeout /t 2 /nobreak >nul

REM 2. Borrar cache de bytecode (.pyc)
echo  [2/4] Borrando cache de bytecode (__pycache__)...
cd /d "%~dp0"
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc >nul 2>nul

REM 3. Activar venv
echo  [3/4] Activando entorno virtual...
if not exist ".venv\Scripts\activate.bat" (
    echo  [ERROR] No se encuentra el entorno virtual.
    pause
    exit /b 1
)
call ".venv\Scripts\activate.bat"

REM 4. Arrancar servidor
echo  [4/4] Arrancando servidor con codigo FRESCO...
echo.
color 0A
echo  ---------------------------------------------------------------
echo   Servidor en: http://localhost:8000
echo   El navegador se abrira en 5 segundos
echo   Para detener: cierra esta ventana o Ctrl+C
echo  ---------------------------------------------------------------
echo.

start "" /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:8000"

uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

echo.
echo  Servidor detenido.
pause
