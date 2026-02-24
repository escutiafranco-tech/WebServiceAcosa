// Carga variables de entorno desde Config/.env (puerto, Firebird, JWT, banderas, etc.)
require('dotenv').config({ path: require('path').join(__dirname, '..', 'Config', '.env') });

// Módulos base de Node y terceros
const fs = require('fs');           // Lectura/escritura de archivos (certificados, existencia de carpetas, etc.)
const http = require('http');       // Servidor HTTP simple (fall‑back si HTTPS falla)
const https = require('https');     // Servidor HTTPS con certificados locales
const express = require('express'); // Framework web principal
const path = require('path');       // Construcción segura de rutas
const Firebird = require('node-firebird'); // Driver para base de datos Firebird

/**
 * Servidor principal del WebService ACOSA.
 *
 *  - Decide si usa SQLite (desarrollo) o Firebird (producción) según configuración.
 *  - Inicializa las tablas mínimas cuando se usa SQLite (proveedores, servicios, agenda, usuarios).
 *  - Expone API REST para proveedores y catálogos, más rutas de autenticación y menús.
 *  - Sirve la app web (HTML/JS/CSS) desde la carpeta Public y otros recursos estáticos.
 */
// Bandera para decidir el motor de BD
//  - true  => se usa SIEMPRE SQLite (modo desarrollo)
//  - false => se intenta usar Firebird (modo producción)

