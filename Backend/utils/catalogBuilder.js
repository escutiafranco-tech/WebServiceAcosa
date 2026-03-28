/**
 * Generador de consultas dinámicas basado en metadata
 * Lee catalogs.json y construye SELECT automáticamente desde "tablas_consulta"
 */

const fs = require('fs');
const path = require('path');

// Cargar metadata de tablas de consulta
function loadCatalogMetadata() {
  const catalogPath = path.join(__dirname, '..', 'system', 'catalogs.json');
  try {
    const data = fs.readFileSync(catalogPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error cargando catalogs.json:', err.message);
    return { tablas_consulta: {} };
  }
}

/**
 * Construye un SELECT dinámico basado en la metadata de tabla_consulta
 * @param {string} nombreTabla - Nombre de la tabla de consulta (ej: 'TBL_PROV_GLOBAL')
 * @returns {string} - SQL SELECT statement
 */
function construirSelectDinamico(nombreTabla) {
  const metadata = loadCatalogMetadata();
  const tabla_consulta = metadata.tablas_consulta[nombreTabla];

  if (!tabla_consulta) {
    throw new Error(`Tabla de consulta '${nombreTabla}' no encontrada en catalogs.json`);
  }

  // 1. Construir lista de columnas con alias
  let selectCols = [];
  
  // Agregar columnas base
  tabla_consulta.columnas_base.forEach(col => {
    selectCols.push(`${tabla_consulta.alias_base}.${col.nombre} AS ${col.nombre}`);
  });

  // Agregar columnas de joins activos
  tabla_consulta.joins.forEach(join => {
    if (join.activo !== false) {
      join.columnas.forEach(col => {
        selectCols.push(`${join.alias}.${col.nombre} AS ${col.nombre}`);
      });
    }
  });

  // 2. Construir FROM y JOINs
  let from = `FROM ${tabla_consulta.tabla_base} ${tabla_consulta.alias_base}`;

  tabla_consulta.joins.forEach(join => {
    if (join.activo !== false) {
      from += ` ${join.tipo || 'LEFT'} JOIN ${join.tabla} ${join.alias} ON ${join.on}`;
    }
  });

  // 3. Armar query completa
  const sql = `SELECT DISTINCT ${selectCols.join(', ')} ${from}`;
  
  return sql;
}

/**
 * Obtiene metadata de una tabla de consulta (columnas, etiquetas, tipos)
 * @param {string} nombreTabla - Nombre de la tabla de consulta
 * @returns {object} - Metadata de la tabla
 */
function obtenerMetadataTabla(nombreTabla) {
  const metadata = loadCatalogMetadata();
  const tabla_consulta = metadata.tablas_consulta[nombreTabla];

  if (!tabla_consulta) {
    throw new Error(`Tabla de consulta '${nombreTabla}' no encontrada`);
  }

  // Combinar columnas base + columnas de joins activos
  let todasLasColumnas = [...tabla_consulta.columnas_base];
  tabla_consulta.joins.forEach(join => {
    if (join.activo !== false) {
      todasLasColumnas.push(...join.columnas);
    }
  });

  return {
    descripcion: tabla_consulta.descripcion,
    tabla_base: tabla_consulta.tabla_base,
    todas_las_columnas: todasLasColumnas,
    columnas_visibles: tabla_consulta.columnas_visibles || tabla_consulta.columnas_base.map(c => c.nombre),
    joins_activos: tabla_consulta.joins.filter(j => j.activo !== false)
  };
}

/**
 * Lista todas las tablas de consulta disponibles
 * @returns {array} - Array con nombres de tablas de consulta
 */
function listarTablasConsulta() {
  const metadata = loadCatalogMetadata();
  return Object.keys(metadata.tablas_consulta || {});
}

module.exports = {
  loadCatalogMetadata,
  construirSelectDinamico,
  obtenerMetadataTabla,
  listarTablasConsulta
};
