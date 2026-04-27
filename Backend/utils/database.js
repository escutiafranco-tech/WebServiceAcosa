/**
 * MÓDULO: GESTIÓN DE CONEXIONES A BASE DE DATOS
 * 
 * Centraliza la gestión de conexiones SQLite y Firebird
 * Implementa pool de conexiones para reutilizar conexiones existentes
 * Evita crear instancias nuevas en cada solicitud (mejor rendimiento)
 * 
 * 🔒 SEGURIDAD: Validación de parámetros y prevención de SQL injection
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE POOL SQLITE
// ═══════════════════════════════════════════════════════════════

let sqliteInstance = null;

/**
 * Obtener o crear una instancia singleton de SQLite
 * @param {string} dbPath - Ruta del archivo de base de datos
 * @returns {sqlite3.Database} Conexión reutilizable
 */
function getSQLiteInstance(dbPath) {
  if (!sqliteInstance) {
    // Asegurar que la carpeta existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Crear instancia única (singleton pattern)
    sqliteInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error al conectar SQLite:', err.message);
        sqliteInstance = null;
      } else {
        console.log('✅ Pool SQLite inicializado correctamente');
        
        // Configurar pragmas para mejor rendimiento
        sqliteInstance.run('PRAGMA journal_mode = WAL');
        sqliteInstance.run('PRAGMA synchronous = NORMAL');
        sqliteInstance.run('PRAGMA cache_size = -64000');
        sqliteInstance.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  return sqliteInstance;
}

/**
 * Cerrar conexión SQLite (graceful shutdown)
 */
function closeSQLite() {
  return new Promise((resolve, reject) => {
    if (sqliteInstance) {
      sqliteInstance.close((err) => {
        if (err) reject(err);
        else {
          console.log('✅ Conexión SQLite cerrada correctamente');
          sqliteInstance = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// OPERACIONES DE CONSULTA
// ═══════════════════════════════════════════════════════════════

/**
 * Ejecutar query SELECT que devuelve múltiples filas
 * @param {sqlite3.Database} db - Conexión a BD
 * @param {string} sql - Sentencia SQL
 * @param {array} params - Parámetros preparados
 * @returns {Promise<array>} Array de resultados
 */
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Conexión de BD no disponible'));
    
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Ejecutar query SELECT que devuelve una sola fila
 * @param {sqlite3.Database} db - Conexión a BD
 * @param {string} sql - Sentencia SQL
 * @param {array} params - Parámetros preparados
 * @returns {Promise<object>} Objeto con resultado o null
 */
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Conexión de BD no disponible'));
    
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

/**
 * Ejecutar query INSERT, UPDATE, DELETE
 * @param {sqlite3.Database} db - Conexión a BD
 * @param {string} sql - Sentencia SQL
 * @param {array} params - Parámetros preparados
 * @returns {Promise<object>} { lastID, changes }
 */
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Conexión de BD no disponible'));
    
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

/**
 * Ejecutar múltiples queries en una transacción
 * @param {sqlite3.Database} db - Conexión a BD
 * @param {array} queries - Array de { sql, params }
 * @returns {Promise<array>} Resultados de cada query
 */
function transaction(db, queries) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Conexión de BD no disponible'));

    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');
        
        const results = [];
        for (const query of queries) {
          const result = await run(db, query.sql, query.params);
          results.push(result);
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            resolve(results);
          }
        });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES PARA PAGINACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener resultados paginados
 * @param {sqlite3.Database} db - Conexión a BD
 * @param {string} sql - Sentencia SQL SELECT
 * @param {array} params - Parámetros SQL
 * @param {number} page - Número de página (1-indexed)
 * @param {number} pageSize - Cantidad de registros por página (default: 20)
 * @returns {Promise<object>} { data, total, page, pageSize, totalPages }
 */
async function paginate(db, sql, params = [], page = 1, pageSize = 20) {
  try {
    // Validar entrada
    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
    const offset = (pageNum - 1) * size;

    // Obtener total de registros
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
    const countResult = await get(db, countSql, params);
    const total = countResult?.total || 0;

    // Obtener datos paginados
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const data = await all(db, paginatedSql, [...params, size, offset]);

    return {
      data,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };
  } catch (error) {
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  getSQLiteInstance,
  closeSQLite,
  all,
  get,
  run,
  transaction,
  paginate
};
