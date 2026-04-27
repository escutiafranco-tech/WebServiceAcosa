/**
 * MÓDULO: SEGURIDAD Y VALIDACIÓN CENTRALIZADA
 * 
 * Proporciona utilidades para:
 * - Validación de entrada
 * - Sanitización
 * - Prevención de SQL Injection
 * - Prevención de XSS
 * - Manejo consistente de errores
 */

/**
 * Sanitizar string: remover caracteres potencialmente peligrosos
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>\"'`]/g, '') // Remover caracteres HTML/XSS
    .substring(0, 255); // Limitar longitud
}

/**
 * Validar ID (alphanumerico + guiones, máximo 50 caracteres)
 * @param {string} id - ID a validar
 * @returns {boolean} True si es válido
 */
function isValidId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{1,50}$/.test(id);
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
}

/**
 * Validar contraseña (fuerza mínima)
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 8)
 * @returns {boolean} True si cumple requisitos
 */
function isValidPassword(password, minLength = 8) {
  if (!password || typeof password !== 'string') return false;
  
  // Mínimo: 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Validar nombre (letras, espacios, guiones, apóstrofes)
 * @param {string} name - Nombre a validar
 * @returns {boolean} True si es válido
 */
function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-Z\s'-]{2,100}$/;
  return nameRegex.test(name);
}

/**
 * Validar username (alfanumérico, guiones, guiones bajos)
 * @param {string} username - Username a validar
 * @returns {boolean} True si es válido
 */
function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
}

/**
 * Validar parámetros de paginación
 * @param {number} page - Página (default: 1)
 * @param {number} pageSize - Tamaño de página (default: 20)
 * @returns {object} { page, pageSize } validados
 */
function validatePagination(page = 1, pageSize = 20) {
  let p = parseInt(page) || 1;
  let ps = parseInt(pageSize) || 20;
  
  if (p < 1) p = 1;
  if (ps < 1) ps = 1;
  if (ps > 100) ps = 100;
  
  return { page: p, pageSize: ps };
}

/**
 * Crear respuesta de error consistente
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {array} details - Detalles adicionales (optional)
 * @returns {object} Objeto de error formateado
 */
function createErrorResponse(message, statusCode = 400, details = null) {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return { statusCode, body: response };
}

/**
 * Crear respuesta de éxito consistente
 * @param {any} data - Datos a retornar
 * @param {string} message - Mensaje de éxito (optional)
 * @param {object} meta - Metadatos adicionales (optional)
 * @returns {object} Objeto de respuesta formateado
 */
function createSuccessResponse(data, message = 'Operación exitosa', meta = null) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Middleware: Interceptar errores no controlados en endpoints
 * @param {Function} handler - Handler a ejecutar
 * @returns {Function} Handler envuelto con try-catch
 */
function safeHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Error no controlado en handler:', error.message);
      const { statusCode, body } = createErrorResponse(
        'Error interno del servidor',
        500
      );
      res.status(statusCode).json(body);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  sanitizeString,
  isValidId,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidUsername,
  validatePagination,
  createErrorResponse,
  createSuccessResponse,
  safeHandler
};
