const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Base de datos SQLite principal
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
console.log('Usando base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR al abrir la base SQLite:', err.message);
    process.exit(1);
  }

  db.run('PRAGMA foreign_keys = ON');

  const ddlStatements = [
    // Tabla de Productos y Servicios
    `CREATE TABLE IF NOT EXISTS TBL_PROD_SERVICIOS (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      NOMBRE VARCHAR(255) NOT NULL,
      DESCRIPCION TEXT,
      ACTIVO INTEGER DEFAULT 1,
      FECHA_REGISTRO VARCHAR(50)
    )`,

    // Tabla de relación Proveedor - Productos/Servicios
    `CREATE TABLE IF NOT EXISTS TBL_PROV_PROD_SERVICIOS (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      PROVEEDOR_ID VARCHAR(50) NOT NULL,
      PROD_SERVICIO_ID VARCHAR(50) NOT NULL,
      FECHA_ASIGNACION VARCHAR(50),
      FOREIGN KEY (PROVEEDOR_ID) REFERENCES TBL_PROV_DFISCALES(ID) ON DELETE CASCADE,
      FOREIGN KEY (PROD_SERVICIO_ID) REFERENCES TBL_PROD_SERVICIOS(ID) ON DELETE CASCADE,
      UNIQUE (PROVEEDOR_ID, PROD_SERVICIO_ID)
    )`
  ];

  (async () => {
    try {
      for (const sql of ddlStatements) {
        await new Promise((resolve, reject) => {
          db.run(sql, (err2) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      }
      console.log('Tablas de productos y servicios creadas/verificadas en SQLite:');
      console.log('- TBL_PROD_SERVICIOS');
      console.log('- TBL_PROV_PROD_SERVICIOS');
      
      // Insertar algunos datos de ejemplo si la tabla está vacía
      db.get('SELECT COUNT(*) AS cnt FROM TBL_PROD_SERVICIOS', (err, row) => {
        if (err) {
          console.error('Error verificando tabla:', err.message);
        } else if (row && row.cnt === 0) {
          const ejemplos = [
            ['SERV-0001', 'Flete', 'Servicio de transporte y flete de mercancías'],
            ['SERV-0002', 'Custodia', 'Servicio de almacenamiento y custodia de carga'],
            ['SERV-0003', 'Seguro', 'Cobertura de seguro de carga'],
            ['PROD-0001', 'Materia Prima A', 'Material para procesamiento'],
            ['PROD-0002', 'Materia Prima B', 'Material para ensamble']
          ];
          
          const insertStmt = db.prepare(
            'INSERT INTO TBL_PROD_SERVICIOS (ID, NOMBRE, DESCRIPCION, ACTIVO, FECHA_REGISTRO) VALUES (?, ?, ?, ?, ?)'
          );
          
          const today = new Date().toISOString().split('T')[0];
          ejemplos.forEach(([id, nombre, desc]) => {
            insertStmt.run([id, nombre, desc, 1, today]);
          });
          
          insertStmt.finalize(() => {
            console.log(`${ejemplos.length} registros de ejemplo insertados`);
          });
        }
      });
    } catch (e) {
      console.error('Error creando tablas:', e.message);
      process.exit(1);
    } finally {
      setTimeout(() => db.close(), 1000);
    }
  })();
});
