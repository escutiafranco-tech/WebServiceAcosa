const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'Database', 'acosa_local.db'));

async function migratePasswordColumn() {
  return new Promise((resolve, reject) => {
    // 1. Agregar columna password_hash si no existe
    db.run("ALTER TABLE USERS ADD COLUMN password_hash TEXT DEFAULT NULL", (err) => {
      if (err && err.message.includes('duplicate column')) {
        console.log('✅ Columna password_hash ya existe');
        resolve();
      } else if (err) {
        console.error('Error agregando columna:', err);
        reject(err);
      } else {
        console.log('✅ Columna password_hash agregada');
        resolve();
      }
    });
  });
}

async function hashExistingPasswords() {
  return new Promise((resolve, reject) => {
    // 2. Leer todos los usuarios con password en texto plano
    db.all("SELECT id, password FROM USERS WHERE password_hash IS NULL", [], async (err, rows) => {
      if (err) {
        console.error('Error leyendo usuarios:', err);
        reject(err);
        return;
      }

      if (!rows || rows.length === 0) {
        console.log('✅ No hay contraseñas para hashear');
        resolve();
        return;
      }

      console.log(`📝 Encontrados ${rows.length} usuarios para migrar...`);

      // 3. Hashear cada contraseña y actualizar
      let completed = 0;
      for (const row of rows) {
        try {
          const hash = await new Promise((res, rej) => {
            bcrypt.hash(row.password, 10, (err, hash) => {
              if (err) rej(err);
              else res(hash);
            });
          });

          await new Promise((res, rej) => {
            db.run(
              "UPDATE USERS SET password_hash = ? WHERE id = ?",
              [hash, row.id],
              (err) => {
                if (err) rej(err);
                else res();
              }
            );
          });

          completed++;
          console.log(`  ✅ ${completed}/${rows.length} usuarios actualizados`);
        } catch (err) {
          console.error(`❌ Error migrando usuario ${row.id}:`, err);
          reject(err);
          return;
        }
      }

      resolve();
    });
  });
}

async function removeOldPasswordColumn() {
  return new Promise((resolve, reject) => {
    // 4. Opcional: Eliminar columna password antigua (SQLite no permite DROP COLUMN fácilmente)
    console.log('⚠️  Columna "password" antigua se mantiene (no se puede eliminar en SQLite sin recrear tabla)');
    resolve();
  });
}

async function main() {
  try {
    console.log('🔄 Iniciando migración de contraseñas...\n');
    
    await migratePasswordColumn();
    await hashExistingPasswords();
    await removeOldPasswordColumn();
    
    console.log('\n✅ Migración completada exitosamente');
    db.close();
  } catch (err) {
    console.error('\n❌ Error durante migración:', err.message);
    db.close();
    process.exit(1);
  }
}

main();
