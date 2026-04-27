# 📊 ANÁLISIS EXHAUSTIVO DEL PROYECTO ACOSA

**Fecha:** 23 de abril de 2026  
**Alcance:** Análisis completo de arquitectura, código, seguridad y mejores prácticas

---

## ⚡ RESUMEN EJECUTIVO - 5 HALLAZGOS CLAVE

### 1. 🔴 CRÍTICO: Contraseñas Almacenadas en Texto Plano
- **Archivos afectados:** `Backend/controllers/authController.js`, `Backend/controllers/userController.js`
- **Problema:** Las contraseñas se guardan sin cifrar en la base de datos
- **Impacto:** Si la BD se compromete, todas las contraseñas son expuestas
- **Líneas críticas:** 
  - authController.js línea 30-31: Comparación de texto plano `password = ?`
  - userController.js línea 77-78: INSERT sin hash
- **Recomendación:** Usar `bcryptjs` para hash + salt

### 2. 🔴 CRÍTICO: SQL Injection en Catálogos Dinámicos
- **Archivo:** `Backend/routes/catalogos.js` línea 48-49
- **Código problemático:** 
  ```javascript
  const sql = filtro ? `${selectBase} WHERE ${filtro}` : selectBase;
  ```
- **Problema:** El parámetro `filtro` se concatena directamente a la consulta SQL
- **Ataque ejemplo:** `GET /api/datos/TBL_PROV_GLOBAL?filtro=1; DROP TABLE USERS;--`
- **Recomendación:** Usar parameterización de consultas + validación de filtro

### 3. 🔴 CRÍTICO: JWT_SECRET Inseguro por Defecto
- **Archivo:** `Backend/controllers/authMiddleware.js` línea 9
- **Código:** `const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';`
- **Problema:** Secreto por defecto débil y expuesto en el código
- **Impacto:** Tokens pueden ser falsificados en desarrollo/si .env no está configurado
- **Recomendación:** Generar secreto aleatorio en instalación, error si no está en .env

### 4. ⚠️ ARQUITECTURA: Duplicación de Conexiones a BD
- **Archivos afectados:** `authController.js` (línea 8), `userController.js` (línea 4), `checkTableStructure.js` (línea 1), `seedProveedores.js` (línea 1)
- **Problema:** Cada controlador/script crea su propia instancia de `sqlite3.Database`
- **Impacto:** Sin pool de conexiones, desperdicio de recursos, sin reutilización
- **Líneas problemáticas:**
  ```javascript
  // authController.js línea 8
  const db = new sqlite3.Database(dbPath);
  
  // userController.js línea 4  
  const db = new sqlite3.Database(dbPath);
  
  // ... más instancias en otros archivos
  ```
- **Recomendación:** Crear módulo singleton `Backend/utils/database.js` con pool

### 5. ⚠️ SEGURIDAD: Sin Rate Limiting ni CORS Configurado
- **Archivo:** `Backend/server.js` línea 79-80 (configuración del express.json)
- **Problema:** 
  - No hay middleware de rate limiting (vulnerable a brute force en /auth/login)
  - CORS no está explícitamente configurado
  - Ningún middleware CSRF
- **Impacto:** Ataques de fuerza bruta en autenticación, peticiones desde dominio no autorizado
- **Recomendación:** Agregar `express-rate-limit`, `cors`, `helmet`

---

## 🔒 PROBLEMAS DE SEGURIDAD DETALLADOS

### A. AUTENTICACIÓN Y AUTORIZACIÓN

#### Problema 1.1: Comparación de Contraseñas sin Hash
**Archivo:** `Backend/controllers/authController.js` (líneas 27-54)
```javascript
db.get(
    'SELECT id, username, password, role, activo FROM USERS WHERE username = ? AND password = ? LIMIT 1',
    [username, password],  // ⚠️ PASSWORD EN TEXTO PLANO
    (err, row) => {
      // ...
    }
);
```
**Problemas:**
- Contraseñas visibles en logs de BD si hay auditoría
- No hay protección contra timing attacks
- Incumple OWASP: A02:2021 – Cryptographic Failures

**Solución:**
```javascript
// 1. En creación de usuario, usar bcryptjs:
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
// Guardar hashedPassword

// 2. En login:
const isMatch = await bcrypt.compare(password, row.password);
if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });
```

