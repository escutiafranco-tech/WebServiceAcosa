# 🔧 GUÍA DE REFACTORIZACIÓN - SOLUCIONES DE CÓDIGO

Este documento contiene ejemplos de código refactorizado para solucionar los problemas identificados en el análisis.

---

## 1. 🔐 SOLUCIÓN: Contraseñas con Hash usando bcryptjs

### Instalación
```bash
npm install bcryptjs
```

### Archivo 1: Backend/utils/password.js (NUEVO)
```javascript
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

/**
 * Hashea una contraseña en texto plano
 * @param {string} plainPassword - Contraseña sin encriptar
 * @returns {Promise<string>} - Contraseña hasheada
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || plainPassword.length < 12) {
    throw new Error('La contraseña debe tener mínimo 12 caracteres');
  }
  
  try {
    return await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  } catch (err) {
    throw new Error(`Error hasheando contraseña: ${err.message}`);
  }
}

/**
 * Compara una contraseña en texto plano con su hash
 * @param {string} plainPassword - Contraseña ingresada por usuario
 * @param {string} hashedPassword - Hash guardado en BD
 * @returns {Promise<boolean>} - True si coinciden
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    throw new Error(`Error verificando contraseña: ${err.message}`);
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
```

### Archivo 2: Backend/controllers/authController.js (REFACTORIZADO)
```javascript
const path = require('path');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../utils/database');
const { verifyPassword } = require('../utils/password');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';

/**
 * Login de usuario
 * POST /auth/login
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Validación de entrada
  if (!username || !password) {
    return res.status(400).json({ 
      message: 'Usuario y contraseña son requeridos' 
    });
  }

  if (typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ 
      message: 'Usuario inválido' 
    });
  }

  try {
    const db = getDatabase();

    // Buscar usuario
    db.get(
      'SELECT id, username, password, role, activo FROM USERS WHERE username = ? LIMIT 1',
      [username],
      async (err, row) => {
        if (err) {
          logger.error(`Error en login para ${username}: ${err.message}`);
          return res.status(500).json({ 
            message: 'Error interno del servidor' 
          });
        }

        // Usuario no existe
        if (!row) {
          logger.warn(`Intento de login fallido: usuario ${username} no existe`);
          return res.status(401).json({ 
            message: 'Usuario o contraseña incorrecto' 
          });
        }

        // Usuario inactivo
        if (row.activo === 0) {
          logger.warn(`Intento de login con usuario inactivo: ${username}`);
          return res.status(403).json({ 
            message: 'Usuario inactivo' 
          });
        }

        // Verificar contraseña con hash
        try {
          const isPasswordValid = await verifyPassword(password, row.password);

          if (!isPasswordValid) {
            logger.warn(`Contraseña incorrecta para ${username}`);
            return res.status(401).json({ 
              message: 'Usuario o contraseña incorrecto' 
            });
          }

          // Generar JWT
          const token = jwt.sign(
            { id: row.id, username: row.username, role: row.role },
            JWT_SECRET,
            { expiresIn: '15m' } // 15 minutos (más seguro)
          );

          // Generar refresh token (para más adelante)
          const refreshToken = jwt.sign(
            { id: row.id },
            process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
            { expiresIn: '7d' }
          );

          logger.info(`Login exitoso para ${username}`);

          res.json({ 
            token,
            refreshToken,
            user: {
              id: row.id,
              username: row.username,
              role: row.role
            }
          });
        } catch (passwordErr) {
          logger.error(`Error verificando contraseña: ${passwordErr.message}`);
          return res.status(500).json({ 
            message: 'Error interno del servidor' 
          });
        }
      }
    );
  } catch (err) {
    logger.error(`Error en login: ${err.message}`);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
};
```

