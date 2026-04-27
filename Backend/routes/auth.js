/**
 * RUTA: AUTENTICACIÓN (LOGIN)
 * 
 * Endpoints de autenticación con validación y seguridad
 */

const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validationMiddleware');
const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting para login (prevenir fuerza bruta)
 * Máximo 5 intentos cada 15 minutos por IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos máximo
  message: {
    message: 'Demasiados intentos de login. Intenta en 15 minutos.'
  },
  standardHeaders: true,      // Incluir RateLimit-* headers
  legacyHeaders: false,       // Deshabilitar X-RateLimit-* headers
  skip: (req) => {
    // En desarrollo, opcional saltar rate limit
    return process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true';
  }
});

/**
 * POST /auth/login
 * Autentica usuario y devuelve JWT token
 * 
 * @body {string} username - Nombre de usuario
 * @body {string} password - Contraseña
 * 
 * @returns {Object} token y datos de usuario
 * @throws {400} Validación fallida
 * @throws {401} Credenciales inválidas
 * @throws {403} Usuario inactivo
 * @throws {429} Demasiados intentos
 * @throws {500} Error interno del servidor
 */
router.post('/login', loginLimiter, validateLogin, login);

// Exportar router
module.exports = router;