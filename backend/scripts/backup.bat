@echo off
setlocal

REM ========================================
REM Backup de Base de Datos - Banquito Solidario
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
set BACKUP_DIR=%~dp0..\backups
set TIMESTAMP=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\banquito_%TIMESTAMP%.sql

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo ========================================
echo  Banquito Solidario - Backup
echo ========================================
echo.
echo Base de datos: %DB_NAME%
echo Archivo: %BACKUP_FILE%
echo.

mysqldump -u %DB_USER% -p%DB_PASS% %DB_NAME% --single-transaction --routines --triggers > "%BACKUP_FILE%" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backup completado exitosamente.
    echo     Archivo: %BACKUP_FILE%
) else (
    echo [ERROR] Falló el backup. Verifique que MySQL esté corriendo.
)

echo.
pause
