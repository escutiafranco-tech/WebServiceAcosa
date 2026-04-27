/**
 * SCRIPT DE MIGRACIÓN: Convertir contraseñas de texto plano a hash bcryptjs
 * 
 * Uso: node migrate-to-password-hash.js
 * 
 * ADVERTENCIA: 
 * - Este script modifica la base de datos
 * - Crea respaldo de BD antes de ejecutar
 * - Ejecutar SOLO UNA VEZ
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Ruta a base de datos
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');

console.log('🔐 MIGRACIÓN: Contraseñas texto plano → hash bcryptjs');
console.log('📁 Base de datos:', dbPath);
console.log('');

// Conexión
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando BD:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a BD');
  migrate();
});

async function migrate() {
  try {
    // 1. Verificar si la tabla tiene la columna 'password_hash'
    console.log('\n📋 Verificando estructura de tabla USERS...');
    
    db.all("PRAGMA table_info(USERS)", [], (err, columns) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        process.exit(1);
      }

      const hasHashColumn = columns.some(col => col.name === 'password_hash');
      const hasOldPasswordColumn = columns.some(col => col.name === 'password');

      if (!hasHashColumn) {
        console.log('⚠️  Columna password_hash no existe. Creando...');
        db.run(
          'ALTER TABLE USERS ADD COLUMN password_hash TEXT',
          (addErr) => {
            if (addErr) {
              console.error('❌ Error agregando columna:', addErr.message);
              db.close();
              process.exit(1);
            }
            console.log('✅ Columna password_hash creada');
            migratePasswords(hasOldPasswordColumn);
          }
        );
      } else {
        console.log('✅ Columna password_hash ya existe');
        migratePasswords(hasOldPasswordColumn);
      }
    });

  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    db.close();
    process.exit(1);
  }
}

async function migratePasswords(hasOldPasswordColumn) {
  try {
    // 2. Obtener todos los usuarios
    console.log('\n🔍 Obteniendo usuarios...');
    
    db.all('SELECT id, username, password FROM USERS', [], async (err, users) => {
      if (err) {
        console.error('❌ Error obteniendo usuarios:', err.message);
        db.close();
        process.exit(1);
      }

      if (users.length === 0) {
        console.log('⚠️  No hay usuarios para migrar');
        db.close();
        process.exit(0);
      }

      console.log(`📊 Encontrados ${users.length} usuario(s)`);

      let migrated = 0;
      let skipped = 0;

      // 3. Iterar usuarios y hashear contraseñas
      for (const user of users) {
        try {
          // Verificar si ya tiene hash
          db.get(
            'SELECT password_hash FROM USERS WHERE id = ?',
            [user.id],
            async (getErr, row) => {
              if (getErr) {
                console.error(`❌ Error verificando ${user.username}:`, getErr.message);
                return;
              }

              // Si ya tiene hash, saltar
              if (row && row.password_hash) {
                console.log(`⏭️  ${user.username}: ya tiene hash (saltado)`);
                skipped++;
                return;
              }

              // Hashear contraseña antigua
              try {
                const hash = await bcrypt.hash(user.password, 10);
                
                // Actualizar BD
                db.run(
                  'UPDATE USERS SET password_hash = ? WHERE id = ?',
                  [hash, user.id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error(`❌ Error actualizando ${user.username}:`, updateErr.message);
                    } else {
                      console.log(`✅ ${user.username}: contraseña hasheada`);
                      migrated++;
                    }
                  }
                );
              } catch (bcryptErr) {
                console.error(`❌ Error hasheando ${user.username}:`, bcryptErr.message);
              }
            }
          );

        } catch (err) {
          console.error(`❌ Error procesando ${user.username}:`, err.message);
        }
      }

      // Esperar un poco antes de finalizar
      setTimeout(() => {
        console.log('\n📊 RESULTADO:');
        console.log(`✅ Migrados: ${migrated}`);
        console.log(`⏭️  Saltados: ${skipped}`);
        
        if (hasOldPasswordColumn) {
          console.log('\n⚠️  PRÓXIMO PASO: Eliminar columna "password" antigua');
          console.log('   Si la migración fue exitosa, ejecutar:');
          console.log('   ALTER TABLE USERS DROP COLUMN password;');
        }

        db.close();
        console.log('\n✅ Migración completada');
        process.exit(0);
      }, 1000);
    });

  } catch (err) {
    console.error('❌ Error en migratePasswords:', err.message);
    db.close();
    process.exit(1);
  }
}

// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err.message);
  db.close();
  process.exit(1);
});