#### Problema 1.2: Token JWT con Expiración Corta pero Sin Refresh Token
**Archivo:** `Backend/controllers/authController.js` línea 51
```javascript
{ expiresIn: '2h' } // Token caduca en 2 horas
```
**Problema:**
- 2 horas es muy larga para un token que no se puede revocar
- No hay refresh token strategy
- Si el token se compromete, acceso durante 2 horas completas
- No hay mecanismo de logout/revocación

**Solución:**
```javascript
// Token de acceso corto (15 minutos)
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

// Refresh token largo (7 días) guardado en BD
const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

// Endpoint POST /auth/refresh para renovar
```

#### Problema 1.3: Sin Validación de Roles en Algunos Endpoints
**Archivo:** `Backend/controllers/menuController.js` (línea 16-19)
```javascript
const getMenusByRole = (req, res) => {
  try {
    const userRole = req.user.role; // Asume que req.user existe
    // No valida que req.user sea un objeto válido
```
**Problema:**
- Si authMiddleware.js no se aplica correctamente, `req.user` puede ser undefined
- No hay validación de rol existente en la BD

**Solución:**
```javascript
const validateRole = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  const rolesValidos = ['Administrador', 'Compras', 'Operador', 'Gerente'];
  if (!rolesValidos.includes(req.user.role)) {
    return res.status(403).json({ message: 'Rol no válido' });
  }
  next();
};
```

---

### B. INYECCIÓN SQL Y VALIDACIÓN DE ENTRADA

#### Problema 2.1: SQL Injection en Parámetro "filtro"
**Archivo:** `Backend/routes/catalogos.js` (líneas 44-57)
```javascript
router.get('/:nombreTabla', async (req, res) => {
  try {
    const { nombreTabla } = req.params;
    const { filtro } = req.query; // ⚠️ NO SANITIZADO
    
    const selectBase = construirSelectDinamico(nombreTabla);
    const sql = filtro ? `${selectBase} WHERE ${filtro}` : selectBase; // ⚠️ CONCATENACIÓN DIRECTA
    
    console.log(`[DATOS] Ejecutando query para ${nombreTabla}...`);
    
    if (typeof dbConnection.all === 'function') {
      dbConnection.all(sql, [], (err, rows) => { // ⚠️ SIN PARÁMETROS
```

**Ataque de ejemplo:**
```
GET /api/datos/TBL_PROV_GLOBAL?filtro=1; DROP TABLE USERS;--
GET /api/datos/TBL_PROV_GLOBAL?filtro=1 UNION SELECT username, password FROM USERS--
```

**Solución:**
```javascript
router.get('/:nombreTabla', async (req, res) => {
  try {
    const { nombreTabla } = req.params;
    const { filtro, sortBy, limit, offset } = req.query;
    
    // 1. Validar nombreTabla contra whitelist
    const tablasPermitidas = listarTablasConsulta();
    if (!tablasPermitidas.includes(nombreTabla)) {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    
    // 2. Validar filtro con expresión regular
    if (filtro && !/^[A-Za-z0-9_.,=()'"\s\-<>!]*$/.test(filtro)) {
      return res.status(400).json({ error: 'Filtro contiene caracteres inválidos' });
    }
    
    // 3. Usar consulta parametrizada
    const selectBase = construirSelectDinamico(nombreTabla);
    let sql = selectBase;
    let params = [];
    
    if (filtro) {
      // Validar que filtro sea un WHERE válido
      const whereMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*(=|<|>|<=|>=|!=)\s*(.+)$/.exec(filtro);
      if (whereMatch) {
        const [, column, operator, value] = whereMatch;
        sql += ` WHERE ${column} ${operator} ?`;
        params.push(value);
      }
    }
    
    // Aplicar límite y offset
    const limitVal = Math.min(parseInt(limit) || 100, 1000); // Max 1000
    const offsetVal = Math.max(parseInt(offset) || 0, 0);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limitVal, offsetVal);
    
    // Ejecutar con parámetros
    dbConnection.all(sql, params, (err, rows) => {
      if (err) {
        console.error('[DATOS] Error SQL:', err.message);
        return res.status(500).json({ error: 'Error al recuperar datos' });
      }
      res.json({
        tabla: nombreTabla,
        total: rows ? rows.length : 0,
        datos: rows || []
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### Problema 2.2: Falta Validación de Entrada en Creación de Usuarios
**Archivo:** `Backend/controllers/userController.js` (líneas 56-87)
```javascript
exports.createUser = (req, res) => {
  const { username, password, nombre, email, rol, activo } = req.body;

  // Validaciones INCOMPLETAS
  if (!username || !password || !nombre || !email || !rol) {
    return res.status(400).json({ message: 'Campos obligatorios faltantes' });
  }

  if (password.length < 4) {  // ⚠️ Longitud mínima muy corta
    return res.status(400).json({ message: 'La contraseña debe tener al menos 4 caracteres' });
  }
  // ⚠️ NO VALIDA: formato email, caracteres especiales en username, longitud máxima
```

**Problemas:**
- Contraseña mínimo 4 caracteres (OWASP recomienda 8+)
- Sin validación de formato email
- Sin validación de longitud máxima
- Sin validación de caracteres válidos
- Sin sanitización de entrada

**Solución:**
```javascript
const { body, validationResult } = require('express-validator');

const validateCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username solo puede contener letras, números, punto, guion y guion bajo')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 12 })
    .withMessage('La contraseña debe tener mínimo 12 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .withMessage('La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/)
    .withMessage('Nombre solo puede contener letras, espacios y guiones'),
  body('rol')
    .isIn(['Administrador', 'Compras', 'Operador', 'Gerente', 'Usuario'])
    .withMessage('Rol no válido')
];

