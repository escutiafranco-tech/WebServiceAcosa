/* ================================ */
/* 1. DEPENDENCIAS Y CONFIGURACIÓN */
/* ================================ */

const path = require('path');                 // Módulo nativo para trabajar con rutas de archivos
const jwt = require('jsonwebtoken');          // Librería para generar y firmar tokens JWT
const bcrypt = require('bcryptjs');           // 🔒 NUEVO: Hashing de contraseñas
const { getSQLiteInstance, get } = require('../utils/database'); // Pool centralizado
const logger = require('../utils/logger');    // 📝 NUEVO: Logging centralizado
const { 
  isValidUsername, 
  createErrorResponse, 
  createSuccessResponse 
} = require('../utils/security'); // Validación y seguridad

// Obtener instancia de BD (reutilizable)
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
let db = null;

// Inicializar BD de forma lazy (al primer uso)
function getDb() {
  if (!db) {
    db = getSQLiteInstance(dbPath);
  }
  return db;
}

/* ================================ */
/* 2. CONTROLADOR: LOGIN DE USUARIO */
/* ================================ */

/**
 * POST /auth/login
 * Autentica usuario contra la tabla USERS usando bcryptjs
 * 
 * @param {Object} req - Request con { username, password } en body
 * @param {Object} res - Response con token JWT o error
 */
exports.login = (req, res) => {
  const { username, password } = req.body;

  // 🔒 VALIDACIÓN MEJORADA
  if (!username || !password) {
    const { statusCode, body } = createErrorResponse('Usuario y contraseña son requeridos');
    return res.status(statusCode).json(body);
  }

  // Validar formato de usuario
  if (!isValidUsername(username)) {
    const { statusCode, body } = createErrorResponse('Usuario inválido');
    return res.status(statusCode).json(body);
  }

  // Limitar longitud de entrada (prevención de DoS)
  if (password.length > 100) {
    const { statusCode, body } = createErrorResponse('Credenciales inválidas');
    return res.status(statusCode).json(body);
  }

  // 🔒 CAMBIO: Obtener SOLO el usuario (no comparar contraseña en SQL)
  // Se compara con bcryptjs después
  getDb().get(
    'SELECT id, username, password_hash, role, activo FROM USERS WHERE username = ? LIMIT 1',
    [username],
    async (err, row) => {
      // Manejo de errores de BD
      if (err) {
        logger.error('Error consultando USERS', { error: err.message, username, event: 'auth.db_error' });
        const { statusCode, body } = createErrorResponse('Error interno de autenticación', 500);
        return res.status(statusCode).json(body);
      }

      // Usuario no encontrado
      if (!row) {
        // 🔒 Mismo mensaje genérico (no revelamos si usuario existe)
        logger.authentication.failure(username, 'usuario_no_encontrado');
        const { statusCode, body } = createErrorResponse('Usuario o contraseña incorrecto', 401);
        return res.status(statusCode).json(body);
      }

      // Usuario inactivo
      if (row.activo === 0) {
        logger.warn('Usuario inactivo intentó acceder', { username, event: 'auth.inactive_user' });
        const { statusCode, body } = createErrorResponse('Usuario inactivo. Contacte al administrador.', 403);
        return res.status(statusCode).json(body);
      }

      // 🔒 NUEVO: Comparar contraseña con hash usando bcryptjs
      try {
        const passwordMatch = await bcrypt.compare(password, row.password_hash);
        
        if (!passwordMatch) {
          // Contraseña incorrecta
          logger.authentication.invalidCredentials(username);
          const { statusCode, body } = createErrorResponse('Usuario o contraseña incorrecto', 401);
          return res.status(statusCode).json(body);
        }

        // 🔒 JWT_SECRET seguro desde .env (DEBE estar configurado)
        const JWT_SECRET = process.env.JWT_SECRET;
        
        if (!JWT_SECRET || JWT_SECRET.length < 32) {
          logger.error('JWT_SECRET no configurado correctamente', { event: 'auth.jwt_config_error' });
          const { statusCode, body } = createErrorResponse('Error interno de autenticación', 500);
          return res.status(statusCode).json(body);
        }

        // Generar token JWT
        const token = jwt.sign(
          { 
            id: row.id, 
            username: row.username, 
            role: row.role 
          },
          JWT_SECRET,
          { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            algorithm: 'HS256'  // 🔒 Especificar algoritmo
          }
        );

        // Actualizar último login
        getDb().run(
          'UPDATE USERS SET last_login = ? WHERE id = ?',
          [new Date().toISOString(), row.id],
          (updateErr) => {
            if (updateErr) {
              console.warn('No se pudo actualizar last_login:', updateErr.message);
            }
          }
        );

        // Respuesta exitosa
        logger.authentication.success(username);
        res.json(createSuccessResponse(
          {
            token,
            usuario: {
              id: row.id,
              username: row.username,
              rol: row.role
            }
          },
          'Autenticación exitosa'
        ));

      } catch (bcryptErr) {
        logger.error('Error comparando contraseña', { error: bcryptErr.message, username, event: 'auth.bcrypt_error' });
        const { statusCode, body } = createErrorResponse('Error interno de autenticación', 500);
        return res.status(statusCode).json(body);
      }
    }
  );
};

/**
 * UTILIDAD: Hashear contraseña
 * Se usa para crear nuevos usuarios o cambiar contraseña
 * 
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Contraseña hasheada
 */
exports.hashPassword = async (password) => {
  try {
    // Rounds: 10 es estándar (más alto = más seguro pero lento)
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (err) {
    throw new Error('Error al hashear contraseña: ' + err.message);
  }
};
