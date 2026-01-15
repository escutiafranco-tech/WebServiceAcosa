@echo off
echo Creando base de datos acosa.fdb...
cd /d "%~dp0"
echo CREATE DATABASE 'DataBase\acosa.fdb' USER 'SYSDBA' PASSWORD 'masterkey'; | "C:\Program Files\Firebird\Firebird_3_0\isql.exe" -user SYSDBA -password masterkey
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Base de datos creada exitosamente en: %~dp0DataBase\acosa.fdb
) else (
    echo.
    echo Error al crear la base de datos. Codigo: %ERRORLEVEL%
)
pause