### Archivo 3: Backend/controllers/userController.js (REFACTORIZADO - Crear Usuario)
```javascript
const path = require('path');
const { getDatabase } = require('../utils/database');
const { hashPassword } = require('../utils/password');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validaciones para crear usuario
 */
const validateCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username solo puede contener letras, números, punto, guion y guion bajo'),
  
  body('password')
    .isLength({ min: 12 })
    .withMessage('La contraseña debe tener mínimo 12 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .withMessage('Contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),
  
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/)
    .withMessage('Nombre solo puede contener letras, espacios y guiones'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  
  body('rol')
    .isIn(['Administrador', 'Compras', 'Operador', 'Gerente', 'Usuario'])
    .withMessage('Rol no válido'),
  
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un booleano')
];

/**
 * Crear nuevo usuario
 * POST /api/usuarios
 */
exports.createUser = [
  ...validateCreateUser,
  async (req, res) => {
    // Validar errores de expresión-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validación fallida en createUser: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        message: 'Datos de entrada inválidos',
        errors: errors.array() 
      });
    }

    const { username, password, nombre, email, rol, activo } = req.body;

    try {
      const db = getDatabase();

      // Verificar que el usuario no exista
      db.get(
        'SELECT id FROM USERS WHERE username = ?',
        [username],
        async (err, row) => {
          if (err) {
            logger.error(`Error verificando usuario duplicado: ${err.message}`);
            return res.status(500).json({ 
              message: 'Error interno del servidor' 
            });
          }

          if (row) {
            logger.warn(`Intento de crear usuario duplicado: ${username}`);
            return res.status(409).json({ 
              message: 'El nombre de usuario ya existe' 
            });
          }

          try {
            // Hashear contraseña
            const hashedPassword = await hashPassword(password);

            // Insertar usuario
            const now = new Date().toISOString();
            const nuevoId = `usr_${Date.now()}`;
            const activoValue = activo !== undefined ? (activo ? 1 : 0) : 1;

            db.run(
              `INSERT INTO USERS (
                id, username, password, nombre, email, role, activo, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                nuevoId, 
                username, 
                hashedPassword,  // ✅ Contraseña hasheada
                nombre, 
                email, 
                rol || 'Usuario', 
                activoValue, 
                now
              ],
              function(insErr) {
                if (insErr) {
                  logger.error(`Error creando usuario: ${insErr.message}`);
                  return res.status(500).json({ 
                    message: 'Error al crear usuario' 
                  });
                }

                logger.info(`Usuario creado: ${username} (${nuevoId})`);

                res.status(201).json({
                  id: nuevoId,
                  username,
                  nombre,
                  email,
                  role: rol || 'Usuario',
                  activo: activoValue,
                  created_at: now
                });
              }
            );
          } catch (hashErr) {
            logger.error(`Error hasheando contraseña: ${hashErr.message}`);
            return res.status(500).json({ 
              message: 'Error procesando contraseña' 
            });
          }
        }
      );
    } catch (err) {
      logger.error(`Error en createUser: ${err.message}`);
      res.status(500).json({ 
        message: 'Error interno del servidor' 
      });
    }
  }
];

// Similar para updateUser...
```

---

## 2. 🛡️ SOLUCIÓN: Prevención de SQL Injection

### Instalación
```bash
npm install express-validator
```

### Archivo: Backend/routes/catalogos.js (REFACTORIZADO)
```javascript
const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const { 
  construirSelectDinamico, 
  obtenerMetadataTabla, 
  listarTablasConsulta 
} = require('../utils/catalogBuilder');
const logger = require('../utils/logger');

let dbConnection = null;

function setDatabaseConnection(db) {
  dbConnection = db;
}

/**
 * Validaciones reutilizables
 */
const validateTableName = param('nombreTabla')
  .trim()
  .notEmpty()
  .withMessage('El nombre de tabla es requerido')
  .custom((value) => {
    const tablasPermitidas = listarTablasConsulta();
    if (!tablasPermitidas.includes(value)) {
      throw new Error('Tabla no válida o no permitida');
    }
    return true;
  });

const validateFilter = query('filtro')
  .optional()
  .trim()
  .custom((value) => {
    // Validar formato básico del filtro
    // Ejemplo: columna=valor o columna>100
    if (!/^[A-Za-z_][A-Za-z0-9_]*\s*(=|<|>|<=|>=|!=)\s*[A-Za-z0-9_'"\-\.]+$/.test(value)) {
      throw new Error('Formato de filtro inválido');
    }
    return true;
  });

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit debe estar entre 1 y 1000')
];

/**
 * GET /api/datos/
 * Lista todas las tablas disponibles
 */