exports.createUser = [
  ...validateCreateUser,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // ... resto del código
  }
];
```

---

### C. MANEJO DE ERRORES Y LOGGING

#### Problema 3.1: Falta Manejo Consistente de Errores
**Archivo:** `Backend/server.js` (líneas múltiples)
```javascript
// A veces retorna 500 con mensaje genérico
res.status(500).json({ message: 'Error interno de autenticación' });

// A veces retorna error completo
res.status(500).json({ error: err.message }); // ⚠️ EXPONE DETALLES DE ERROR

// A veces no retorna nada
db.close(); // Sin comprobar error
```

**Problemas:**
- Inconsistencia en formato de respuestas
- Expone detalles técnicos en errores
- No hay centralización de manejo de errores
- Sin logging adecuado

**Solución:**
```javascript
// Backend/utils/errors.js
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Error interno del servidor';

  // No revelar detalles de error en producción
  if (process.env.NODE_ENV === 'production') {
    if (err.statusCode === 500) {
      err.message = 'Error interno del servidor';
    }
  }

  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// En server.js:
app.use(errorHandler);
```

#### Problema 3.2: Sin Logging Centralizado
**Archivos:** Todos los controladores usan `console.error()` y `console.log()`

**Problema:**
- Logs se pierden después de reinicio
- Sin niveles de severidad
- Sin timestamps automáticos
- Difícil de filtrar y buscar

**Solución:**
```javascript
// Backend/utils/logger.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => {
    if (process.env.DEBUG) console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
  }
};

module.exports = logger;

// Uso:
const logger = require('./utils/logger');
logger.error('Error al conectar a BD:', err.message);
```

---

## 🏗️ PROBLEMAS DE ARQUITECTURA

### A. SEPARACIÓN DE RESPONSABILIDADES

#### Problema 4.1: Conexión a BD Duplicada en Múltiples Archivos
**Archivos afectados:**
- `Backend/controllers/authController.js` línea 8
- `Backend/controllers/userController.js` línea 4
- `checkTableStructure.js` línea 1
- `seedProveedores.js` línea 1

```javascript
// Cada archivo hace esto:
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '...', 'Database', 'acosa_local.db');
const db = new sqlite3.Database(dbPath);
```

**Problemas:**
- Código duplicado (DRY violation)
- Sin pool de conexiones
- Mayor consumo de memoria
- Difícil de cambiar la configuración centralizada

**Solución:**
```javascript
// Backend/utils/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error conectando a BD:', err.message);
        process.exit(1);
      }
      console.log('✓ Conectado a SQLite');
    });
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) console.error('Error cerrando BD:', err.message);
      dbInstance = null;
    });
  }
}

module.exports = { getDatabase, closeDatabase };

