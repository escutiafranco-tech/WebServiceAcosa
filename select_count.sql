-- ⚠️ IMPORTANTE: Cambiar 'masterkey' por el valor de FB_PASSWORD en Config/.env
-- Para modo interactivo, sustituir manualmente o usar desde una herramienta que lea variables de entorno
CONNECT 'DataBase\acosa.fdb' USER 'SYSDBA' PASSWORD 'acosa_firebird_2026_secure';
SET LIST ON;
SELECT COUNT(*) AS TOTAL FROM TBL_PROV_DFISCALES;
EXIT;
