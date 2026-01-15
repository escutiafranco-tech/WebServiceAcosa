@echo off
cd /d "%~dp0"
echo Creando base de datos Firebird...
echo.

SET DBPATH=%CD%\DataBase\acosa.fdb
SET ISQL="C:\Program Files\Firebird\Firebird_3_0\isql.exe"

echo Ruta DB: %DBPATH%
echo.

REM Crear SQL temporal
echo CREATE DATABASE '%DBPATH%'; > temp_create.sql

REM Ejecutar ISQL
%ISQL% -user SYSDBA -password masterkey -i temp_create.sql

REM Limpiar
del temp_create.sql

echo.
echo Listo!
pause
