@echo off
cd /d "%~dp0"
echo Creando base de datos Firebird...
echo.
echo ⚠️  IMPORTANTE: Asegúrate de actualizar la contraseña en la siguiente línea
echo    o en Config\.env (variable FB_PASSWORD)
echo.

SET DBPATH=%CD%\DataBase\acosa.fdb
SET ISQL="C:\Program Files\Firebird\Firebird_3_0\isql.exe"
SET FB_PASSWORD=acosa_firebird_2026_secure

echo Ruta DB: %DBPATH%
echo.

REM Crear SQL temporal
echo CREATE DATABASE '%DBPATH%'; > temp_create.sql

REM Ejecutar ISQL
%ISQL% -user SYSDBA -password %FB_PASSWORD% -i temp_create.sql

REM Limpiar
del temp_create.sql

echo.
echo Listo!
pause
