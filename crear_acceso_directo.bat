@echo off
chcp 65001 >nul
title Crear acceso directo en escritorio

echo.
echo  Creando acceso directo "Tipster IA" en tu escritorio...
echo.

set "TARGET=%~dp0start_tipster.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Tipster IA.lnk"
set "WORKDIR=%~dp0"
set "ICON=%SystemRoot%\System32\imageres.dll,99"

powershell -NoProfile -Command "$s = (New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%WORKDIR%'; $s.IconLocation = '%ICON%'; $s.Description = 'Iniciar Tipster IA - sistema de apuestas con IA'; $s.WindowStyle = 1; $s.Save()"

if exist "%SHORTCUT%" (
    echo  [OK] Acceso directo creado en tu escritorio.
    echo.
    echo  Ahora puedes hacer doble click en "Tipster IA" en el escritorio
    echo  y la app arrancara sola, abriendo el navegador automaticamente.
) else (
    echo  [ERROR] No se pudo crear el acceso directo.
    echo  Verifica que tienes permisos en %USERPROFILE%\Desktop
)

echo.
pause
