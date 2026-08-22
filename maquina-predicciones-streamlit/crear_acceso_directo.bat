@echo off
chcp 65001 >nul
title Crear acceso directo en el escritorio
color 0B

cd /d "%~dp0"

echo ============================================================
echo   CREAR ACCESO DIRECTO EN EL ESCRITORIO
echo ============================================================
echo.
echo Voy a crear un icono en tu Escritorio llamado:
echo   "Maquina Predicciones Futbol"
echo.
echo Con doble clic en ese icono se abrira la app.
echo.
pause

REM ---- Crear el .lnk con PowerShell ----
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Maquina Predicciones Futbol.lnk'); ^
   $sc.TargetPath        = '%~dp0iniciar_app.bat'; ^
   $sc.WorkingDirectory  = '%~dp0'; ^
   $sc.IconLocation      = 'imageres.dll,76'; ^
   $sc.Description       = 'Maquina de Predicciones de Futbol con IA (Gemini + Poisson)'; ^
   $sc.WindowStyle       = 1; ^
   $sc.Save()"

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo crear el acceso directo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   LISTO
echo ============================================================
echo.
echo Mira tu Escritorio. Ya tienes el icono:
echo   "Maquina Predicciones Futbol"
echo.
echo Doble clic = abrir la app.
echo.
echo Esta ventana se cerrara en 5 segundos...
timeout /t 5 >nul
exit
