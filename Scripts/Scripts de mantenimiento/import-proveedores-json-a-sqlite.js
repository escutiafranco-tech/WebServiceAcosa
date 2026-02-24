const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ruta a la BD local (la misma que usa server.js)
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
const jsonPath = path.join(__dirname, '..', '..', 'Backend', 'catalogos', 'proveedores.json');

console.log('Usando base de datos:', dbPath);
console.log('Leyendo catálogo JSON desde:', jsonPath);

if (!fs.existsSync(jsonPath)) {
  console.error('No se encontró proveedores.json en', jsonPath);
  process.exit(1);
}

const raw = fs.readFileSync(jsonPath, 'utf8');
const json = JSON.parse(raw);
const proveedores = json.proveedores || [];

if (!proveedores.length) {
  console.log('No hay proveedores en el JSON para importar.');
  process.exit(0);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS TBL_PROV_DFISCALES (
    ID TEXT PRIMARY KEY,
    CODIGO TEXT,
    NOMBRE TEXT,
    RFC TEXT,
    DIRECCION TEXT,
    ACTIVO INTEGER,
    FECHA_REGISTRO TEXT
  )`);

  const stmt = db.prepare(`INSERT OR REPLACE INTO TBL_PROV_DFISCALES
    (ID, CODIGO, NOMBRE, RFC, DIRECCION, ACTIVO, FECHA_REGISTRO)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  proveedores.forEach((p) => {
    const id = p.codigo || String(p.id);
    const codigo = p.codigo || String(p.id);
    const nombre = p.nombre || '';
    const rfc = p.rfc || '';
    const direccion = p.direccion ? JSON.stringify(p.direccion) : '';
    const activo = p.activo ? 1 : 0;
    const fecha = p.fecha_registro || new Date().toISOString();

    console.log(`Importando proveedor ${codigo} (${nombre})`);
    stmt.run(id, codigo, nombre, rfc, direccion, activo, fecha);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('Error al finalizar inserciones:', err.message);
    } else {
      console.log('Importación completada correctamente.');
    }
    db.close();
  });
});
