@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  medir-activacion.bat — Descarga los usuarios de Firebase y muestra el
REM  reporte de activación (cuántos se registran y nunca llegan a instalar).
REM
REM  Sirve para decidir con datos si compensa comprar el certificado de firma
REM  de código (~$139/año) que reduce el bloqueo de SmartScreen.
REM
REM  Requisitos: Node instalado y `firebase-tools` logueado
REM              (npx firebase-tools login  → una sola vez).
REM
REM  Uso:
REM     medir-activacion.bat                       (todo el histórico)
REM     medir-activacion.bat 2026-07-13            (solo desde esa fecha)
REM
REM  Pásale la fecha de publicación en el Autodesk App Store para medir
REM  exclusivamente el efecto de ese canal.
REM ─────────────────────────────────────────────────────────────────────────────
setlocal
cd /d "%~dp0\.."

set "DUMP=%TEMP%\bims_users.json"

echo.
echo [1/2] Descargando usuarios desde Firebase...
call npx --yes firebase-tools@latest database:get /users_v2 --project bims-8d507 --instance bims-8d507-default-rtdb > "%DUMP%"
if errorlevel 1 (
    echo.
    echo ERROR: no se pudo leer Firebase. Ejecuta:  npx firebase-tools login
    exit /b 1
)

echo [2/2] Generando reporte...
if "%~1"=="" (
    node scripts\activation-report.mjs "%DUMP%"
) else (
    node scripts\activation-report.mjs "%DUMP%" --desde %1
)

del "%DUMP%" >nul 2>&1
endlocal
