const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
console.log('Usando base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR al abrir la base SQLite:', err.message);
    process.exit(1);
  }

  db.all("SELECT name, seq FROM sqlite_sequence ORDER BY name", [], (err2, rows) => {
    if (err2) {
      console.error('ERROR al leer sqlite_sequence:', err2.message);
      process.exit(1);
    }
    console.log('Contenido de sqlite_sequence:');
    if (!rows || rows.length === 0) {
      console.log('(vacío, no hay autoincrements usados)');
    } else {
      for (const r of rows) {
        console.log(`- tabla=${r.name}, ultimo_id=${r.seq}`);
      }
    }
    db.close();
  });
});
