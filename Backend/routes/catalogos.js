/**
 * RUTA: CATÁLOGOS DINÁMICOS
 * 
 * Endpoints para acceder a catálogos configurados dinámicamente
 * basados en metadata (catalogs.json)
 */

const express = require('express');
const router = express.Router();
const { construirSelectDinamico, obtenerMetadataTabla, listarTablasConsulta } = require('../utils/catalogBuilder');

// Asumir que sqliteDb está disponible globalmente (se pasa vía middleware o desde server.js)
let dbConnection = null;

// Setter para la conexión BD
function setDatabaseConnection(db) {
  dbConnection = db;
}

/**
 * GET /api/datos/
 * Lista todas las tablas de consulta disponibles
 */
router.get('/', (req, res) => {
  try {
    const tablas = listarTablasConsulta();
    res.json({
      total: tablas.length,
      tablas_disponibles: tablas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/datos/:nombreTabla/schema
 * Obtiene la estructura y metadata de una tabla de consulta
 */
router.get('/:nombreTabla/schema', (req, res) => {
  try {
    const { nombreTabla } = req.params;
    const metadata = obtenerMetadataTabla(nombreTabla);
    res.json(metadata);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * GET /api/datos/:nombreTabla
 * Obtiene los datos de la tabla de consulta
 */
router.get('/:nombreTabla', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(500).json({ error: 'Base de datos no conectada' });
    }

    const { nombreTabla } = req.params;
    const { filtro } = req.query; // Opcional: WHERE clause adicional

    // Construir SELECT dinámico
    const selectBase = construirSelectDinamico(nombreTabla);
    const sql = filtro ? `${selectBase} WHERE ${filtro}` : selectBase;

    console.log(`[DATOS] Ejecutando query para ${nombreTabla}...`);

    // Ejecutar query según tipo de BD
    if (typeof dbConnection.all === 'function') {
      // SQLite3
      dbConnection.all(sql, [], (err, rows) => {
        if (err) {
          console.error('[DATOS] Error SQL:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({
          tabla: nombreTabla,
          total: rows ? rows.length : 0,
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
          datos: result || []
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(500).json({ error: 'Tipo de BD no soportado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/datos/:nombreTabla/sql
 * DEBUG: Retorna el SELECT dinámico que se va a ejecutar
 */
router.get('/:nombreTabla/sql', (req, res) => {
  try {
    const { nombreTabla } = req.params;
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
