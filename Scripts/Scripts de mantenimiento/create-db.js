const Firebird = require('node-firebird');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'DataBase');
const dbPath = path.join(dbDir, 'acosa.fdb');

// Crear directorio si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio creado:', dbDir);
}

// Usar la sintaxis firebird:// para conectar localmente
const connectionString = 'firebird://' + dbPath.replace(/\\/g, '/');

// Configuración Firebird - modo local
const fbConfig = {
  database: connectionString,
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: true,
  pageSize: 8192
};

console.log('📁 Ruta de BD:', dbPath);
console.log('🔄 Intentando conectar/crear con URI:', connectionString);

Firebird.attach(fbConfig, (err, db) => {
  if (err) {
    console.error('❌ Error Firebird:', err.message);
    console.error('Detalles:', err);
    
    // Intenta crear manualmente con fbembed
    console.log('\n🔧 Intentando crear DB con fbembed (embedded)...');
    const dbOptions = {
      database: dbPath,
      user: 'SYSDBA',
      password: 'masterkey',
      lowercase_keys: true,
      pageSize: 8192,
      libraries: 'fbembed'
    };
    
    Firebird.attach(dbOptions, (err2, db2) => {
      if (err2) {
        console.error('❌ fbembed también falló:', err2.message);
        process.exit(1);
      }
      console.log('✅ Conectado con fbembed');
      finalizar(db2);
    });
    return;
  }
  
  console.log('✅ Base de datos creada/conectada exitosamente');
  finalizar(db);
});

function finalizar(db) {
  console.log('📍 Ubicación: ' + dbPath);
  
  // Verificar que el archivo existe
  setTimeout(() => {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log('💾 Tamaño: ' + (stats.size / 1024).toFixed(2) + ' KB');
    }
    
    db.detach((detachErr) => {
      if (detachErr) console.error('Error desconectando:', detachErr);
      process.exit(0);
    });
  }, 500);
}
