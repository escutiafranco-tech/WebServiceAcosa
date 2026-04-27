/**
 * Logger Centralizado - Winston
 * 
 * Propósito: Proporcionar logging consistente en toda la aplicación
 * - Logs a archivos (error.log, combined.log)
 * - Logs a consola en desarrollo
 * - Formato estructurado con timestamp
 * - Niveles: error, warn, info, debug
 * 
 * Uso:
 *   const logger = require('./utils/logger');
 *   logger.info('Mensaje informativo');
 *   logger.error('Error:', error);
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Incluir stack trace si existe
    const stackTrace = stack ? `\n${stack}` : '';
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${stackTrace}${metaStr}`;
  })
);

// Transportes
const transports = [
  // Archivo de errores (solo errores)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),

  // Archivo combinado (todos los niveles)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Agregar consola en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const stackTrace = stack ? `\n${stack}` : '';
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `[${timestamp}] ${level}: ${message}${stackTrace}${metaStr}`;
        })
      ),
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

/**
 * Logger Wrapper con métodos de conveniencia
 */
module.exports = {
  // Niveles básicos
  error: (message, error = null) => {
    logger.error(message, { error: error ? error.message : null, stack: error ? error.stack : null });
  },
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Métodos específicos de negocio
  authentication: {
    success: (username) => logger.info('Login exitoso', { username, event: 'auth.success' }),
    failure: (username, reason) => logger.warn('Login fallido', { username, reason, event: 'auth.failure' }),
    invalidCredentials: (username) => logger.warn('Credenciales inválidas', { username, event: 'auth.invalid' }),
  },

  database: {
    query: (sql, duration) => logger.debug('Query ejecutada', { sql, duration_ms: duration, event: 'db.query' }),
    error: (sql, error) => logger.error('Error en query', { sql, error: error.message, event: 'db.error' }),
    connected: () => logger.info('Conexión a BD establecida', { event: 'db.connected' }),
    poolInitialized: () => logger.info('Pool SQLite inicializado', { event: 'db.pool_initialized' }),
  },

  api: {
    request: (method, path, ip) => logger.debug('Request recibido', { method, path, ip, event: 'api.request' }),
    response: (method, path, statusCode, duration) => logger.info('Response enviado', { method, path, statusCode, duration_ms: duration, event: 'api.response' }),
    error: (method, path, statusCode, message) => logger.error('Error en endpoint', { method, path, statusCode, message, event: 'api.error' }),
  },

  validation: {
    failed: (type, value, reason) => logger.warn('Validación fallida', { type, value, reason, event: 'validation.failed' }),
    passed: (type) => logger.debug('Validación exitosa', { type, event: 'validation.passed' }),
  },

  security: {
    unauthorized: (endpoint, reason) => logger.warn('Acceso no autorizado', { endpoint, reason, event: 'security.unauthorized' }),
    rateLimited: (ip) => logger.warn('Rate limit excedido', { ip, event: 'security.rate_limited' }),
    xssAttempt: (content) => logger.warn('XSS attempt detectado', { content: content.substring(0, 100), event: 'security.xss' }),
  },

  // Winston logger directo si se necesita algo custom
  winston: logger,
};
