const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Base de datos SQLite principal que usa el servidor
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
console.log('Usando base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('ERROR al abrir la base SQLite:', err.message);
    process.exit(1);
  }

  // Asegurar que las llaves foráneas estén activadas
  db.run('PRAGMA foreign_keys = ON');

  const ddlStatements = [
    // Tabla principal de clientes (datos fiscales)
    `CREATE TABLE IF NOT EXISTS TLB_CLIE_DFISCALES (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      CODIGO VARCHAR(50),
      NOMBRE VARCHAR(255),
      RFC VARCHAR(50),
      DIRECCION TEXT,
      ACTIVO INTEGER,
      FECHA_REGISTRO VARCHAR(50)
    )`,

    // Tabla de servicios asociados a clientes
    `CREATE TABLE IF NOT EXISTS TLB_CLIE_DSERVICIOS (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CLIENTE_ID VARCHAR(50) NOT NULL,
      SERVICIO VARCHAR(255),
      DESCRIPCION TEXT,
      FOREIGN KEY (CLIENTE_ID) REFERENCES TLB_CLIE_DFISCALES(ID) ON DELETE CASCADE
    )`,

    // Tabla de sucursales/domicilios de clientes
    `CREATE TABLE IF NOT EXISTS TLB_CLIE_DSUCURSALES (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      CLIENTE_ID VARCHAR(50) NOT NULL,
      TIPO VARCHAR(50),
      NOMBRE VARCHAR(255),
      PAIS VARCHAR(100),
      ESTADO VARCHAR(100),
      MUNICIPIO VARCHAR(100),
      LOCALIDAD VARCHAR(100),
      CALLE VARCHAR(255),
      COLONIA VARCHAR(255),
      CP VARCHAR(20),
      NO_EXTERIOR VARCHAR(50),
      NO_INTERIOR VARCHAR(50),
      CODIGO_COLONIA VARCHAR(50),
      CODIGO_LOCALIDAD VARCHAR(50),
      FOREIGN KEY (CLIENTE_ID) REFERENCES TLB_CLIE_DFISCALES(ID) ON DELETE CASCADE
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
      console.log('Tablas de clientes creadas/verificadas en SQLite:');
      console.log('- TLB_CLIE_DFISCALES');
      console.log('- TLB_CLIE_DSERVICIOS');
      console.log('- TLB_CLIE_DSUCURSALES');
    } catch (e) {
      console.error('Error creando tablas de clientes:', e.message);
      process.exit(1);
    } finally {
      db.close();
    }
  })();
});