// Uso en controladores:
const { getDatabase } = require('../utils/database');
const db = getDatabase();
```

#### Problema 4.2: Middleware y Controladores sin Separación Clara
**Archivo:** `Backend/controllers/menuController.js` (líneas 15-33)
```javascript
const getMenusByRole = (req, res) => {
  try {
    console.log('🔍 Usuario:', req.user); // Logging en controlador
    const userRole = req.user.role;
    console.log('🎯 Rol del usuario:', userRole); // Logging excesivo en prod
    const filteredModules = menusData
      .map((module) => {
        console.log('📦 Procesando módulo:', module.module); // Logging línea por línea
        // ... 30 líneas de lógica de filtrado
```

**Problema:**
- Logging mezclado con lógica de negocio
- Sin función separada para filtrado de menús
- Difícil de testear

**Solución:**
```javascript
// Backend/utils/menuFilter.js
function filterMenusByRole(menus, userRole) {
  return menus
    .map((module) => {
      const filteredMenus = module.menus.filter((menu) =>
        menu.roles && menu.roles.includes(userRole)
      );
      return filteredMenus.length > 0 ? { ...module, menus: filteredMenus } : null;
    })
    .filter((module) => module !== null);
}

module.exports = { filterMenusByRole };

// En controlador:
const { filterMenusByRole } = require('../utils/menuFilter');

exports.getMenusByRole = (req, res) => {
  try {
    const filteredModules = filterMenusByRole(menusData, req.user.role);
    logger.info(`Menús filtrados para rol: ${req.user.role}`);
    res.json(filteredModules);
  } catch (error) {
    logger.error(`Error en menús: ${error.message}`);
    res.status(500).json({ error: 'Error al obtener menús' });
  }
};
```

---

### B. CONFIGURACIÓN Y VARIABLES DE ENTORNO

#### Problema 5.1: .env no Está Incluido en el Repositorio
**Ubicación esperada:** `Backend/Config/.env`

**Problema:**
- Secreto JWT por defecto inseguro
- Credenciales de BD sin configuración

**Solución:**
```bash
# Backend/Config/.env.example (incluir en repo)
NODE_ENV=development
PORT=3000
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar-en-produccion
JWT_REFRESH_SECRET=tu-refresh-secret-aqui
BCRYPT_ROUNDS=10

# Base de datos
USE_SQLITE=true
DB_PATH=../../Database/acosa_local.db

# Firebird (si se usa)
FB_HOST=localhost
FB_PORT=3050
FB_USER=SYSDBA
FB_PASSWORD=masterkey
FB_POOL_SIZE=10

# Logging
LOG_LEVEL=info
DEBUG=false

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW=15 # minutos
RATE_LIMIT_MAX_REQUESTS=100

# Certificados HTTPS
HTTPS_CERT_PATH=./certs/cert.pem
HTTPS_KEY_PATH=./certs/key.pem
```

```javascript
// Backend/config/env.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const requiredEnvs = ['JWT_SECRET', 'NODE_ENV'];

requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Variable de entorno requerida no definida: ${env}`);
  }
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  // ... más configuraciones
};
```

---

## 🐛 PROBLEMAS DE CÓDIGO ESPECÍFICOS

### Frontend: Variables Globales Expuestas

#### Problema 6.1: Demasiadas Variables Globales en proveedores.js
**Archivo:** `Modules/compras/proveedores/proveedores.js` (líneas 10-21)
```javascript
// Variables GLOBALES (accesibles desde consola del navegador)
var proveedores = [];                        // ⚠️ GLOBAL
var soloActivos = false;                     // ⚠️ GLOBAL
var columnasVisiblesGlobal = [];             // ⚠️ GLOBAL
var sortState = {};                          // ⚠️ GLOBAL
var filtroActualProveedores = '';            // ⚠️ GLOBAL

// Objeto GLOBAL que expone referencias del DOM
var ProveedoresDOM = {
  listaProveedores: null,
  loading: null,
  txtBuscar: null,
  // ... 30+ referencias más
};
```

**Problemas:**
- Vulnerables a ataques de consola (modificar `window.proveedores = []`)
- Contaminan el espacio global
- Imposible tener múltiples instancias
- Difícil de debuggear

**Solución:**
```javascript
// Modules/compras/proveedores/proveedores-module.js
const ProveedoresModule = (() => {
  // Variables PRIVADAS (encapsuladas)
  let proveedores = [];
  let soloActivos = false;
  let columnasVisiblesGlobal = [];
  let sortState = {};
  let filtroActualProveedores = '';

  // Referencias del DOM (privadas)
  const dom = {
    listaProveedores: null,
    loading: null,
    txtBuscar: null,
    // ... etc
  };

  // API PÚBLICA
  return {
    init() {
      this._initDOM();
      this._attachEventListeners();
      this._loadData();
    },

    getProveedores() {
      return [...proveedores]; // Retorna copia para evitar modificaciones
    },

    setFiltro(filtro) {
      filtroActualProveedores = filtro;
      this._applyFilter();
    },

    _initDOM() {
      dom.listaProveedores = document.getElementById('listaProveedores');
      dom.loading = document.getElementById('loadingProveedores');
      // ... etc
    },

    _attachEventListeners() {
      // Listeners aquí
    },

    _loadData() {
      // Cargar datos
    },

    _applyFilter() {
      // Aplicar filtro
    }
  };
})();

// Uso:
document.addEventListener('DOMContentLoaded', () => {
  ProveedoresModule.init();
});
```

---

### Problemas de Frontend: Renderización de Menús

#### Problema 6.2: Función renderMenus() muy Larga sin Modularización
**Archivo:** `Public/app.js` (líneas 1-60+)
```javascript
function renderMenus(menus) {
    menusDiv.innerHTML = '';
    menus.forEach(menu => {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');

        if (menu.image) {
            const img = document.createElement('img');
            img.src = menu.image;
            menuItem.appendChild(img);
        }

        const text = document.createElement('span');
        text.textContent = menu.name;
        menuItem.appendChild(text);

        menusDiv.appendChild(menuItem);

        // Submenus
        if (menu.submenus && menu.submenus.length) {
            const submenuDiv = document.createElement('div');
            submenuDiv.classList.add('submenu');

            menu.submenus.forEach(sub => {
                // ... 30 líneas más de lógica anidada
```

**Problemas:**
- Sin reutilización (DRY)
- Difícil de testear
- Sin separación de responsabilidades

**Solución:**
```javascript
// Public/utils/menu-renderer.js
class MenuRenderer {
  constructor(containerElement) {
    this.container = containerElement;
  }

  render(menus) {
    this.container.innerHTML = '';
    menus.forEach(menu => this._renderModule(menu));
  }

  _renderModule(module) {
    const moduleDiv = this._createModuleDiv(module);
    this.container.appendChild(moduleDiv);
  }

  _createModuleDiv(module) {
    const div = document.createElement('div');
    div.className = 'menu-module';

    const header = this._createMenuHeader(module);
    div.appendChild(header);

    if (module.menus?.length > 0) {
      const submenu = this._createSubmenus(module.menus);
      div.appendChild(submenu);
    }

    return div;
  }

  _createMenuHeader(menu) {
    const header = document.createElement('div');
    header.className = 'menu-item';

    if (menu.image) {
      const img = document.createElement('img');
      img.src = menu.image;
      header.appendChild(img);
    }

    const text = document.createElement('span');
    text.textContent = menu.name;
    header.appendChild(text);

    return header;
  }

  _createSubmenus(menus) {
    const container = document.createElement('div');
    container.className = 'submenu';

    menus.forEach(menu => {
      container.appendChild(this._createSubmenuItem(menu));
    });

    return container;
  }

  _createSubmenuItem(menu) {
    const item = document.createElement('div');
    item.className = 'submenu-item';

    if (menu.image) {
      const img = document.createElement('img');
      img.src = menu.image;
      img.style.width = '20px';
      item.appendChild(img);
    }

    const text = document.createElement('span');
    text.textContent = menu.name;
    item.appendChild(text);

    return item;
  }
}

// Uso:
const renderer = new MenuRenderer(document.getElementById('menuContainer'));
renderer.render(menus);
```

---

## ✅ COSAS QUE ESTÁ BIEN

### 1. Separación de Capas (Controladores, Rutas, Utilidades)
**Evidencia:**
- `Backend/controllers/` - Lógica de negocio
- `Backend/routes/` - Definiciones de rutas
- `Backend/utils/` - Funciones auxiliares

**Por qué está bien:**
- Fácil de mantener y escalar
- Controladores enfocados en una responsabilidad
- Rutas limpias y claras

```javascript
// Backend/routes/auth.js (bien organizado)
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);
module.exports = router;
```

### 2. Sistema de Autenticación con JWT
**Evidencia:**
- `Backend/controllers/authMiddleware.js` - Middleware de protección
- `Backend/controllers/authController.js` - Generación de tokens

**Por qué está bien:**
- JWT es stateless (sin sesiones en servidor)
- Fácil de escalar a múltiples servidores
- Compatible con arquitecturas de microservicios

```javascript
// Backend/controllers/authMiddleware.js (bien implementado)
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### 3. Sistema de Roles y Control de Acceso
**Evidencia:**
- `Backend/controllers/authMiddleware.js` línea 44-57 - `adminOnly` middleware
- `Backend/routes/usuarios.js` - Rutas protegidas por rol
- `Backend/system/menus.json` - Menús filtrados por rol

**Por qué está bien:**
- Control granular de acceso
- Fácil de agregar nuevos roles
- Filtrado tanto en servidor como en frontend

```javascript
// Backend/routes/usuarios.js (bien protegido)
router.get('/', protect, adminOnly, userController.getAllUsers);
router.post('/', protect, adminOnly, userController.createUser);
router.put('/:id', protect, adminOnly, userController.updateUser);
```

### 4. Arquitectura Modular del Frontend
**Evidencia:**
- `Modules/compras/proveedores/` - Módulo independiente
- `Modules/administracion/usuarios/` - Otro módulo
- Estructura: HTML, JS, y CSS por módulo

**Por qué está bien:**
- Fácil de agregar nuevos módulos
- Cada módulo es autocontecido
- Sistema de tabs para múltiples módulos abiertos

### 5. Sistema de Catálogos Dinámicos
**Evidencia:**
- `Backend/utils/catalogBuilder.js` - Generador de consultas
- `Backend/system/catalogs.json` - Metadata de tablas
- `Backend/routes/catalogos.js` - API de datos

**Por qué está bien:**
- **Reutilizable:** Un único endpoint `/api/datos/:tabla` para todas las tablas
- **Mantenible:** Cambios en schema se hacen en JSON
- **Extensible:** Fácil agregar nuevas tablas de consulta

```javascript
// Backend/utils/catalogBuilder.js (arquitectura elegante)
function construirSelectDinamico(nombreTabla) {
  const metadata = loadCatalogMetadata();
  const tabla_consulta = metadata.tablas_consulta[nombreTabla];
  
  if (!tabla_consulta) {
    throw new Error(`Tabla no encontrada`);
  }
  
  // Construye SELECT con JOINs dinámicamente
  let selectCols = [];
  tabla_consulta.columnas_base.forEach(col => {
    selectCols.push(`${tabla_consulta.alias_base}.${col.nombre} AS ${col.nombre}`);
  });
  
  // Agrega joins activos
  tabla_consulta.joins.forEach(join => {
    if (join.activo !== false) {
      join.columnas.forEach(col => {
        selectCols.push(`${join.alias}.${col.nombre} AS ${col.nombre}`);
      });
    }
  });
  
  const sql = `SELECT DISTINCT ${selectCols.join(', ')} FROM ...`;
  return sql;
}
```

---

## 📋 PROBLEMAS DOCUMENTADOS

### Falta de Documentación Crítica

1. **SIN README.md** - No hay guía de instalación o uso
2. **SIN API.md** - No hay documentación de endpoints
3. **SIN .env.example** - No hay plantilla de configuración
4. **SIN TESTS** - No hay tests unitarios ni E2E
5. **SIN COMMENTS en funciones complejas** - Especialmente en `catalogBuilder.js`
6. **SIN GUÍA DE DEPLOY** - Cómo poner en producción

### Documento que Falta Crear: README.md

```markdown
# 🚀 ACOSA WebService

Sistema de gestión integral para proveedores, clientes y logística.

## 🎯 Funcionalidades

- Gestión de proveedores (catálogo global con dimensiones)
- Gestión de usuarios y roles
- Sistema de menús dinámicos
- Catálogos de productos y servicios
- Reportes de compras
- Logística y aduanas

## 📋 Requisitos Previos

- Node.js >= 14.0
- npm >= 6.0
- SQLite3 (para desarrollo)
- Firebird (opcional, para producción)

## 🔧 Instalación

1. Clonar repositorio
   ```bash
   git clone ...
   cd WEBSERVICE\ ACOSA
   ```

2. Instalar dependencias
   ```bash
   npm install
   ```

3. Configurar variables de entorno
   ```bash
   cp Backend/Config/.env.example Backend/Config/.env
   # Editar .env con tus valores
   ```

4. Crear base de datos
   ```bash
   npm run db:init
   ```

5. Iniciar servidor
   ```bash
   npm start
   # El servidor estará en http://localhost:3000
   ```

## 🔐 Seguridad

### Usuarios por Defecto
- **Admin:** admin / admin (⚠️ CAMBIAR EN PRODUCCIÓN)

### Secretos
- JWT_SECRET debe ser una cadena aleatoria de 32+ caracteres
- Cambiar todos los valores por defecto en producción

## 📚 Documentación API

### Autenticación

**POST /auth/login**
```json
{
  "username": "admin",
  "password": "admin"
}
```
Respuesta:
```json
{
  "token": "eyJhbGc..."
}
```

### Usuarios (Admin)

**GET /api/usuarios** - Listar todos los usuarios
**POST /api/usuarios** - Crear usuario
**GET /api/usuarios/:id** - Obtener usuario
**PUT /api/usuarios/:id** - Actualizar usuario
**DELETE /api/usuarios/:id** - Eliminar usuario

Todos requieren autenticación y rol Administrador.

### Catálogos

**GET /api/datos** - Listar tablas disponibles
**GET /api/datos/:tabla** - Obtener datos de tabla
**GET /api/datos/:tabla/schema** - Obtener estructura de tabla

## 🧪 Tests

```bash
npm test              # Ejecutar todos los tests
npm run test:watch   # Modo watch
npm run test:coverage # Cobertura de tests
```

## 📦 Deploy

Ver [DEPLOY.md](./DEPLOY.md)

## 📝 Licencia

...
```

---

## 📊 DEPENDENCIAS Y LIBRERÍAS

### Análisis de Dependencias Actuales

```json
{
  "dotenv": "^16.4.5",           // ✅ Correcto - Para variables de entorno
  "exceljs": "^4.3.0",           // ✅ Correcto - Para generar Excel
  "express": "^5.2.1",           // ✅ Correcto - Framework principal
  "fast-xml-parser": "^4.5.0",   // ✅ Correcto - Para parsear XML (facturas)
  "jsonwebtoken": "^9.0.3",      // ✅ Correcto - Para JWT
  "node-firebird": "^1.0.5",     // ✅ Correcto - Driver Firebird
  "sqlite3": "^5.1.7"            // ✅ Correcto - Driver SQLite
}
```

### Librerías Faltantes CRÍTICAS

1. **bcryptjs** - Para hashear contraseñas
   ```bash
   npm install bcryptjs
   ```

2. **express-rate-limit** - Para proteger contra brute force
   ```bash
   npm install express-rate-limit
   ```

3. **cors** - Para CORS configurado
   ```bash
   npm install cors
   ```

4. **helmet** - Headers de seguridad
   ```bash
   npm install helmet
   ```

5. **express-validator** - Validación de entrada
   ```bash
   npm install express-validator
   ```

6. **morgan** - HTTP request logger
   ```bash
   npm install morgan
   ```

### Librerías OPCIONALES RECOMENDADAS

1. **joi** o **yup** - Validación de esquemas avanzada
2. **compression** - Comprimir respuestas
3. **redis** - Caché distribuido
4. **pg** - Si se cambia a PostgreSQL
5. **jest** - Testing framework

---

## 🚀 PUNTOS DE OPTIMIZACIÓN

### Rendimiento

#### 1. Agregar Caché a Menús
**Problema:** `menus.json` se carga en memoria pero se lee del disco en cada cambio
**Solución:**
```javascript
// Backend/utils/cache.js
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getFromCache(key) {
  const item = cache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.value;
  }
  cache.delete(key);
  return null;
}

function setCache(key, value, ttl = CACHE_TTL) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl
  });
}

