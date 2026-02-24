/* ================================ */
/* 1. DEPENDENCIAS Y CONFIGURACIÓN */
/* ================================ */

const jwt = require('jsonwebtoken'); // Librería para verificar y decodificar tokens JWT

// Clave secreta para firmar/verificar tokens
// Se recomienda definir JWT_SECRET en el archivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';

/* ================================ */
/* 2. MIDDLEWARE: PROTEGER RUTAS   */
/* ================================ */

// Middleware `protect`
// - Lee el encabezado Authorization
// - Verifica el token JWT
// - Si es válido, adjunta los datos del usuario en req.user
// - Si no, responde con 401 (no autorizado)
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization; // Encabezado Authorization enviado por el cliente

  // Validamos que exista y que comience con "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  // Extraemos sólo el token (segunda parte del encabezado)
  const token = authHeader.split(' ')[1];

  try {
    // Verificamos y decodificamos el token usando el secreto
    const decoded = jwt.verify(token, JWT_SECRET);

    // Guardamos la información del usuario en la request para uso posterior
    req.user = decoded;

    // Continuamos con el siguiente middleware/controlador
    next();
  } catch (err) {
    // Si la verificación falla (token inválido o expirado) devolvemos 401
    res.status(401).json({ message: 'Token inválido' });
  }
};

/* ================================ */
/* 3. MIDDLEWARE: SOLO ADMIN       */
/* ================================ */

// Middleware `adminOnly`
// - Debe ir DESPUÉS de `protect`
// - Verifica que el usuario tenga rol de Administrador
// - Si no, responde con 403 (prohibido)
exports.adminOnly = (req, res, next) => {
  // Verificamos que req.user exista (debe venir del middleware protect)
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  // Comparamos el rol del usuario
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
  }

  // Si es admin, continuamos
  next();
};