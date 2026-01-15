require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const Firebird = require('node-firebird');
// Modo de desarrollo local: usar SQLite si se define USE_SQLITE=true en .env
const useSqlite = process.env.USE_SQLITE === 'true';
let sqliteDb = null;
if (useSqlite) {
  const sqlite3 = require('sqlite3').verbose();
  const sqlitePath = path.join(__dirname, 'DataBase', 'acosa_local.db');
  // asegurar directorio
  const dbDir = path.dirname(sqlitePath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  sqliteDb = new sqlite3.Database(sqlitePath);
  // crear tablas si no existen (DDL compatible SQLite)
  sqliteDb.serialize(() => {
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS TBL_PROV_DFISCALES (
      ID TEXT PRIMARY KEY,
      CODIGO TEXT,
      NOMBRE TEXT,
      RFC TEXT,
      DIRECCION TEXT,
      ACTIVO INTEGER,
      FECHA_REGISTRO TEXT
    )`);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS TBL_PROV_DSERVICIOS (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      PROVEEDOR_ID TEXT NOT NULL,
      SERVICIO TEXT,
      DESCRIPCION TEXT
    )`);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS TBL_PROV_DSUCURSALES (
      ID TEXT PRIMARY KEY,
      PROVEEDOR_ID TEXT NOT NULL,
      TIPO TEXT,
      NOMBRE TEXT,
      PAIS TEXT,
      ESTADO TEXT,
      MUNICIPIO TEXT,
      LOCALIDAD TEXT,
      CALLE TEXT,
      COLONIA TEXT,
      CP TEXT,
      NO_EXTERIOR TEXT,
      NO_INTERIOR TEXT,
      CODIGO_COLONIA TEXT,
      CODIGO_LOCALIDAD TEXT
    )`);
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS TBL_PROV_DAGENDA (
      ID TEXT PRIMARY KEY,
      PROVEEDOR_ID TEXT NOT NULL,
      AREA TEXT,
      NOMBRE TEXT,
      TELEFONO TEXT,
      EXT TEXT,
      CORREO TEXT,
      DATO1 TEXT,
      DATO2 TEXT
    )`);
  });
}

const app = express();

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ SERVIR ARCHIVOS ESTÁTICOS DE modules
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// ✅ SERVIR ARCHIVOS JSON
app.use('/data', express.static(path.join(__dirname, 'data')));
 
// Configuración Firebird
const fbConfig = {
  host: process.env.FB_HOST || 'localhost',
  port: parseInt(process.env.FB_PORT || '3050', 10),
  database: process.env.FB_DB || path.join(__dirname, 'DataBase', 'acosa.fdb'),
  user: process.env.FB_USER || 'SYSDBA',
  password: process.env.FB_PASSWORD || 'masterkey',
  lowercase_keys: true,
  role: null,
  pageSize: 8192,
  createDatabase: true
};

let fbPool = null;
if (!useSqlite) {
  const fbPoolSize = parseInt(process.env.FB_POOL_SIZE || '10', 10);
  fbPool = Firebird.pool(fbPoolSize, fbConfig);
}

