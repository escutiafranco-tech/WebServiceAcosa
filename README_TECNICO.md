# 🔧 README TÉCNICO - ACOSA ERP

Documentación técnica completa de la arquitectura, estructura, stack tecnológico y guía de desarrollo de ACOSA.

**Tabla de Contenidos**
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Instalación y Setup](#instalación-y-setup)
6. [Componentes Principales](#componentes-principales)
7. [Base de Datos](#base-de-datos)
8. [API REST](#api-rest)
9. [Seguridad](#seguridad)
10. [Guía de Desarrollo](#guía-de-desarrollo)
11. [Mejoras Planeadas](#mejoras-planeadas)

---

## 🏗️ Visión General

ACOSA es un **ERP (Enterprise Resource Planning) modular** desarrollado con:

- **Backend:** Node.js + Express.js
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **Base de Datos:** SQLite (desarrollo) / Firebird (producción)
- **Autenticación:** JWT (JSON Web Tokens)
- **Arquitectura:** Cliente-Servidor con separación clara de capas

**Objetivos:**
- Centralizar gestión empresarial
- Proporcionar interfaz intuitiva
- Escalabilidad horizontal
- Seguridad en datos
- Mantenibilidad del código

---

## 🛠️ Stack Tecnológico

### Backend
```json
{
  "express": "5.2.1",              // Framework web
  "jsonwebtoken": "9.0.3",         // Autenticación JWT
  "sqlite3": "5.1.7",              // Base de datos (desarrollo)
  "node-firebird": "1.0.5",        // Driver Firebird (producción)
  "dotenv": "16.4.5",              // Variables de entorno
  "exceljs": "4.3.0",              // Generación de Excel
  "fast-xml-parser": "4.5.0"       // Parsing de XML
}
```

### Frontend
- **HTML5:** Estructura semántica
- **CSS3:** Responsive design
- **Vanilla JavaScript:** Sin framework (mejora rendimiento)
- **XMLHttpRequest:** Comunicación con API

### Infraestructura
- **Node.js:** Runtime JavaScript
- **HTTPS:** Certificados locales
- **Express Middleware:** Routing y seguridad
- **SQLite:** Base de datos local
- **PowerShell:** Scripts de inicio

---

## 🏛️ Arquitectura

### Patrón MVC + Separación de Capas

```
┌─────────────────────────────────────────┐
│           Frontend (Public)             │
│  HTML + CSS + JavaScript (Vanilla)      │
└────────────┬────────────────────────────┘
             │ HTTP/HTTPS + JSON
             ↓
┌─────────────────────────────────────────┐
│         Express.js Server               │
│  ├── Routes (Routing)                   │
│  ├── Controllers (Lógica de negocio)    │
│  ├── Middleware (Autenticación)         │
│  └── Utils (Funciones auxiliares)       │
└────────────┬────────────────────────────┘
             │ SQL / Native Driver
             ↓
┌─────────────────────────────────────────┐
│       Base de Datos                     │
│  ├── SQLite (local/desarrollo)          │
│  └── Firebird (producción)              │
└─────────────────────────────────────────┘
```

### Flujo de Solicitud

```
1. Usuario abre navegador
2. Descarga index.html (login.html)
3. Ingresa credenciales
4. Frontend POST → /api/auth/login
5. Backend verifica en BD
6. Genera JWT y lo devuelve
7. Frontend almacena JWT en localStorage
8. Solicitudes posteriores incluyen JWT en header
9. Middleware autentica y autoriza
10. Controller procesa lógica
11. Respuesta JSON → Frontend
12. JavaScript actualiza DOM
```

---

## 📁 Estructura de Carpetas

```
WEBSERVICE ACOSA/
├── Backend/
│   ├── server.js                 # Punto de entrada, configuración HTTPS
│   ├── controllers/              # Lógica de negocio
│   │   ├── authController.js     # Autenticación y login
│   │   ├── menuController.js     # Menús dinámicos
│   │   ├── userController.js     # CRUD de usuarios
│   │   └── authMiddleware.js     # Validación JWT
│   ├── routes/                   # Definición de endpoints
│   │   ├── auth.js               # POST /api/auth/login
│   │   ├── catalogos.js          # GET/POST catálogos
│   │   ├── menus.js              # GET menús
│   │   ├── users.js              # CRUD usuarios
│   │   └── usuarios.js           # Alias de users.js
│   ├── system/                   # Datos estáticos
│   │   ├── catalogs.json         # Catálogos del sistema
│   │   ├── menus.json            # Estructura de menús
│   │   └── users.json            # Usuarios por defecto
│   ├── certs/                    # Certificados SSL/TLS
│   │   ├── server.crt            # Certificado público
│   │   └── server.key            # Clave privada
│   └── utils/
│       └── catalogBuilder.js     # Constructor de catálogos
│
├── Frontend/
│   └── js/
│       └── table-utils.js        # Utilidades para tablas HTML
│
├── Public/                        # Archivos estáticos (Frontend)
│   ├── app.js                    # Aplicación principal
│   ├── desarrollo.js             # Desarrollo/debugging
│   ├── menu.js                   # Control de menús
│   ├── login.html                # Página de login
│   ├── menu.html                 # Página principal
│   ├── server.html               # Información del servidor
│   ├── Style.css                 # Estilos globales
│   ├── modules.css               # Estilos de módulos
│   ├── package.json              # Metadatos
│   └── Imagenes/                 # Logos, íconos, imágenes
│
├── Modules/                       # Módulos de negocio (Modular)
│   ├── administracion/
│   │   ├── usuarios.html         # UI de usuarios
│   │   └── usuarios.js           # Lógica de usuarios
│   ├── compras/                  # Módulo de compras
│   │   ├── productos-servicios/
│   │   ├── proveedores/          # Gestión de proveedores
│   │   │   ├── proveedores.html
│   │   │   └── proveedores.js
│   │   └── reportes-compras/
│   ├── logistica/                # Módulo de logística
│   │   ├── comercio-exterior/
│   │   ├── expedientes-carga/
│   │   │   ├── bill-of-landing/
│   │   │   ├── cargas/
│   │   │   ├── custodias/
│   │   │   ├── fletes/
│   │   │   └── packing-list/
│   │   └── expedientes-descarga/
│   ├── pagos/                    # Módulo de pagos
│   │   ├── pagos-clientes/
│   │   └── pagos-proveedores/
│   ├── produccion/               # Módulo de producción
│   │   └── lotes/
│   └── ventas/                   # Módulo de ventas
│       └── clientes/
│
├── Database/
│   ├── acosa.FDB                 # Base Firebird (si existe)
│   └── acosa_local.db            # Base SQLite (desarrollo)
│
├── Config/
│   ├── .env                      # Variables de entorno
│   └── Configuración/            # Archivos de configuración
│
├── Scripts/                       # Scripts de utilidad
│   ├── scripts/
│   │   ├── generate-invoice-excel.js
│   │   ├── list-sqlite-tables.js
│   │   └── show-sqlite-sequence.js
│   └── Scripts de mantenimiento/
│       ├── create-client-tables-sqlite.js
│       └── import-proveedores-json-a-sqlite.js
│
├── package.json                  # Dependencias y scripts
├── README.md                     # README existente
├── README_USUARIO.md             # Esta documentación (usuario)
├── README_TECNICO.md             # Esta documentación (técnico)
├── RESUMEN_EJECUTIVO.md          # Plan de mejoras
├── ANALISIS_DETALLADO_ACOSA.md   # Análisis de código
└── GUIA_REFACTORIZACION.md       # Guía de mejoras

```

---

## 🚀 Instalación y Setup

### Requisitos Previos
- Node.js 14+ instalado
- npm o yarn
- PowerShell (Windows)
- Puerto 3001 disponible

### Pasos de Instalación

#### 1. Clonar/Descargar el repositorio
```powershell
cd "C:\Users\Francisco Escutia\Desktop\WEBSERVICE ACOSA"
```

#### 2. Instalar dependencias
```powershell
npm ci
```

#### 3. Configurar variables de entorno
Crear archivo `Config/.env`:
```env
# Base de datos
USE_SQLITE=true
SQLITE_PATH=./Database/acosa_local.db

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura_aqui
JWT_EXPIRES_IN=24h

# Servidor
PORT=3001
NODE_ENV=development

# Firebird (si usas en producción)
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/ruta/a/acosa.fdb
FIREBIRD_USER=sysdba
FIREBIRD_PASSWORD=masterkey
```

#### 4. Iniciar servidor
```powershell
npm start
```

El servidor estará disponible en: `https://localhost:3001/login.html`

---

## 🔑 Componentes Principales

### Backend/server.js
**Responsabilidad:** Punto de entrada, configuración del servidor

**Funciones Clave:**
- Cargar variables de entorno desde `.env`
- Inicializar Express.js
- Configurar HTTPS con certificados
- Seleccionar SQLite o Firebird según env
- Registrar rutas
- Servir archivos estáticos (Frontend)
- Manejo de errores global

**Variables Importantes:**
```javascript
const useSqlite = true;        // true = SQLite, false = Firebird
const sqliteDb = new sqlite3.Database(...); // Conexión a BD
const app = express();          // Aplicación Express
const PORT = process.env.PORT || 3001;
```

### Backend/controllers/authController.js
**Responsabilidad:** Lógica de autenticación y autorización

**Funciones:**
- `login(username, password)` - Autentica usuario y devuelve JWT
- Validación de credenciales
- Generación de tokens JWT
- Manejo de errores de auth

**Problemas Identificados:** ⚠️
- Las contraseñas se almacenan en texto plano (NO HASH)
- Falta validación de entrada
- Sin rate limiting
- JWT_SECRET débil

### Backend/controllers/menuController.js
**Responsabilidad:** Menús dinámicos y navegación

**Funciones:**
- Carga menús según rol del usuario
- Filtra opciones de menú por permisos
- Carga menús de `system/menus.json`

### Backend/controllers/userController.js
**Responsabilidad:** CRUD de usuarios

**Funciones:**
- `getAllUsers()` - Lista todos los usuarios
- `createUser()` - Crea nuevo usuario
- `updateUser()` - Actualiza usuario
- `deleteUser()` - Borra usuario
- Validación de roles

### Backend/routes/
Define los endpoints HTTP:

```
GET  /api/menus              → menuController.getMenus()
POST /api/auth/login         → authController.login()
GET  /api/users              → userController.getAllUsers()
POST /api/users              → userController.createUser()
PUT  /api/users/:id          → userController.updateUser()
DELETE /api/users/:id        → userController.deleteUser()
GET  /api/catalogos/:type    → Obtiene catálogo dinámico
POST /api/catalogos/:type    → Crea catálogo
```

### Backend/utils/catalogBuilder.js
**Responsabilidad:** Construcción dinámica de catálogos

**Concepto:**
- Define catálogos una sola vez en `system/catalogs.json`
- Los módulos los cargan dinámicamente
- Permite cambiar catálogos sin recompilar

**Ejemplo:**
```json
{
  "tipos_proveedores": ["Materia Prima", "Servicios", "Manufactura"],
  "estados": ["Activo", "Inactivo", "Suspendido"]
}
```

---

## 💾 Base de Datos

### Modo Desarrollo: SQLite

**Archivo:** `Database/acosa_local.db`

**Ventajas:**
- Sin configuración
- Cero dependencias externas
- Perfecto para desarrollo local
- Rápido y confiable

**Tablas Principales:**

#### USERS
```sql
CREATE TABLE USERS (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Usuario',
  nombre TEXT,
  email TEXT,
  activo INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);
```

#### PROVEEDORES
```sql
CREATE TABLE PROVEEDORES (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rfc TEXT UNIQUE,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT,
  telefono TEXT,
  email TEXT,
  tipo_proveedor TEXT,
  estatus TEXT DEFAULT 'Activo',
  created_at TEXT,
  updated_at TEXT
);
```

#### CLIENTES
```sql
CREATE TABLE CLIENTES (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rfc TEXT,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  email TEXT,
  condiciones_pago TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

Más tablas según módulos...

### Modo Producción: Firebird

**Archivo:** `Database/acosa.FDB`

**Cambio de modo:**
Edita `Config/.env`:
```env
USE_SQLITE=false
```

El servidor conectará automáticamente a Firebird.

---

## 🔌 API REST

### Autenticación

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}

Respuesta (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "Administrador",
    "nombre": "Administrador"
  }
}
```

### Headers Requeridos
Todas las solicitudes (excepto login) requieren:
```
Authorization: Bearer <JWT_TOKEN>
```

### Catálogos

#### Obtener Catálogo
```
GET /api/catalogos/tipos_proveedores

Respuesta:
{
  "data": ["Materia Prima", "Servicios", "Manufactura"]
}
```

#### Crear Catálogo
```
POST /api/catalogos/nuevos_valores
Content-Type: application/json

{
  "valores": ["Valor1", "Valor2"]
}
```

### Usuarios

#### Listar
```
GET /api/users

Respuesta:
{
  "data": [
    {
      "id": "admin",
      "username": "admin",
      "role": "Administrador",
      "nombre": "Administrador"
    }
  ]
}
```

#### Crear
```
POST /api/users
Content-Type: application/json

{
  "username": "nuevo",
  "password": "temporal123",
  "role": "Usuario",
  "nombre": "Juan Nuevo",
  "email": "juan@example.com"
}
```

#### Actualizar
```
PUT /api/users/nuevo
Content-Type: application/json

{
  "nombre": "Juan Actualizado",
  "email": "juan2@example.com",
  "role": "Supervisor"
}
```

#### Eliminar
```
DELETE /api/users/nuevo

Respuesta:
{ "message": "Usuario eliminado" }
```

---

## 🔐 Seguridad

### Autenticación: JWT
- Token generado en login
- Almacenado en localStorage (cliente)
- Validado en cada solicitud (servidor)
- Expira en 24h (configurable)

### Autorización: Roles
- **Administrador:** Acceso total
- **Supervisor:** Acceso a reportes y consultas
- **Usuario:** Acceso limitado a módulos asignados

**Implementación:**
```javascript
// En middleware de autenticación
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
}
```

### ⚠️ Vulnerabilidades Identificadas

Ver **ANALISIS_DETALLADO_ACOSA.md** para detalles completos.

**Resumen:**
1. 🔴 Contraseñas sin hash
2. 🔴 SQL Injection potencial
3. 🔴 JWT_SECRET débil
4. 🔴 Sin rate limiting
5. 🔴 Sin validación de entrada

**Plan de corrección:** Ver **GUIA_REFACTORIZACION.md**

---

## 🛠️ Guía de Desarrollo

### Crear Nuevo Módulo

#### 1. Crear carpeta en Modules/
```
Modules/nuevo_modulo/
├── nuevo_modulo.html
└── nuevo_modulo.js
```

#### 2. HTML: Interfaz
```html
<!-- Modules/nuevo_modulo/nuevo_modulo.html -->
<div class="modulo-container">
  <h1>Nuevo Módulo</h1>
  <table id="tabla-datos">
    <thead>
      <tr>
        <th>ID</th>
        <th>Nombre</th>
      </tr>
    </thead>
    <tbody id="datos-body">
    </tbody>
  </table>
</div>
```

#### 3. JavaScript: Lógica
```javascript
// Modules/nuevo_modulo/nuevo_modulo.js
const NuevoModulo = {
  init() {
    this.loadData();
    this.attachEventListeners();
  },
  
  loadData() {
    fetch('/api/nuevo_modulo', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    })
      .then(res => res.json())
      .then(data => this.renderTable(data))
      .catch(err => console.error(err));
  },
  
  renderTable(data) {
    const tbody = document.getElementById('datos-body');
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.id}</td>
        <td>${row.nombre}</td>
      </tr>
    `).join('');
  },
  
  getToken() {
    return localStorage.getItem('token');
  },
  
  attachEventListeners() {
    // Agregar listeners aquí
  }
};

// Inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => NuevoModulo.init());
```

#### 4. Backend: Ruta
```javascript
// Backend/routes/nuevo_modulo.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../controllers/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  // Lógica de obtener datos
  res.json({ data: [...] });
});

module.exports = router;
```

#### 5. Registrar en server.js
```javascript
const nuevoModuloRoutes = require('./routes/nuevo_modulo');
app.use('/api/nuevo_modulo', nuevoModuloRoutes);
```

### Crear Nuevo Controlador

**Patrón a seguir:**
```javascript
// Backend/controllers/nuevoController.js

module.exports = {
  // Obtener todos
  getAll: (db, req, res) => {
    db.all('SELECT * FROM tabla', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows });
    });
  },

  // Crear
  create: (db, req, res) => {
    const { campo1, campo2 } = req.body;
    
    // Validar entrada
    if (!campo1) return res.status(400).json({ error: 'Falta campo1' });
    
    db.run(
      'INSERT INTO tabla (campo1, campo2) VALUES (?, ?)',
      [campo1, campo2],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Creado exitosamente' });
      }
    );
  },

  // Actualizar
  update: (db, req, res) => {
    const { id } = req.params;
    const { campo1, campo2 } = req.body;
    
    db.run(
      'UPDATE tabla SET campo1 = ?, campo2 = ? WHERE id = ?',
      [campo1, campo2, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Actualizado' });
      }
    );
  },

  // Eliminar
  delete: (db, req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM tabla WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Eliminado' });
    });
  }
};
```

### Mejores Prácticas a Seguir

✅ **DO:**
- Usar parámetros preparados (`?` placeholders)
- Validar toda entrada del usuario
- Manejo de errores en todas las promesas
- Separar lógica en controladores
- Comentar código complejo
- Usar nombres de variables descriptivos
- Seguir estructura MVC

❌ **DON'T:**
- Concatenar SQL directamente
- Confiar en validación del frontend solamente
- Ignorar errores con try/catch vacíos
- Lógica de negocio en rutas
- Variables globales
- Código duplicado
- Cambios directos al DOM sin sanitizar

---

## 📈 Mejoras Planeadas

### 🔴 FASE 1: SEGURIDAD (Bloqueador para Producción)
- [ ] Hashear contraseñas con bcryptjs
- [ ] Validar todas las entradas (express-validator)
- [ ] Sanitizar SQL (prepared statements)
- [ ] JWT_SECRET seguro y aleatorio
- [ ] Rate limiting (express-rate-limit)
- [ ] CORS configurado
- [ ] HTTPS certificado válido

**Esfuerzo:** 2 semanas  
**Prioridad:** 🔴 CRÍTICA

### 🟡 FASE 2: REFACTORIZACIÓN
- [ ] Singleton para conexión BD
- [ ] Centralizar manejo de errores
- [ ] Logger estructurado (winston)
- [ ] Separar lógica de rutas
- [ ] Caché de catálogos
- [ ] Índices en BD

**Esfuerzo:** 3 semanas  
**Prioridad:** 🟡 ALTA

### 📚 FASE 3: DOCUMENTACIÓN
- [ ] Documentar API (Swagger)
- [ ] Guía de desarrollo
- [ ] Diagramas de arquitectura
- [ ] Ejemplos de uso

**Esfuerzo:** 1 semana  
**Prioridad:** 📚 MEDIA

### 🧪 FASE 4: TESTING
- [ ] Tests unitarios (Jest)
- [ ] Tests de integración
- [ ] Tests E2E (Cypress)
- [ ] Cobertura mínima 80%

**Esfuerzo:** 2-3 semanas  
**Prioridad:** 🧪 MEDIA

### 🚀 FASE 5: OPTIMIZACIÓN (Ongoing)
- [ ] Paginación en listados
- [ ] Lazy loading de módulos
- [ ] Compresión de assets
- [ ] CDN para librerías
- [ ] Service Workers
- [ ] Análisis de rendimiento

**Esfuerzo:** Ongoing  
**Prioridad:** 🚀 MEDIA-BAJA

---

## 📊 Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                   USUARIO FINAL                         │
│              (Navegador Web - Frontend)                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS + JSON
                     ↓
        ┌────────────────────────────┐
        │   Express.js Router        │
        │  (Backend/routes/*.js)     │
        └────────────┬───────────────┘
                     │
           ┌─────────┴─────────┐
           ↓                   ↓
    ┌─────────────┐    ┌─────────────────┐
    │ Auth Routes │    │ API Routes      │
    │ /auth/login │    │ /users, /etc    │
    └────────┬────┘    └────────┬────────┘
             │                  │
             └──────────┬───────┘
                        ↓
         ┌──────────────────────────┐
         │  authMiddleware          │
         │  (Validar JWT)           │
         └────────────┬─────────────┘
                      │
              ┌───────┴────────┐
              ↓                ↓
        ┌──────────┐    ┌─────────────┐
        │Controller│    │ Controller  │
        │(Lógica)  │    │(Lógica)     │
        └────┬─────┘    └─────┬───────┘
             │                │
             └────────┬───────┘
                      ↓
         ┌────────────────────────┐
         │  Database (SQLite/FB)  │
         │  (Persistencia)        │
         └────────────────────────┘
```