const useSqlite = true;
if (process.env.USE_SQLITE && process.env.USE_SQLITE !== 'true') {
  // Aviso: aunque en .env se haya puesto otro valor, aquí se fuerza SQLite
  console.warn('Advertencia: se fuerza uso de SQLite ignorando USE_SQLITE en .env');
}
let sqliteDb = null;
if (useSqlite) {
  // Carga driver SQLite solo si realmente se va a usar
  const sqlite3 = require('sqlite3').verbose();
  // Ruta del archivo físico de SQLite en la carpeta Database de la raíz del proyecto
  const sqlitePath = path.join(__dirname, '..', 'Database', 'acosa_local.db');
  // Asegura que la carpeta Database exista antes de abrir/crear el archivo .db
  const dbDir = path.dirname(sqlitePath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  // Abre (o crea si no existe) la base de datos SQLite
  sqliteDb = new sqlite3.Database(sqlitePath);

  // Solo sembrar usuario admin por defecto si la tabla USERS ya existe y está vacía
  sqliteDb.serialize(() => {
    sqliteDb.get('SELECT COUNT(*) AS cnt FROM USERS', [], (err, row) => {
      if (err) {
        // Si falla (por ejemplo, porque la tabla USERS no existe), solo se registra y se continúa
        console.warn('No se pudo verificar la tabla USERS para sembrar admin (¿existe la tabla?):', err.message);
        return;
      }
      if (row && row.cnt === 0) {
        const now = new Date().toISOString();
        sqliteDb.run(
          'INSERT INTO USERS (id, username, password, role, nombre, email, activo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['admin', 'admin', 'admin', 'Administrador', 'Administrador', 'admin@example.com', 1, now],
          (insErr) => {
            if (insErr) {
              console.error('Error insertando usuario admin por defecto:', insErr.message);
            } else {
              console.log('Usuario admin por defecto creado (admin/admin)');
            }
          }
        );
      }
    });
  });
}

// Crea la instancia principal de la aplicación Express
const app = express();

// Buscador simple de ficheros para cargar rutas aunque se hayan movido (hoy casi no se usa)
function findFileRecursive(startDir, target) {
  const items = fs.readdirSync(startDir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(startDir, it.name);
    if (it.isFile() && it.name === target) return full;
    if (it.isDirectory()) {
      try {
        const found = findFileRecursive(full, target);
        if (found) return found;
      } catch (e) {}
    }
  }
  return null;
}

// Rutas API principales (se montan luego debajo de /auth, /menus, /users)
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');
const usuariosRoutes = require('./routes/usuarios');  // ✅ Consolidado: solo usuarios.js para todo

// Middleware global para parsear JSON en peticiones de la API
app.use(express.json());

// Sirve los archivos estáticos de la app web (HTML, JS, CSS) desde Public
app.use(express.static(path.join(__dirname, '..', 'Public')));

// ✅ SERVIR ARCHIVOS ESTÁTICOS DE Modules (frontend modular por áreas)
app.use('/modules', express.static(path.join(__dirname, '..', 'Modules')));

// ✅ SERVIR SYSTEM (menus.json, users.json) donde realmente están: Backend/system
// IMPORTANTE: esto va ANTES de /data para que /data/system/menus.json
// no quede atrapado en el static de Database.
app.use('/data/system', express.static(path.join(__dirname, 'system')));

// ✅ SERVIR ARCHIVOS JSON (catálogos de BD) desde la carpeta Database de la raíz
app.use('/data', express.static(path.join(__dirname, '..', 'Database')));
 
// Configuración de conexión a Firebird (solo se usa cuando useSqlite es false)
const fbConfig = {
  host: process.env.FB_HOST || 'localhost',
  port: parseInt(process.env.FB_PORT || '3050', 10),
  database: process.env.FB_DB || path.join(__dirname, '..', 'Database', 'acosa.fdb'),
  user: process.env.FB_USER || 'SYSDBA',
  password: process.env.FB_PASSWORD || 'masterkey',
  lowercase_keys: true,
  role: null,
  pageSize: 8192,
  createDatabase: true
};

let fbPool = null;
if (!useSqlite) {
  // Crea un pool de conexiones a Firebird para reutilizar conexiones
  const fbPoolSize = parseInt(process.env.FB_POOL_SIZE || '10', 10);
  fbPool = Firebird.pool(fbPoolSize, fbConfig);
}

function runQuery(sql, params = []) {
  if (useSqlite && sqliteDb) {
    // En modo SQLite se adaptan algunas consultas específicas (MERGE, RETURNING)
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

  // Firebird (modo no SQLite): ejecuta la consulta usando el pool fbPool
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
  // Asegura que existan las tablas necesarias, según el motor activo.
  // En modo SQLite asumimos que la base ya tiene el esquema creado externamente.
  if (useSqlite && sqliteDb) {
    return;
  } else {
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

    // Ejecuta de forma segura cada sentencia de creación de tabla en Firebird
    for (const sql of ddlStatements) {
      try {
        await runQuery(sql);
      } catch (err) {
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
  }

  // Sembrar catálogo de servicios si está vacío (funciona tanto en SQLite como en Firebird)
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

// Inicializa el esquema de base de datos al arrancar el servidor
ensureSchema().catch((e) => console.error('Error inicializando esquema:', e.message));

// Rutas de alto nivel (montan los routers definidos en Backend/routes)
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);
app.use('/api/usuarios', usuariosRoutes);  // ✅ Consolidado: todas las operaciones de usuarios aquí

// ==========================================
// RUTAS API: CLIENTES (VENTAS)
// ==========================================

// Nota: estas rutas están implementadas sólo para SQLite (useSqlite = true)
// y utilizan directamente la conexión sqliteDb, ya que la aplicación está
// forzada a modo SQLite en este proyecto.

// Obtener todos los clientes (datos fiscales principales)
app.get('/api/clientes', async (req, res) => {
  try {
    if (!useSqlite || !sqliteDb) {
      return res.status(500).json({ error: 'API de clientes sólo disponible en modo SQLite' });
    }
    sqliteDb.all(
      'SELECT id, codigo, nombre, rfc, direccion, activo, fecha_registro FROM TLB_CLIE_DFISCALES',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error leyendo clientes desde SQLite:', err.message);
          return res.status(500).json({ error: 'Error obteniendo clientes' });
        }
        const mapped = rows.map((row) => ({
          ...row,
          activo: row.activo === 1
        }));
        res.json(mapped);
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear/actualizar un cliente (upsert por ID)
app.post('/api/clientes', (req, res) => {
  if (!useSqlite || !sqliteDb) {
    return res.status(500).json({ error: 'API de clientes sólo disponible en modo SQLite' });
  }

  const { id, codigo, nombre, rfc, direccion, activo, fecha_registro } = req.body;

  if (!id || !codigo || !nombre) {
    return res.status(400).json({ error: 'id, codigo y nombre son requeridos' });
  }

  const now = new Date().toISOString();
  const fecha = fecha_registro || now;
  const activoVal = activo ? 1 : 0;

  const sql = `
    INSERT INTO TLB_CLIE_DFISCALES (id, codigo, nombre, rfc, direccion, activo, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      codigo = excluded.codigo,
      nombre = excluded.nombre,
      rfc = excluded.rfc,
      direccion = excluded.direccion,
      activo = excluded.activo,
      fecha_registro = excluded.fecha_registro
  `;

  const params = [id, codigo, nombre, rfc || '', direccion || '', activoVal, fecha];

  sqliteDb.run(sql, params, (err) => {
    if (err) {
      console.error('Error guardando cliente en SQLite:', err.message);
      return res.status(500).json({ error: 'Error guardando cliente' });
    }
    res.json({ id });
  });
});

// Eliminar un cliente por ID
app.delete('/api/clientes/:id', (req, res) => {
  if (!useSqlite || !sqliteDb) {
    return res.status(500).json({ error: 'API de clientes sólo disponible en modo SQLite' });
  }

  const id = req.params.id;
  sqliteDb.run('DELETE FROM TLB_CLIE_DFISCALES WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error eliminando cliente en SQLite:', err.message);
      return res.status(500).json({ error: 'Error eliminando cliente' });
    }
    res.json({ deleted: this.changes || 0 });
  });
});

// ==========================================
// RUTAS API: DATOS FISCALES (Tabla Principal)
// ==========================================
app.get('/api/proveedores', async (req, res) => {
  try {
    // Obtiene todos los proveedores principales
    const rows = await runQuery('SELECT id, codigo, nombre, rfc, direccion, activo, fecha_registro FROM TBL_PROV_DFISCALES');
    // Mapea el campo activo de 0/1 a booleano
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
  try {
    let { id, codigo, nombre, rfc, direccion, activo, fecha_registro } = req.body;

    // Valores por defecto
    const nowIso = new Date().toISOString();
    if (!fecha_registro) fecha_registro = nowIso;
    const activoFlag = activo ? 1 : 0;

    // Si no viene ID, se genera un consecutivo tipo PROV-00001
    if (!id) {
      let lastRows;
      if (useSqlite) {
        // SQLite: LIMIT 1
        lastRows = await runQuery(
          "SELECT id FROM TBL_PROV_DFISCALES WHERE id LIKE 'PROV-%' ORDER BY id DESC LIMIT 1"
        );
      } else {
        // Firebird: FIRST 1
        lastRows = await runQuery(
          "SELECT FIRST 1 id FROM TBL_PROV_DFISCALES WHERE id LIKE 'PROV-%' ORDER BY id DESC"
        );
      }

      const lastId = lastRows && lastRows.length > 0 ? lastRows[0].id : null;
      let nextNumber = 1;
      if (lastId && typeof lastId === 'string') {
        const parts = lastId.split('-');
        const numStr = parts[1] || '';
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num >= 0) {
          nextNumber = num + 1;
        }
      }
      const padded = String(nextNumber).padStart(5, '0');
      id = `PROV-${padded}`;
    }

    // MERGE (upsert) compatible con Firebird; en SQLite se adapta dentro de runQuery
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
      // Parámetros para UPDATE (cuando ya existe el registro)
      id, codigo, nombre, rfc, direccion, activoFlag, fecha_registro,
      // Parámetros para INSERT (cuando no existe)
      id, codigo, nombre, rfc, direccion, activoFlag, fecha_registro
    ];

    await runQuery(mergeSql, params);
    res.json({ id, fecha_registro });
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
    // Lista todos los servicios asociados a un proveedor
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
    // Devuelve todas las sucursales (domicilios) de un proveedor
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
    // Devuelve el catálogo de servicios (módulo/submódulo)
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
    // Devuelve los contactos (agenda) de un proveedor
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

// ==========================================
// RUTAS API: CUSTODIAS (LOGÍSTICA)
// ==========================================

// Nota: actualmente no existe una tabla específica de custodias en SQLite.
// Este endpoint está preparado para que, cuando definas dicha tabla,
// puedas leerla aquí y devolver las columnas folio, proveedor, fecha,
// ubicacion y estatus que el frontend espera.
app.get('/api/logistica/custodias', async (req, res) => {
  try {
    // TODO: cuando exista una tabla de custodias en SQLite,
    // reemplazar este arreglo vacío por un SELECT real.
    const custodias = [];
    res.json({ custodias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirigir raíz al login (HTML en carpeta Public de la raíz del proyecto)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Public', 'Login.html'));
});

// ✅ MIDDLEWARE: Interceptar archivos HTML de módulos para inyectar desarrollo.js
app.get(/\.html$/, (req, res, next) => {
  // Solo para rutas de módulos
  if (!req.path.startsWith('/modules')) {
    return next();
  }
  
  const modulePath = path.join(__dirname, '..', req.path);
  
  // Si el archivo no existe, pasar al siguiente middleware (error 404)
  if (!fs.existsSync(modulePath)) {
    // Ver siguiente middleware
    return next();
  }
  
  // Si es un archivo HTML, leerlo e inyectar desarrollo.js
  if (modulePath.endsWith('.html')) {
    try {
      let html = fs.readFileSync(modulePath, 'utf8');
      
      // Inyectar desarrollo.js antes del cierre de </body> si no está ya inyectado
      if (!html.includes('desarrollo.js')) {
        html = html.replace('</body>', '<script src="/desarrollo.js"><\/script>\n</body>');
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      console.error('Error leyendo archivo HTML:', err);
    }
  }
  
  next();
});

// ✅ MIDDLEWARE GLOBAL: Capturar TODAS las rutas de módulos no encontradas
// Esto incluye rutas como /modules/... y también rutas simples que se resuelven como módulos
app.use('/', (req, res, next) => {
  // Si ya fue manejado por otro middleware, seguir
  if (res.headersSent) {
    return next();
  }
  
  // Intentar resolver como módulo en varias ubicaciones
  let modulePath = null;
  let pathToCheck = req.path;
  
  // Caso 1: Ruta con /modules/ explícito
  if (req.path.startsWith('/modules/')) {
    modulePath = path.join(__dirname, '..', 'Modules', req.path.replace('/modules/', ''));
  }
  // Caso 2: Ruta simple sin /modules/ (e.g., /reportes-compras.html)
  else if (req.path.endsWith('.html')) {
    // Buscar en varias ubicaciones dentro de Modules
    const posiblesPaths = [
      path.join(__dirname, '..', 'Modules', req.path),
      path.join(__dirname, '..', 'Modules', 'compras', req.path),
      path.join(__dirname, '..', 'Modules', 'produccion', req.path),
      path.join(__dirname, '..', 'Modules', 'ventas', req.path),
      path.join(__dirname, '..', 'Modules', 'logistica', req.path),
      path.join(__dirname, '..', 'Modules', 'pagos', req.path),
    ];
    
    modulePath = posiblesPaths.find(p => fs.existsSync(p)) || null;
  }
  
  // Si encontramos el archivo, servirlo con desarrollo.js inyectado
  if (modulePath && fs.existsSync(modulePath)) {
    try {
      let html = fs.readFileSync(modulePath, 'utf8');
      
      if (!html.includes('desarrollo.js')) {
        html = html.replace('</body>', '<script src="/desarrollo.js"><\/script>\n</body>');
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      console.error('Error leyendo archivo HTML:', err);
    }
  }
  
  // ✅ SI NO EXISTE = MOSTRAR PANTALLA ESTÁNDAR DE DESARROLLO
  // Capturar .html no encontrados y mostrar componente estándar
  if (req.path.endsWith('.html')) {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Módulo en Desarrollo</title>
        <link rel="stylesheet" href="/Style.css">
        <link rel="stylesheet" href="/modules.css">
        <style>
          /* Mismo fondo que la pantalla de bienvenida */
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: #FFFFFF;
          }
          
          .contenedor-desarrollo {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 40px 20px;
            background-color: #FFFFFF;
          }
          
          .icono-construccion {
            margin-bottom: 30px;
          }
          
          .icono-construccion img {
            width: 120px;
            height: 120px;
          }
          
          .mensaje-desarrollo {
            font-size: 2.5rem;
            color: #2F3158;
            font-weight: 700;
            margin-bottom: 1.5rem;
          }
          
          .texto-desarrollo {
            font-size: 1.4rem;
            color: #888888;
            margin: 20px 0 40px 0;
            max-width: 500px;
            line-height: 1.6;
          }
          
          .btn-volver {
            padding: 12px 24px;
            background-color: #2F3158;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.3s;
          }
          
          .btn-volver:hover {
            background-color: #1f2138;
          }
        </style>
      </head>
      <body>
        <div class="contenedor-desarrollo">
          <div class="icono-construccion">
            <img src="/Imagenes/Ico_Construccion_01.png" alt="Construcción">
          </div>
          <h2 class="mensaje-desarrollo">Módulo en Desarrollo</h2>
          <p class="texto-desarrollo">Este módulo está en desarrollo y estará disponible pronto.</p>
          <button class="btn-volver" onclick="cerrarPestana()">← Volver</button>
        </div>
        <script src="/desarrollo.js"></script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  
  next();
});

// ✅ MIDDLEWARE: Interceptar módulos no encontrados (ANTES del static middleware)
app.use('/modules', (req, res, next) => {
  const modulePath = path.join(__dirname, '..', 'Modules', req.path);
  
  // Si el archivo no existe, devolver página estándar de desarrollo
  if (!fs.existsSync(modulePath)) {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Módulo en Desarrollo</title>
        <link rel="stylesheet" href="/Style.css">
        <link rel="stylesheet" href="/modules.css">
        <style>
          /* Mismo fondo que la pantalla de bienvenida */
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: #FFFFFF;
          }
          
          .contenedor-desarrollo {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 40px 20px;
            background-color: #FFFFFF;
          }
          
          .icono-construccion {
            margin-bottom: 30px;
          }
          
          .icono-construccion img {
            width: 120px;
            height: 120px;
          }
          
          .mensaje-desarrollo {
            font-size: 2.5rem;
            color: #2F3158;
            font-weight: 700;
            margin-bottom: 1.5rem;
          }
          
          .texto-desarrollo {
            font-size: 1.4rem;
            color: #888888;
            margin: 20px 0 40px 0;
            max-width: 500px;
            line-height: 1.6;
          }
          
          .btn-volver {
            padding: 12px 24px;
            background-color: #2F3158;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.3s;
          }
          
          .btn-volver:hover {
            background-color: #1f2138;
          }
        </style>
      </head>
      <body>
        <div class="contenedor-desarrollo">
          <div class="icono-construccion"><img src="/Imagenes/Ico_Construccion_01.png" alt="Construcción"></div>
          <h2 class="mensaje-desarrollo">Módulo en Desarrollo</h2>
          <p class="texto-desarrollo">Este módulo está en desarrollo y estará disponible pronto.</p>
          <button class="btn-volver" onclick="window.history.back()">← Volver</button>
        </div>
        <script src="/desarrollo.js"></script>
      </body>
      </html>
    `;
    return res.send(html);
  }
  
  // Si existe, continuar con el siguiente middleware (static)
  next();
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Soporte HTTPS opcional: si colocas certificados en ./certs/server.pem y ./certs/server-key.pem
const certDir = path.join(__dirname, 'certs');
const certFile = path.join(certDir, 'server.pem');
const keyFile = path.join(certDir, 'server-key.pem');

// Si existen certificados, se arranca en HTTPS en el puerto configurado
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
    // Si falla la lectura/uso de certificados se cae a HTTP simple
    console.error('Error al leer certificados, arrancando HTTP en su lugar:', err);
    app.listen(PORT, HOST, () => console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`));
  }
} else {
  // Si no hay certificados, se arranca directamente en HTTP (comportamiento por defecto)
  app.listen(PORT, HOST, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
    console.log('Nota: no se encontraron certificados en ./certs — para HTTPS coloque server.pem y server-key.pem en esa carpeta');
  });
}