function runQuery(sql, params = []) {
  if (useSqlite && sqliteDb) {
    // Adaptar algunas consultas MERGE/RETURNING a SQLite
    const upSql = sql.trim().toUpperCase();
    return new Promise((resolve, reject) => {
      try {
        if (upSql.startsWith('SELECT')) {
          sqliteDb.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
          return;
        }

        if (upSql.startsWith('MERGE INTO TBL_PROV_DFISCALES')) {
          // params: [id, codigo, nombre, rfc, direccion, activo, fecha_registro, id, codigo, ...]
          const half = Math.floor(params.length / 2);
          const p = params.slice(half);
          const insert = `INSERT INTO TBL_PROV_DFISCALES (id,codigo,nombre,rfc,direccion,activo,fecha_registro) VALUES (?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET codigo=excluded.codigo, nombre=excluded.nombre, rfc=excluded.rfc, direccion=excluded.direccion, activo=excluded.activo, fecha_registro=excluded.fecha_registro`;
          sqliteDb.run(insert, p, function(err) { if (err) return reject(err); resolve([]); });
          return;
        }

        if (upSql.startsWith('MERGE INTO TBL_PROV_DSUCURSALES')) {
          const half = Math.floor(params.length / 2);
          const p = params.slice(half);
          const insert = `INSERT INTO TBL_PROV_DSUCURSALES (id,proveedor_id,tipo,nombre,pais,estado,municipio,localidad,calle,colonia,cp,no_exterior,no_interior,codigo_colonia,codigo_localidad)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET proveedor_id=excluded.proveedor_id,tipo=excluded.tipo,nombre=excluded.nombre,pais=excluded.pais,estado=excluded.estado,municipio=excluded.municipio,localidad=excluded.localidad,calle=excluded.calle,colonia=excluded.colonia,cp=excluded.cp,no_exterior=excluded.no_exterior,no_interior=excluded.no_interior,codigo_colonia=excluded.codigo_colonia,codigo_localidad=excluded.codigo_localidad`;
          sqliteDb.run(insert, p, function(err) { if (err) return reject(err); resolve([]); });
          return;
        }

        if (upSql.startsWith('MERGE INTO TBL_PROV_DAGENDA')) {
          const half = Math.floor(params.length / 2);
          const p = params.slice(half);
          const insert = `INSERT INTO TBL_PROV_DAGENDA (id,proveedor_id,area,nombre,telefono,ext,correo,dato1,dato2) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET proveedor_id=excluded.proveedor_id,area=excluded.area,nombre=excluded.nombre,telefono=excluded.telefono,ext=excluded.ext,correo=excluded.correo,dato1=excluded.dato1,dato2=excluded.dato2`;
          sqliteDb.run(insert, p, function(err) { if (err) return reject(err); resolve([]); });
          return;
        }

        // INSERT INTO TBL_PROV_DSERVICIOS ... RETURNING id
        if (upSql.startsWith('INSERT INTO TBL_PROV_DSERVICIOS')) {
          // remove RETURNING id if present
          const clean = sql.replace(/RETURNING\s+id/i, '');
          sqliteDb.run(clean, params, function(err) { if (err) return reject(err); resolve([{ id: this.lastID }]); });
          return;
        }

        // Fallback: run as statement
        sqliteDb.run(sql, params, function(err) { if (err) return reject(err); resolve([]); });
      } catch (e) { reject(e); }
    });
  }

  // Firebird (por defecto)
  return new Promise((resolve, reject) => {
    fbPool.get((err, db) => {
      if (err) return reject(err);
      db.query(sql, params, (err2, result) => {
        db.detach();
        if (err2) return reject(err2);
        resolve(result);
      });
    });
  });
}

async function ensureSchema() {
  const ddlStatements = [
    `CREATE TABLE TBL_PROV_DFISCALES (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      CODIGO VARCHAR(50),
      NOMBRE VARCHAR(255),
      RFC VARCHAR(50),
      DIRECCION BLOB SUB_TYPE TEXT,
      ACTIVO SMALLINT,
      FECHA_REGISTRO VARCHAR(50)
    )`,
    `CREATE TABLE TBL_PROV_DSERVICIOS (
      ID INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      PROVEEDOR_ID VARCHAR(50) NOT NULL,
      SERVICIO VARCHAR(255),
      DESCRIPCION BLOB SUB_TYPE TEXT,
      CONSTRAINT FK_DSERVICIOS_PROV FOREIGN KEY (PROVEEDOR_ID) REFERENCES TBL_PROV_DFISCALES(ID) ON DELETE CASCADE
    )`,
    `CREATE TABLE TBL_PROV_DSUCURSALES (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      PROVEEDOR_ID VARCHAR(50) NOT NULL,
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
      CONSTRAINT FK_DSUCURSALES_PROV FOREIGN KEY (PROVEEDOR_ID) REFERENCES TBL_PROV_DFISCALES(ID) ON DELETE CASCADE
    )`,
    `CREATE TABLE TBL_PROV_DAGENDA (
      ID VARCHAR(50) NOT NULL PRIMARY KEY,
      PROVEEDOR_ID VARCHAR(50) NOT NULL,
      AREA VARCHAR(100),
      NOMBRE VARCHAR(255),
      TELEFONO VARCHAR(50),
      EXT VARCHAR(20),
      CORREO VARCHAR(150),
      DATO1 VARCHAR(255),
      DATO2 VARCHAR(255),
      CONSTRAINT FK_DAGENDA_PROV FOREIGN KEY (PROVEEDOR_ID) REFERENCES TBL_PROV_DFISCALES(ID) ON DELETE CASCADE
    )`
  ];

    // Agregar tabla de catálogo de servicios (MODULO / SUBMODULO)
    ddlStatements.push(`CREATE TABLE TBL_SERVICIOS_CATALOGO (
      ID INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      MODULO VARCHAR(100),
      SUBMODULO VARCHAR(100)
    )`);

  for (const sql of ddlStatements) {
    try {
      await runQuery(sql);
    } catch (err) {
      // Firebird lanza error si la tabla existe; lo ignoramos para mantener idempotencia
      if (!`${err.message}`.toLowerCase().includes('already exist')) {
        console.error('Error creando tabla:', err.message);
      }
    }
  }

  // Asegurar que TBL_PROV_DSERVICIOS tenga columna CATALOGO_ID (nullable)
  try {
    await runQuery('ALTER TABLE TBL_PROV_DSERVICIOS ADD CATALOGO_ID INTEGER');
  } catch (err) {
    // Ignorar si ya existe o si la DB no soporta ALTER en este modo
  }

  // Sembrar catálogo de servicios si está vacío
  try {
    const cnt = await runQuery('SELECT COUNT(*) AS CNT FROM TBL_SERVICIOS_CATALOGO');
    const total = Array.isArray(cnt) ? (cnt[0]?.CNT || cnt[0]?.cnt || 0) : (cnt.CNT || 0);
    if (parseInt(total, 10) === 0) {
      const seeds = [
        ['LOGISTICA','CUSTODIAS'],
        ['LOGISTICA','FLETES'],
        ['LOGISTICA','SEGURO'],
        ['LOGISTICA','ADUANA']
      ];
      for (const s of seeds) {
        await runQuery('INSERT INTO TBL_SERVICIOS_CATALOGO (MODULO, SUBMODULO) VALUES (?, ?)', s);
      }
    }
  } catch (err) {
    // algunos drivers retornan estructuras distintas; ignorar errores no críticos
  }
  console.log(`Tablas de proveedores verificadas en ${useSqlite ? 'SQLite' : 'Firebird'}`);
}

