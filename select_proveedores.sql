CONNECT 'DataBase\acosa.fdb' USER 'SYSDBA' PASSWORD 'masterkey';
SET LIST ON;
SELECT id, codigo, nombre, rfc, activo, fecha_registro FROM TBL_PROV_DFISCALES;
EXIT;
