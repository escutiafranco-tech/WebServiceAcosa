/**
 * RUTA: CATÁLOGOS DINÁMICOS
 * 
 * Endpoints para acceder a catálogos configurados dinámicamente
 * basados en metadata (catalogs.json)
 * 
 * 🔒 SEGURIDAD: Validación y sanitización de entrada contra SQL injection
 */

const express = require('express');
const router = express.Router();
const { construirSelectDinamico, obtenerMetadataTabla, listarTablasConsulta } = require('../utils/catalogBuilder');
const { protect: authMiddleware } = require('../controllers/authMiddleware');

// Asumir que sqliteDb está disponible globalmente (se pasa vía middleware o desde server.js)
let dbConnection = null;

// Setter para la conexión BD
function setDatabaseConnection(db) {
  dbConnection = db;
}

/**
 * 🔒 UTILIDAD: Sanitizar y validar filtro WHERE
 * Previene SQL injection permitiendo solo operadores seguros
 */
function sanitizeWhereClause(filtro) {
  if (!filtro) return null;
  
  // Validar longitud máxima
  if (filtro.length > 500) {
    throw new Error('Filtro demasiado largo');
  }

  // Operadores permitidos seguros
  const allowedOperators = [
    { pattern: /^[\w_]+\s*=\s*'[^']*'$/, desc: 'campo = valor' },
    { pattern: /^[\w_]+\s*!=\s*'[^']*'$/, desc: 'campo != valor' },
    { pattern: /^[\w_]+\s*LIKE\s*'%[^']*%'$/i, desc: 'campo LIKE %valor%' },
    { pattern: /^[\w_]+\s*>\s*\d+$/, desc: 'campo > número' },
    { pattern: /^[\w_]+\s*<\s*\d+$/, desc: 'campo < número' },
    { pattern: /^[\w_]+\s*IN\s*\([^)]*\)$/i, desc: 'campo IN (valores)' }
  ];

  // Blacklist: Palabras clave peligrosas
  const blacklist = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE', 
    'ALTER', 'CREATE', 'EXEC', 'EXECUTE', 'SCRIPT', 
    'UNION', '--', '/*', '*/', 'xp_', 'sp_'
  ];

  const upperFiltro = filtro.toUpperCase();
  for (const word of blacklist) {
    if (upperFiltro.includes(word)) {
      throw new Error(`Operación no permitida: ${word}`);
    }
  }

  // Validar que contenga al menos un operador permitido
  let isValid = false;
  for (const rule of allowedOperators) {
    if (rule.pattern.test(filtro)) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    throw new Error('Formato de filtro inválido. Formatos permitidos: campo=valor, campo!=valor, campo LIKE %valor%, campo>número, etc.');
  }

  return filtro;
}

/**
 * 🔒 UTILIDAD: Validar nombre de tabla
 * Previene inyección a través del nombre de tabla
 */
function validateTableName(tableName) {
  // Solo alfanuméricos, guiones bajos (snake_case)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error('Nombre de tabla inválido');
  }
  
  // Verificar que existe en metadata
  const availableTables = listarTablasConsulta();
  if (!availableTables.includes(tableName)) {
    throw new Error('Tabla no encontrada');
  }

  return tableName;
}

/**
 * GET /api/datos/
 * Lista todas las tablas de consulta disponibles
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const tablas = listarTablasConsulta();
    res.json({
      total: tablas.length,
      tablas_disponibles: tablas
    });
  } catch (err) {
    console.error('Error listando tablas:', err.message);
    res.status(500).json({ error: 'Error listando tablas' });
  }
});

/**
 * GET /api/datos/:nombreTabla/schema
 * Obtiene la estructura y metadata de una tabla de consulta
 * 
 * @param {string} nombreTabla - Nombre de la tabla (validado)
 */
router.get('/:nombreTabla/schema', authMiddleware, (req, res) => {
  try {
    const nombreTabla = validateTableName(req.params.nombreTabla);
    const metadata = obtenerMetadataTabla(nombreTabla);
    res.json(metadata);
  } catch (err) {
    console.error('Error obteniendo schema:', err.message);
    res.status(404).json({ error: err.message });
  }
});

/**
 * GET /api/datos/:nombreTabla
 * Obtiene los datos de la tabla con filtros opcionales seguros
 * 
 * @param {string} nombreTabla - Nombre de la tabla (validado)
 * @query {string} filtro - WHERE clause opcional (sanitizado)
 * @query {number} limit - Límite de resultados (default: 1000, máx: 10000)
 * @query {number} offset - Desplazamiento (default: 0)
 */
router.get('/:nombreTabla', authMiddleware, async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(500).json({ error: 'Base de datos no conectada' });
    }

    // Validar parámetros
    const nombreTabla = validateTableName(req.params.nombreTabla);
    const { filtro } = req.query;
    
    let limit = parseInt(req.query.limit) || 1000;
    let offset = parseInt(req.query.offset) || 0;

    // Validar límite
    if (limit < 1 || limit > 10000) limit = 1000;
    if (offset < 0) offset = 0;

    // Construir SELECT dinámico
    let selectBase = construirSelectDinamico(nombreTabla);
    
    // 🔒 Sanitizar filtro si viene
    let sql = selectBase;
    if (filtro) {
      try {
        const safeFiltro = sanitizeWhereClause(filtro);
        sql = `${selectBase} WHERE ${safeFiltro}`;
      } catch (validationErr) {
        return res.status(400).json({ 
          error: 'Validación de filtro fallida',
          message: validationErr.message 
        });
      }
    }

    // Agregar paginación
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log(`[DATOS] Consultando ${nombreTabla}... (limit: ${limit}, offset: ${offset})`);

    // Ejecutar query según tipo de BD
    if (typeof dbConnection.all === 'function') {
      // SQLite3
      dbConnection.all(sql, [], (err, rows) => {
        if (err) {
          console.error('[DATOS] Error SQL:', err.message);
          return res.status(500).json({ 
            error: 'Error ejecutando consulta',
            // No revelar detalles SQL en producción
            ...(process.env.NODE_ENV === 'development' && { details: err.message })
          });
        }
        
        res.json({
          tabla: nombreTabla,
          total: rows ? rows.length : 0,
          limit,
          offset,
          datos: rows || []
        });
      });
    } else if (typeof dbConnection.query === 'function') {
      // Firebird u otro
      try {
        const result = await dbConnection.query(sql);
        res.json({
          tabla: nombreTabla,
          total: result ? result.length : 0,
          limit,
          offset,
          datos: result || []
        });
      } catch (err) {
        console.error('[DATOS] Error Firebird:', err.message);
        res.status(500).json({ 
          error: 'Error ejecutando consulta',
          ...(process.env.NODE_ENV === 'development' && { details: err.message })
        });
      }
    } else {
      res.status(500).json({ error: 'Tipo de BD no soportado' });
    }
  } catch (err) {
    console.error('Error en catalogos:', err.message);
    res.status(500).json({ 
      error: 'Error procesando solicitud',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});

/**
 * GET /api/datos/:nombreTabla/sql
 * DEBUG: Retorna el SELECT dinámico que se va a ejecutar
 * SOLO en modo desarrollo
 */
router.get('/:nombreTabla/sql', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'No permitido en producción' });
  }

  try {
    const nombreTabla = validateTableName(req.params.nombreTabla);
    const sql = construirSelectDinamico(nombreTabla);
    res.json({ sql, tabla: nombreTabla });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = {
  router,
  setDatabaseConnection
};