---

## 🐛 Debugging

### Habilitar logs detallados

Editar `Public/desarrollo.js`:
```javascript
window.DEBUG = true; // Habilita console.log en prod
```

### Ver tráfico de red

1. Abrir DevTools (F12)
2. Ir a pestaña "Network"
3. Realizar acción
4. Ver solicitud y respuesta JSON

### Revisar Storage

1. DevTools → Application
2. LocalStorage → https://localhost:3001
3. Ver token y otros datos guardados

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token inválido/expirado | Volver a login |
| 404 Not Found | Endpoint no existe | Revisar ruta en server.js |
| 500 Server Error | Error en BD o controlador | Revisar console del servidor |
| CORS Error | Origen no permitido | Configurar CORS en server.js |

---

## 📞 Soporte Técnico

**Documentación Relacionada:**
- [ANALISIS_DETALLADO_ACOSA.md](ANALISIS_DETALLADO_ACOSA.md) - Análisis de código
- [GUIA_REFACTORIZACION.md](GUIA_REFACTORIZACION.md) - Mejoras específicas
- [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) - Plan de acción
- [README_USUARIO.md](README_USUARIO.md) - Guía para usuarios

**Herramientas útiles:**
- VS Code (editor recomendado)
- Postman o Thunder Client (testear APIs)
- DB Browser for SQLite (ver datos locales)

---

**Versión:** 1.0.0  
**Última actualización:** Abril 2026  
**Mantenedor:** Equipo ACOSA  
**Licencia:** Privada - Uso interno

*ACOSA © 2026. Todos los derechos reservados.*
