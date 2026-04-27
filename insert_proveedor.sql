-- ⚠️ IMPORTANTE: Cambiar 'masterkey' por el valor de FB_PASSWORD en Config/.env
-- Para modo interactivo, sustituir manualmente o usar desde una herramienta que lea variables de entorno
CONNECT 'DataBase\acosa.fdb' USER 'SYSDBA' PASSWORD 'acosa_firebird_2026_secure';
INSERT INTO TBL_PROV_DFISCALES (ID, CODIGO, NOMBRE, RFC, DIRECCION, ACTIVO, FECHA_REGISTRO) VALUES ('prov-001','P001','Proveedor Prueba','RFC123','Direccion de prueba',1,'2026-01-14');
COMMIT;
EXIT;
