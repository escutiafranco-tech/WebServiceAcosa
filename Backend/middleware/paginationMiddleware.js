/**
 * MIDDLEWARE: PAGINACIÓN
 * 
 * Normaliza los parámetros de paginación (page, pageSize, sort)
 * y los adjunta a req.pagination para ser usado en controladores
 * 
 * Uso: app.use(paginationMiddleware)
 */

/**
 * Middleware para procesar parámetros de paginación
 * @param {Object} req - Request Express
 * @param {Object} res - Response Express
 * @param {Function} next - Next middleware
 */
function paginationMiddleware(req, res, next) {
  // Obtener parámetros de query
  let page = parseInt(req.query.page) || 1;
  let pageSize = parseInt(req.query.pageSize) || 20;
  const sort = req.query.sort || null;

  // Validar página (mínimo 1)
  if (page < 1) page = 1;

  // Validar tamaño de página (1-100 registros)
  if (pageSize < 1) pageSize = 1;
  if (pageSize > 100) pageSize = 100;

  // Adjuntar a request para uso en controladores
  req.pagination = {
    page,
    pageSize,
    sort,
    offset: (page - 1) * pageSize
  };

  next();
}

module.exports = paginationMiddleware;