router.get('/', (req, res) => {
  try {
    const tablas = listarTablasConsulta();
    
    res.json({
      success: true,
      total: tablas.length,
      tablas_disponibles: tablas
    });
  } catch (err) {
    logger.error(`Error listando tablas: ${err.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Error al listar tablas' 
    });
  }
});

/**
 * GET /api/datos/:nombreTabla/schema
 * Obtiene estructura y metadata
 */
router.get(
  '/:nombreTabla/schema',
  validateTableName,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const { nombreTabla } = req.params;
      const metadata = obtenerMetadataTabla(nombreTabla);
      
      res.json({
        success: true,
        ...metadata
      });
    } catch (err) {
      logger.error(`Error en schema ${req.params.nombreTabla}: ${err.message}`);
      res.status(404).json({ 
        success: false,
        error: err.message 
      });
    }
  }
);

/**
 * GET /api/datos/:nombreTabla
 * Obtiene datos con validación completa
 */
router.get(
  '/:nombreTabla',
  validateTableName,
  validateFilter,
  validatePagination,
  async (req, res) => {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array() 
      });
    }

    try {
      if (!dbConnection) {
        return res.status(503).json({ 
          success: false,
          error: 'Base de datos no conectada' 
        });
      }

      const { nombreTabla } = req.params;
      const { filtro, sortBy, page = 1, limit = 100 } = req.query;

      // Validación de paginación
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(parseInt(limit) || 100, 1000);
      const offset = (pageNum - 1) * limitNum;

      // Construir SELECT base (sanitizado)
      let sql = construirSelectDinamico(nombreTabla);
      let params = [];

      // Agregar WHERE si existe filtro
      if (filtro) {
        // Validación más estricta del filtro
        const filterMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*(=|<|>|<=|>=|!=|LIKE)\s*(.+)$/.exec(filtro);
        
        if (filterMatch) {
          const [, column, operator, value] = filterMatch;
          sql += ` WHERE ${column} ${operator} ?`;
          params.push(value);
        }
      }

      // Agregar ORDER BY si existe
      if (sortBy) {
        const sortMatch = /^([A-Za-z_][A-Za-z0-9_]*):(asc|desc)$/i.exec(sortBy);
        if (sortMatch) {
          const [, column, direction] = sortMatch;
          sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
        }
      }

      // Agregar LIMIT y OFFSET
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limitNum, offset);

      logger.info(`[DATOS] Query para ${nombreTabla}, página ${pageNum}, límite ${limitNum}`);

      // Ejecutar según tipo de BD
      if (typeof dbConnection.all === 'function') {
        // SQLite
        dbConnection.all(sql, params, (err, rows) => {
          if (err) {
            logger.error(`[DATOS] Error SQL: ${err.message}`);
            return res.status(500).json({ 
              success: false,
              error: 'Error al ejecutar consulta' 
            });
          }

          res.json({
            success: true,
            tabla: nombreTabla,
            page: pageNum,
            limit: limitNum,
            total: rows ? rows.length : 0,
            datos: rows || []
          });
        });
      } else {
        // Firebird u otro
        try {
          const result = await dbConnection.query(sql, params);
          res.json({
            success: true,
            tabla: nombreTabla,
            page: pageNum,
            limit: limitNum,
            total: result ? result.length : 0,
            datos: result || []
          });
        } catch (queryErr) {
          logger.error(`[DATOS] Error de query: ${queryErr.message}`);
          res.status(500).json({ 
            success: false,
            error: 'Error al ejecutar consulta' 
          });
        }
      }
    } catch (err) {
      logger.error(`[DATOS] Error general: ${err.message}`);
      res.status(500).json({ 
        success: false,
        error: 'Error procesando solicitud' 
      });
    }
  }
);

/**
 * GET /api/datos/:nombreTabla/sql
 * DEBUG: Retorna el SQL generado (solo en desarrollo)
 */
if (process.env.NODE_ENV === 'development') {
  router.get(
    '/:nombreTabla/sql',
    validateTableName,
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { nombreTabla } = req.params;
        const sql = construirSelectDinamico(nombreTabla);
        
        res.json({ 
          success: true,
          sql, 
          tabla: nombreTabla 
        });
      } catch (err) {
        res.status(404).json({ 
          success: false,
          error: err.message 
        });
      }
    }
  );
}

module.exports = {
  router,
  setDatabaseConnection
};
```

---

## 3. 🔑 SOLUCIÓN: JWT_SECRET Seguro

### Archivo: Backend/utils/jwtConfig.js (NUEVO)
```javascript
/**
 * Configuración segura de JWT
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validación estricta
if (!JWT_SECRET || JWT_SECRET === 'dev_insecure_secret_change_me') {
  console.error('❌ CRÍTICO: JWT_SECRET no está configurado o usa valor por defecto inseguro');
  console.error('   Por favor, configura una variable de entorno JWT_SECRET válida.');
  console.error('   Ejemplo:');
  console.error('   JWT_SECRET=tu-secreto-aleatorio-muy-largo-y-seguro-aqui');
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Fallar en producción
  }
}

if (JWT_SECRET && JWT_SECRET.length < 32) {
  console.warn('⚠️ ADVERTENCIA: JWT_SECRET es muy corto. Recomendamos 32+ caracteres.');
}

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_OPTIONS: {
    expiresIn: '15m',  // Token de acceso corto
    algorithm: 'HS256'
  },
  JWT_REFRESH_OPTIONS: {
    expiresIn: '7d',   // Refresh token largo
    algorithm: 'HS256'
  }
};
```

### Archivo: Backend/Config/.env.example (NUEVO)
```env
# ============================================
# ENTORNO
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# SEGURIDAD - CRÍTICO CAMBIAR EN PRODUCCIÓN
# ============================================
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=tu-secreto-super-largo-y-aleatorio-aqui-cambiar-en-produccion
JWT_REFRESH_SECRET=tu-refresh-secret-diferente-aqui-cambiar-en-produccion
BCRYPT_ROUNDS=10

# ============================================
# BASE DE DATOS
# ============================================
USE_SQLITE=true
DB_PATH=../../Database/acosa_local.db

# Firebird (si se usa en producción)
FB_HOST=localhost
FB_PORT=3050
FB_USER=SYSDBA
FB_PASSWORD=masterkey
FB_DB=../../Database/acosa.fdb
FB_POOL_SIZE=10

# ============================================
# SEGURIDAD ADICIONAL
# ============================================
# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000

# ============================================
# HTTPS (PRODUCCIÓN)
# ============================================
HTTPS_ENABLED=false
HTTPS_CERT_PATH=./certs/cert.pem
HTTPS_KEY_PATH=./certs/key.pem

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
DEBUG=false
```

### Script para generar secreto (Backend/scripts/generate-secrets.js)
```javascript
#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\n🔐 Generador de Secretos Seguros\n');

const jwtSecret = generateSecret(32);
const refreshSecret = generateSecret(32);

console.log('📋 Copia estos valores a tu archivo .env:\n');
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + refreshSecret);
console.log('\n');
```

---

## 4. 🗄️ SOLUCIÓN: Singleton de Conexión a BD

### Archivo: Backend/utils/database.js (NUEVO)
```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

/**
 * Singleton para gestionar conexión a SQLite
 * Evita crear múltiples instancias de Database
 */

let dbInstance = null;
let isInitialized = false;

function initializeDatabase() {
  if (isInitialized) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');

    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error(`Error conectando a BD: ${err.message}`);
        reject(err);
      } else {
        isInitialized = true;
        logger.info('✓ Conectado a SQLite correctamente');
        
        // Configuraciones de BD
        dbInstance.configure('busyTimeout', 5000);
        
        // Enable foreign keys
        dbInstance.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) logger.error(`Error activando foreign keys: ${err.message}`);
        });
        
        resolve(dbInstance);
      }
    });
  });
}

/**
 * Obtener instancia de BD
 * @returns {sqlite3.Database}
 */
function getDatabase() {
  if (!dbInstance) {
    throw new Error('Base de datos no inicializada. Llama a initializeDatabase() primero.');
  }
  return dbInstance;
}

/**
 * Ejecutar consulta con promesas
 * @param {string} sql - Consulta SQL
 * @param {array} params - Parámetros
 * @returns {Promise}
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Para SELECT
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      // Para INSERT, UPDATE, DELETE
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ 
          lastID: this.lastID,
          changes: this.changes 
        });
      });
    }
  });
}

/**
 * Cerrar conexión
 */
function closeDatabase() {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) {
        logger.error(`Error cerrando BD: ${err.message}`);
      } else {
        logger.info('✓ Conexión a BD cerrada');
        dbInstance = null;
        isInitialized = false;
      }
    });
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  closeDatabase
};
```

### Uso en Backend/server.js
```javascript
const { initializeDatabase, closeDatabase } = require('./utils/database');

// Al iniciar servidor
async function startServer() {
  try {
    // Inicializar BD
    await initializeDatabase();
    
    // Iniciar servidor Express
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    logger.error(`Error iniciando servidor: ${err.message}`);
    process.exit(1);
  }
}

startServer();

// Al cerrar proceso
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando conexión...');
  closeDatabase();
  process.exit(0);
});
```

---

## 5. 🚨 SOLUCIÓN: Rate Limiting y CORS

### Instalación
```bash
npm install express-rate-limit cors helmet
```

### Archivo: Backend/config/middleware.js (NUEVO)
```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('../utils/logger');

/**
 * Rate Limit: Proteger contra brute force
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos máximo
  message: 'Demasiados intentos de login, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para ${req.ip} en /auth/login`);
    res.status(429).json({
      message: 'Demasiados intentos, intenta más tarde'
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests
  message: 'Demasiadas peticiones, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CORS Configuration
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 horas
};

/**
 * Middleware de seguridad
 */
function setupSecurityMiddleware(app) {
  // Headers de seguridad
  app.use(helmet());
  
  // CORS
  app.use(cors(corsOptions));
  
  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  // Rate limiting
  app.use('/auth/login', loginLimiter);
  app.use('/api/', apiLimiter);
  
  // Logging de peticiones
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    
    if (err.status === 429) {
      return res.status(429).json({
        message: 'Demasiadas peticiones'
      });
    }
    
    res.status(err.status || 500).json({
      message: process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor'
        : err.message
    });
  });
}

module.exports = {
  setupSecurityMiddleware,
  loginLimiter,
  apiLimiter
};
```

### Uso en Backend/server.js
```javascript
const { setupSecurityMiddleware } = require('./config/middleware');

// ... después de crear app con express()

setupSecurityMiddleware(app);

// Resto de rutas y configuración
```

---

## 6. 📝 SOLUCIÓN: Logger Centralizado

### Archivo: Backend/utils/logger.js (NUEVO)
```javascript
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

function timestamp() {
  return new Date().toISOString();
}

function formatLog(level, message) {
  return `[${timestamp()}] [${level}] ${message}`;
}

function writeToFile(level, message) {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const logEntry = formatLog(level, message) + '\n';
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error(`Error escribiendo log: ${err.message}`);
  });
}