ensureSchema().catch((e) => console.error('Error inicializando esquema:', e.message));

// Rutas
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);

// ==========================================
// RUTAS API: DATOS FISCALES (Tabla Principal)
// ==========================================
app.get('/api/proveedores', async (req, res) => {
  try {
    const rows = await runQuery('SELECT id, codigo, nombre, rfc, direccion, activo, fecha_registro FROM TBL_PROV_DFISCALES');
    const mapped = rows.map((row) => ({
      ...row,
      activo: row.activo === 1
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/proveedores', async (req, res) => {
  const { id, codigo, nombre, rfc, direccion, activo, fecha_registro } = req.body;
  const mergeSql = `
    MERGE INTO TBL_PROV_DFISCALES tgt
    USING (SELECT ? AS id FROM RDB$DATABASE) src
      ON (tgt.id = src.id)
    WHEN MATCHED THEN
      UPDATE SET codigo = ?, nombre = ?, rfc = ?, direccion = ?, activo = ?, fecha_registro = ?
    WHEN NOT MATCHED THEN
      INSERT (id, codigo, nombre, rfc, direccion, activo, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id, codigo, nombre, rfc, direccion, activo ? 1 : 0, fecha_registro,
    id, codigo, nombre, rfc, direccion, activo ? 1 : 0, fecha_registro
  ];

  try {
    await runQuery(mergeSql, params);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/proveedores/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM TBL_PROV_DFISCALES WHERE id = ?', [req.params.id]);
    res.json({ deleted: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTAS API: SERVICIOS PRESTADOS
// ==========================================
app.get('/api/proveedores/:id/servicios', async (req, res) => {
  try {
    const rows = await runQuery('SELECT id, proveedor_id, servicio, descripcion FROM TBL_PROV_DSERVICIOS WHERE proveedor_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/proveedores/:id/servicios', async (req, res) => {
  const { servicio, descripcion, catalogo_id } = req.body;
  try {
    // Si se proporciona catalogo_id, intentamos guardarlo en la columna CATALOGO_ID (si existe)
    let sql = 'INSERT INTO TBL_PROV_DSERVICIOS (proveedor_id, servicio, descripcion) VALUES (?, ?, ?) RETURNING id';
    const params = [req.params.id, servicio, descripcion];
    // Intentar insertar con CATALOGO_ID si se proporcionó
    if (catalogo_id !== undefined && catalogo_id !== null) {
      try {
        await runQuery('ALTER TABLE TBL_PROV_DSERVICIOS ADD CATALOGO_ID INTEGER');
      } catch (e) {}
      sql = 'INSERT INTO TBL_PROV_DSERVICIOS (proveedor_id, servicio, descripcion, catalogo_id) VALUES (?, ?, ?, ?) RETURNING id';
      params.push(catalogo_id);
    }

    const result = await runQuery(sql, params);
    const newId = Array.isArray(result) && result[0]?.id ? result[0].id : (result && result.id) || null;
    res.json({ id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/proveedores/:provId/servicios/:servicioId', async (req, res) => {
  try {
    await runQuery('DELETE FROM TBL_PROV_DSERVICIOS WHERE id = ? AND proveedor_id = ?', [req.params.servicioId, req.params.provId]);
    res.json({ deleted: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTAS API: SUCURSALES
// ==========================================
app.get('/api/proveedores/:id/sucursales', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM TBL_PROV_DSUCURSALES WHERE proveedor_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/proveedores/:id/sucursales', async (req, res) => {
  const { id, tipo, nombre, pais, estado, municipio, localidad, calle, colonia, cp, no_exterior, no_interior, codigo_colonia, codigo_localidad } = req.body;

  const mergeSql = `
    MERGE INTO TBL_PROV_DSUCURSALES tgt
    USING (SELECT ? AS id FROM RDB$DATABASE) src
      ON (tgt.id = src.id)
    WHEN MATCHED THEN
      UPDATE SET proveedor_id = ?, tipo = ?, nombre = ?, pais = ?, estado = ?, municipio = ?, localidad = ?, calle = ?, colonia = ?, cp = ?, no_exterior = ?, no_interior = ?, codigo_colonia = ?, codigo_localidad = ?
    WHEN NOT MATCHED THEN
      INSERT (id, proveedor_id, tipo, nombre, pais, estado, municipio, localidad, calle, colonia, cp, no_exterior, no_interior, codigo_colonia, codigo_localidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id,
    req.params.id, tipo, nombre, pais, estado, municipio, localidad, calle, colonia, cp, no_exterior, no_interior, codigo_colonia, codigo_localidad,
    id, req.params.id, tipo, nombre, pais, estado, municipio, localidad, calle, colonia, cp, no_exterior, no_interior, codigo_colonia, codigo_localidad
  ];

  try {
    await runQuery(mergeSql, params);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/proveedores/:provId/sucursales/:sucursalId', async (req, res) => {
  try {
    await runQuery('DELETE FROM TBL_PROV_DSUCURSALES WHERE id = ? AND proveedor_id = ?', [req.params.sucursalId, req.params.provId]);
    res.json({ deleted: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTAS API: CATALOGO DE SERVICIOS
// ==========================================

app.get('/api/catalogo/servicios', async (req, res) => {
  try {
    const rows = await runQuery('SELECT id, modulo, submodulo FROM TBL_SERVICIOS_CATALOGO ORDER BY modulo, submodulo');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener proveedores activos para un catalogo de servicio específico
app.get('/api/proveedores/por-servicio/:catalogoId', async (req, res) => {
  const catalogoId = req.params.catalogoId;
  try {
    // Buscar proveedores que tengan asignado el catalogo (preferible) o que coincidan por nombre de servicio
    const rows = await runQuery(
      `SELECT p.id, p.codigo, p.nombre, p.rfc, p.direccion, p.activo, p.fecha_registro
       FROM TBL_PROV_DFISCALES p
       JOIN TBL_PROV_DSERVICIOS s ON s.proveedor_id = p.id
       WHERE p.activo = 1 AND (s.catalogo_id = ? OR s.servicio IN (SELECT submodulo FROM TBL_SERVICIOS_CATALOGO WHERE id = ?))
       GROUP BY p.id, p.codigo, p.nombre, p.rfc, p.direccion, p.activo, p.fecha_registro`,
      [catalogoId, catalogoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RUTAS API: AGENDA DE PROVEEDORES (Contactos)
// ==========================================
app.get('/api/proveedores/:id/contactos', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM TBL_PROV_DAGENDA WHERE proveedor_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/proveedores/:id/contactos', async (req, res) => {
  const { id, area, nombre, telefono, ext, correo, dato1, dato2 } = req.body;

  const mergeSql = `
    MERGE INTO TBL_PROV_DAGENDA tgt
    USING (SELECT ? AS id FROM RDB$DATABASE) src
      ON (tgt.id = src.id)
    WHEN MATCHED THEN
      UPDATE SET proveedor_id = ?, area = ?, nombre = ?, telefono = ?, ext = ?, correo = ?, dato1 = ?, dato2 = ?
    WHEN NOT MATCHED THEN
      INSERT (id, proveedor_id, area, nombre, telefono, ext, correo, dato1, dato2)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    id,
    req.params.id, area, nombre, telefono, ext, correo, dato1, dato2,
    id, req.params.id, area, nombre, telefono, ext, correo, dato1, dato2
  ];

  try {
    await runQuery(mergeSql, params);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/proveedores/:provId/contactos/:contactoId', async (req, res) => {
  try {
    await runQuery('DELETE FROM TBL_PROV_DAGENDA WHERE id = ? AND proveedor_id = ?', [req.params.contactoId, req.params.provId]);
    res.json({ deleted: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirigir raíz al login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Soporte HTTPS opcional: si colocas certificados en ./certs/server.pem y ./certs/server-key.pem
const certDir = path.join(__dirname, 'certs');
const certFile = path.join(certDir, 'server.pem');
const keyFile = path.join(certDir, 'server-key.pem');

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  try {
    const options = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    };
    https.createServer(options, app).listen(PORT, HOST, () => {
      console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al leer certificados, arrancando HTTP en su lugar:', err);
    app.listen(PORT, HOST, () => console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`));
  }
} else {
  // Fallback HTTP (mantener comportamiento actual)
  app.listen(PORT, HOST, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
    console.log('Nota: no se encontraron certificados en ./certs — para HTTPS coloque server.pem y server-key.pem en esa carpeta');
  });
}