// Script para crear la base de datos Firebird usando fbembed.dll (embedded)
const odbc = require('odbc');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'Config', '.env') });

const dbDir = path.join(__dirname, 'DataBase');
const dbPath = path.join(dbDir, 'acosa.fdb');

// Crear directorio si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio creado:', dbDir);
}

// Cadena de conexión para Firebird ODBC
const fbUser = process.env.FB_USER || 'SYSDBA';
const fbPassword = process.env.FB_PASSWORD || 'acosa_firebird_2026_secure';
const connectionString = 'Driver={Firebird/InterBase(r) driver};dbname=' + dbPath + ';user=' + fbUser + ';password=' + fbPassword + ';';

console.log('📁 Ruta de BD:', dbPath);
console.log('🔄 Intentando crear base de datos con ODBC...');
console.log('📋 Conexión:', connectionString);

odbc.connect(connectionString, function(err, conn) {
  if (err) {
    console.error('❌ Error ODBC:', err.message);
    console.log('Alternativa: Usa firebird:// URL scheme');
    
    // Intenta usar Firebird de forma embebida
    try {
      const spawn = require('child_process').spawn;
      const gsec = spawn('"C:\\Program Files\\Firebird\\Firebird_3_0\\bin\\gsec.exe"', [
        '-user', fbUser,
        '-password', fbPassword,
        '-database', dbPath,
        '-add', 'test',
        '-pw', 'test'
      ]);
      
      gsec.on('close', (code) => {
        console.log('Comando gsec finalizado con código:', code);
      });
    } catch (e) {
      console.error('Error intentando gsec:', e.message);
    }
    
    process.exit(1);
  }

  console.log('✅ Conexión ODBC exitosa');
  
  // Verificar que el archivo existe
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log('💾 Tamaño: ' + (stats.size / 1024).toFixed(2) + ' KB');
  }

  conn.close(function(err) {
    if (err) console.error('Error cerrando conexión:', err);
    process.exit(0);
  });
});
