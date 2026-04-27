const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'Database', 'acosa_local.db'));

// Ver estructura de USERS
db.all("PRAGMA table_info(USERS)", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  } else {
    console.log('Estructura de tabla USERS:');
    rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type}`);
    });
  }
  db.close();
});