module.exports = { getFromCache, setCache };

// Uso:
const { getFromCache, setCache } = require('../utils/cache');

exports.getMenusByRole = (req, res) => {
  const cacheKey = `menus_${req.user.role}`;
  let menus = getFromCache(cacheKey);
  
  if (!menus) {
    menus = filterMenusByRole(menusData, req.user.role);
    setCache(cacheKey, menus);
  }
  
  res.json(menus);
};
```

#### 2. Agregar Paginación a Endpoints de Datos
**Problema:** Endpoints devuelven todos los registros sin límite
**Solución:**
```javascript
// En catalogos.js
const ITEMS_PER_PAGE = 100;
const MAX_ITEMS_PER_PAGE = 1000;

router.get('/:nombreTabla', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(
    parseInt(req.query.limit) || ITEMS_PER_PAGE,
    MAX_ITEMS_PER_PAGE
  );
  const offset = (page - 1) * limit;
  
  // ... ejecutar query con LIMIT y OFFSET
  
  res.json({
    tabla: nombreTabla,
    page,
    limit,
    total: totalCount,
    pages: Math.ceil(totalCount / limit),
    datos: rows
  });
});
```

#### 3. Usar Connection Pooling
**Problema:** Sin pool de conexiones, posibles cuellos de botella
**Solución:**
```javascript
// Backend/utils/database.js - Versión mejorada
const Pool = require('better-sqlite3-pool');

