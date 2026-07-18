@echo off
REM ============================================================================
REM  medir-abuso-y-uso.bat -- Baja los datos de Firebase y muestra:
REM    1) Reciclaje de trials (misma laptop/red, varias cuentas)  -> hoy mismo
REM    2) Telemetria de uso (que funciones, trial vs pago, elementos)
REM       -> se llena cuando los usuarios usen la version instrumentada.
REM
REM  Requisitos: Node + firebase-tools logueado (npx firebase-tools login).
REM  Uso: doble clic.
REM ============================================================================
setlocal
cd /d "%~dp0\.."

set "U=%TEMP%\bims_users.json"
set "E=%TEMP%\bims_usage.json"

echo.
echo [1/2] Descargando datos de Firebase...
call npx --yes firebase-tools@latest database:get /users_v2 --project bims-8d507 --instance bims-8d507-default-rtdb > "%U%"
call npx --yes firebase-tools@latest database:get /usage_events --project bims-8d507 --instance bims-8d507-default-rtdb > "%E%"

echo [2/2] Reportes...
echo.
node scripts\reciclaje-report.mjs "%U%"
echo.
node scripts\uso-report.mjs "%E%"

del "%U%" >nul 2>&1
del "%E%" >nul 2>&1
echo.
pause
endlocal
