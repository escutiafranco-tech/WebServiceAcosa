-- ⚠️ IMPORTANTE: Esta contraseña debe coincidir con FB_PASSWORD en Config/.env
-- Para cambiarla de forma segura:
--   1. Generar nueva contraseña: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
--   2. Actualizar FB_PASSWORD en Config/.env
--   3. Luego ejecutar este script
--
-- NUNCA comitear credenciales en control de versiones
CREATE DATABASE "DataBase\acosa.fdb" USER 'SYSDBA' PASSWORD 'acosa_firebird_2026_secure';
-- En producción, usar credenciales desde variables de entorno
