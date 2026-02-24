const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ruta de la base SQLite que usa el servidor
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');

console.log('Usando base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR al abrir la base SQLite:', err.message);
    process.exit(1);
  }

  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err2, rows) => {
    if (err2) {
      console.error('ERROR al consultar sqlite_master:', err2.message);
      process.exit(1);
    }
    console.log('TABLAS EN SQLITE:');
    if (!rows || rows.length === 0) {
      console.log('(no hay tablas)');
    } else {
      for (const r of rows) {
        console.log('-', r.name);
      }
    }
    db.close();
  });
});