const logger = {
  error(message) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      const log = formatLog('ERROR', message);
      console.error(log);
      writeToFile('ERROR', message);
    }
  },

  warn(message) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      const log = formatLog('WARN', message);
      console.warn(log);
      writeToFile('WARN', message);
    }
  },

  info(message) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      const log = formatLog('INFO', message);
      console.log(log);
      writeToFile('INFO', message);
    }
  },

  debug(message) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      const log = formatLog('DEBUG', message);
      console.log(log);
      if (process.env.DEBUG === 'true') {
        writeToFile('DEBUG', message);
      }
    }
  }
};

module.exports = logger;
```

---

## 7. 📦 ACTUALIZAR package.json

```json
{
  "name": "webserviceacosa",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node Backend/server.js",
    "dev": "NODE_ENV=development node Backend/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "db:init": "node Backend/scripts/init-db.js",
    "db:seed": "node Backend/scripts/seed.js",
    "generate:secrets": "node Backend/scripts/generate-secrets.js",
    "invoices:excel": "node Scripts/scripts/generate-invoice-excel.js",
    "lint": "eslint Backend/",
    "format": "prettier --write Backend/"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "exceljs": "^4.3.0",
    "express": "^5.2.1",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.0",
    "fast-xml-parser": "^4.5.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.0",
    "node-firebird": "^1.0.5",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.0",
    "supertest": "^6.3.3"
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Instalar nuevas dependencias: `npm install bcryptjs cors helmet express-rate-limit express-validator morgan`
- [ ] Crear `Backend/utils/password.js` con funciones de hash
- [ ] Crear `Backend/utils/database.js` singleton
- [ ] Crear `Backend/utils/logger.js` centralizado
- [ ] Refactorizar `Backend/controllers/authController.js`
- [ ] Refactorizar `Backend/controllers/userController.js`
- [ ] Refactorizar `Backend/routes/catalogos.js`
- [ ] Crear `Backend/Config/.env.example`
- [ ] Generar secretos: `node Backend/scripts/generate-secrets.js`
- [ ] Crear `.env` local con secretos generados
- [ ] Agregar validaciones en todas las rutas
- [ ] Actualizar `Backend/server.js` para usar middleware
- [ ] Tests unitarios para controladores
- [ ] Tests E2E para flujos críticos

---

*Fin de la guía de refactorización*