let pool = null;

function getPool() {
  if (!pool) {
    const sqlite3 = require('sqlite3').verbose();
    pool = new sqlite3.Database(dbPath);
  }
  return pool;
}
```

#### 4. Índices en Base de Datos
**Problema:** Sin índices, búsquedas lentas
**Solución:**
```sql
-- Agregar índices a tablas frecuentemente consultadas
CREATE INDEX idx_prov_codigo ON TBL_PROV_DFISCALES(CODIGO);
CREATE INDEX idx_prov_activo ON TBL_PROV_DFISCALES(ACTIVO);
CREATE INDEX idx_prov_rfc ON TBL_PROV_DFISCALES(RFC);
CREATE INDEX idx_dservicios_prov ON TBL_PROV_DSERVICIOS(PROVEEDOR_ID);
CREATE INDEX idx_dsucursales_prov ON TBL_PROV_DSUCURSALES(PROVEEDOR_ID);
```

---

## 📈 MATRIZ DE PROBLEMAS POR SEVERIDAD

| Severidad | Cantidad | Ejemplos |
|-----------|----------|----------|
| 🔴 CRÍTICO | 5 | Contraseñas sin hash, SQL injection, JWT inseguro, rate limiting, CORS |
| ⚠️ ALTO | 8 | Duplicación BD, validación entrada, errores inconsistentes, variables globales |
| 🟡 MEDIO | 7 | Falta caché, sin paginación, sin índices, documentación faltante |
| 🔵 BAJO | 6 | Logging inconsistente, nombres variables, comments incompletos |

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Seguridad Crítica (1-2 semanas)
- [ ] Implementar bcryptjs para contraseñas
- [ ] Sanitizar filtro en catalogos.js
- [ ] Generar JWT_SECRET aleatorio
- [ ] Agregar express-rate-limit
- [ ] Configurar CORS y helmet

### Fase 2: Arquitectura (2-3 semanas)
- [ ] Crear módulo singleton de BD
- [ ] Centralizar manejo de errores
- [ ] Crear módulo de logger
- [ ] Modularizar código frontend

### Fase 3: Documentación y Testing (1-2 semanas)
- [ ] Escribir README.md
- [ ] Crear API.md con especificación
- [ ] Agregar ejemplos de uso
- [ ] Tests unitarios para controladores
- [ ] Tests E2E para flujos críticos

### Fase 4: Optimización (Ongoing)
- [ ] Agregar caché
- [ ] Paginación en endpoints
- [ ] Índices en BD
- [ ] Monitoreo y logging

---

## ✨ CONCLUSIONES

El proyecto ACOSA tiene una **buena base arquitectónica** con separación clara de capas, pero presenta **vulnerabilidades críticas de seguridad** que deben ser abordadas inmediatamente antes de ir a producción.

### Lo Positivo:
✅ Arquitectura modular y escalable
✅ Uso correcto de JWT para autenticación
✅ Sistema de roles implementado
✅ API RESTful bien organizada
✅ Código comentado y legible

### Lo Negativo:
❌ Contraseñas en texto plano
❌ Vulnerable a SQL injection
❌ Secreto JWT inseguro
❌ Sin validación robusta de entrada
❌ Duplicación de código de BD

### Recomendación Final:
**No llevar a producción sin implementar Fase 1 de seguridad.** Una vez solucionados los problemas críticos, el proyecto puede escalar bien.

---

*Análisis generado: 23 de abril de 2026*
*Versión: 1.0*
