@echo off
cd /d "%~dp0"
echo Creando tablas en acosa.fdb...
echo.

"C:\Program Files\Firebird\Firebird_3_0\isql.exe" -user SYSDBA -password masterkey -i create-tables.sql "DataBase\acosa.fdb"

echo.
echo Tablas creadas! Verifica en Excel ahora.
pause
