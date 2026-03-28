const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'Database', 'acosa_local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  // Obtener estructura de tabla
  db.all('PRAGMA table_info(TBL_PROV_DFISCALES)', [], (err, rows) => {
    if (err) {
      console.error('Error al obtener estructura:', err.message);
    } else {
      console.log('\n=== ESTRUCTURA TBL_PROV_DFISCALES ===\n');
      console.log('Columnas:');
      rows.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
    }
    
    // Obtener un registro de ejemplo
    db.get('SELECT * FROM TBL_PROV_DFISCALES LIMIT 1', [], (err, row) => {
      if (!err && row) {
        console.log('\n=== DATOS DE EJEMPLO ===\n');
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      }
      db.close();
    });
  });
});
