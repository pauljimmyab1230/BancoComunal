@echo off
setlocal

REM ========================================
REM Restaurar Base de Datos - Banquito Solidario
REM ========================================

set DB_NAME=banquito_solidario
set DB_USER=%DB_USER%
set DB_PASS=%DB_PASS%
if "%DB_USER%"=="" (
    echo [ERROR] Variable DB_USER no configurada. Ejecute: set DB_USER=root
    pause
    exit /b 1
)
if "%DB_PASS%"=="" (
    echo [ERROR] Variable DB_PASS no configurada. Ejecute: set DB_PASS=su_password
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Banquito Solidario - Restaurar Backup
echo ========================================
echo.

if "%~1"=="" (
    echo Arrastre un archivo .sql sobre este script para restaurarlo.
    echo O ejecute: restore.bat ruta\al\archivo.sql
    pause
    exit /b 1
)

set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo [ERROR] El archivo no existe: %BACKUP_FILE%
    pause
    exit /b 1
)

echo Archivo: %BACKUP_FILE%
echo Base de datos: %DB_NAME%
echo.
echo ADVERTENCIA: Esto reemplazará todos los datos actuales.
set /p CONFIRM="¿Continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Operación cancelada.
    pause
    exit /b 0
)

echo.
echo Restaurando...

mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%BACKUP_FILE%" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] Restauración completada exitosamente.
) else (
    echo [ERROR] Falló la restauración. Verifique el archivo y que MySQL esté corriendo.
)

echo.
pause
