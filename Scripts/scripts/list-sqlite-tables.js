const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
console.log('Usando base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo SQLite:', err.message);
    process.exit(1);
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, rows) => {
  if (err) {
    console.error('Error listando tablas:', err.message);
    process.exit(1);
  }
  console.log('Tablas en SQLite:');
  rows.forEach(r => console.log('-', r.name));
  db.close();
});
