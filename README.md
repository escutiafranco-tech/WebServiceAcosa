# 📋 Sistema ACOSA — Plataforma Integral de Gestión Empresarial

**ACOSA es un sistema web para gestionar toda la información importante de tu empresa en un solo lugar.**

---

## 📖 Tabla de Contenidos

- [¿Qué es ACOSA?](#qué-es-acosa)
- [¿Para qué sirve?](#para-qué-sirve)
- [Cómo empezar](#cómo-empezar)
- [Cómo usar el sistema](#cómo-usar-el-sistema)
- [Los módulos (áreas del sistema)](#los-módulos-áreas-del-sistema)
- [Cómo está construido](#cómo-está-construido)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## ¿Qué es ACOSA?

**ACOSA es un sistema web** que funciona en tu navegador (Chrome, Firefox, Edge, Safari) y te permite guardar y organizar toda la información importante de tu empresa en un solo lugar.

Funciona como un **"armario digital"** con carpetas ordenadas para:
- 📂 **Proveedores:** Empresas de las que compras
- 📂 **Clientes:** A quiénes les vendes  
- 📂 **Logística:** Dónde van los envíos y cómo se transportan
- 📂 **Pagos:** Dinero que entra y sale
- 📂 **Producción:** Control de lo que fabricas
- 📂 **Usuarios:** Quién puede entrar al sistema y qué puede hacer

Lo mejor es que **puedes acceder desde cualquier computadora con internet** sin necesidad de instalar nada especial.

---

## ¿Para qué sirve?

✅ **Guardar información de proveedores:** Nombre, RFC, dirección, servicios, sucursales, contactos  
✅ **Guardar información de clientes:** Quiénes son, dónde están, qué compran  
✅ **Controlar entregas:** Seguimiento de cargas, custodias y logística  
✅ **Registrar pagos:** Dinero a proveedores y de clientes  
✅ **Controlar producción:** Lotes y procesos  
✅ **Buscar rápido:** Encuentra lo que necesitas con un clic  
✅ **Acceso por roles:** Cada persona ve solo lo que necesita para su trabajo  
✅ **Generar reportes:** Facturas en Excel y auditorías

---

## Cómo empezar

### Lo que necesitas

- Una computadora con Windows
- PowerShell (ya viene con Windows)
- Conexión a internet (la primera vez)

### Paso 1: Abrir PowerShell

En tu Windows, busca **"PowerShell"** y abre.

### Paso 2: Ir a la carpeta del proyecto

Copia y pega esto:

```
cd "C:\Users\Francisco Escutia\Desktop\WEBSERVICE ACOSA"
```

Presiona **Enter**.

### Paso 3: Instalar (solo la primera vez)

Copia y pega esto:

```
npm ci
```

Presiona **Enter** y espera a que termine (tarda 1-2 minutos). Verás muchos mensajes en pantalla, eso es normal.

### Paso 4: Iniciar el servidor

Copia y pega esto:

```
npm start
```

Presiona **Enter**. Si todo está bien, verás un mensaje como este:

```
Servidor HTTPS corriendo en https://localhost:3001/login.html
```

✅ **¡El servidor está corriendo!** Déjalo así, no cierres la ventana.

### Paso 5: Abrir en tu navegador

Abre Google Chrome, Firefox, Edge o Safari y ve a:

```
https://localhost:3001/login.html
```

Verás la pantalla de **LOGIN**. (Si te avisa sobre el certificado, es seguro, ignora el aviso)

---

## Cómo usar el sistema

### Entrar al sistema

En la pantalla de login, escribe:
- **Usuario:** `admin`
- **Contraseña:** `admin`

Presiona **"Entrar"** ✅

### Después de entrar

Verás una pantalla con:
- **Menú a la izquierda:** Las diferentes áreas del sistema
- **Panel principal:** Donde ves y editas la información
- **Botón de engranaje ⚙️:** Arriba a la derecha para administración

### Los roles (tipos de usuarios)

Cada persona en el sistema tiene un **rol** que define qué puede ver y hacer:

- **Administrador:** Acceso total a todo + puede crear usuarios
- **Compras:** Ver y editar proveedores y compras
- **Producción:** Ver y editar lotes y producción
- **Ventas:** Ver y editar clientes y ventas
- **Usuario:** Acceso limitado a lectura

---

## Los módulos (áreas del sistema)

### 📋 Administración

**¿Qué hace?**  
Aquí los administradores gestionar los usuarios del sistema.

**¿Qué puedes hacer?**
- Crear nuevos usuarios (agregar personas al sistema)
- Editar usuarios (cambiar nombre, email, contraseña, rol)
- Activar o desactivar usuarios
- Eliminar usuarios que ya no se usan

**¿Quién lo usa?**  
Solo Administradores

**Estado:** ✅ Funcionando

---

### 🛒 Compras / Proveedores

**¿Qué hace?**  
Mantiene un catálogo completo de los proveedores de tu empresa.

**¿Qué información se guarda?**
- Nombre y RFC (datos fiscales)
- Dirección y ubicación
- Servicios que ofrece
- Sucursales
- Contactos (nombres, teléfonos, emails)
- Historial de transacciones
- Estado de cuenta (saldos)

**¿Qué puedes hacer?**
- Ver lista de todos los proveedores
- Buscar un proveedor rápidamente
- Ver detalles completos de cada uno
- Agregar nuevos proveedores
- Editar información

**¿Quién lo usa?**  
Administrador, Compras

**Estado:** ✅ Funcionando bien (lectura y agregar)

---

### 📦 Logística

**¿Qué hace?**  
Controla todo lo relacionado con transporte y envíos.

**¿Qué incluye?**
- **Cargas:** Seguimiento de lo que se transporta
- **Custodias:** Quién tiene el envío en este momento
- **Bill of Landing:** Documentos de envío internacional
- **Fletes:** Costos de transporte
- **Packing List:** Listas de lo que va en cada envío
- **Seguros y Pólizas:** Coberturas de los envíos
- **Reportes:** Generación de reportes logísticos
- **Comercio Exterior:** Documentos aduanales (próximamente)

**¿Quién lo usa?**  
Administrador, Logística (cuando esté disponible)

**Estado:** ⏳ En construcción (estructura lista, funcionalidad próximamente)

---

### 💰 Pagos

**¿Qué hace?**  
Registra el dinero que entra y sale de la empresa.

**¿Qué incluye?**
- Pagos que haces a proveedores
- Pagos que recibes de clientes
- Historial de transacciones
- Estados de cuenta

**¿Quién lo usa?**  
Administrador, Finanzas

**Estado:** ⏳ En construcción

---

### 👥 Ventas / Clientes

**¿Qué hace?**  
Mantiene información de todos los clientes de tu empresa.

**¿Qué información se guarda?**
- Nombre y datos de contacto
- Dirección y ubicación
- Historial de compras
- Saldos pendientes

**¿Quién lo usa?**  
Administrador, Ventas

**Estado:** ⏳ En construcción

---

### 🏭 Producción / Lotes

**¿Qué hace?**  
Controla la producción interna.

**¿Qué incluye?**
- Lotes de producción
- Estado de manufactura
- Seguimiento de procesos

**¿Quién lo usa?**  
Administrador, Producción

**Estado:** ⏳ En construcción

---

## Cómo está construido

### Las tres capas del sistema

El sistema ACOSA tiene tres partes principales que trabajan juntas:

**1. El Servidor (Backend)**
- Es como el "cerebro" del sistema
- Guarda toda la información en una base de datos
- Recibe solicitudes del navegador y responde
- Verifica que solo usuarios autorizados accedan
- Corre en tu computadora

**2. La Interfaz (Frontend)**
- Es lo que ves en la pantalla
- Los menús, botones, tablas, formularios
- Funciona en tu navegador (Chrome, Firefox, etc.)
- Es donde escribes y editas información
- Se comunica automáticamente con el servidor

**3. La Base de Datos**
- Es el "almacén" de información
- Guarda todos los datos (proveedores, clientes, usuarios, etc.)
- Está en tu computadora en un archivo seguro
- Solo el servidor puede acceder

### Qué tecnología usa (términos simples)

- **Node.js y Express:** El software que hace funcionar el servidor
- **SQLite/Firebird:** Donde se guardan todos los datos
- **HTML, CSS, JavaScript:** Código para la interfaz bonita que ves
- **JWT (Tokens):** Sistema seguro para verificar que eres tú quien accede

---

## Estructura del proyecto

```
La carpeta del proyecto tiene:

📁 Backend/              ← El servidor que guarda datos
📁 Public/               ← La pantalla que ves (interfaz)
📁 Modules/              ← Los módulos de Compras, Logística, etc.
📁 Database/             ← Donde se guardan todos los datos
📁 Config/               ← Configuración del sistema
📁 Scripts/              ← Herramientas auxiliares
```

---

## Administración de Usuarios

### Crear un nuevo usuario

Si eres Administrador:

1. Entra con tu usuario admin
2. Busca el botón de **engranaje ⚙️** arriba a la derecha
3. Haz clic en **"+ Nuevo Usuario"**
4. Completa los datos:
   - Nombre de usuario (lo que usarán para entrar)
   - Nombre completo
   - Correo electrónico
   - Contraseña
   - Rol (qué puede ver y hacer)
   - Marcar si está activo
5. Haz clic en **"Guardar Usuario"**

### Editar un usuario

1. En el panel de administración, busca al usuario
2. Haz clic en el botón de **lápiz ✎**
3. Edita los datos que necesites
4. Guarda

### Desactivar o activar un usuario

1. Busca al usuario en la lista
2. Haz clic en el botón de **círculo ⊙**
3. El estado cambiará automáticamente

### Eliminar un usuario

1. Busca al usuario
2. Haz clic en el botón de **basura 🗑**
3. Confirma la eliminación

**Nota:** No se puede eliminar el usuario "admin" (es el principal del sistema)

---

## Acceder desde otra computadora

Si hay otras personas en tu empresa que quieren usar el sistema desde sus computadoras:

### Paso 1: Encontrar la IP de tu computadora

En PowerShell, escribe:

```
ipconfig
```

Busca una línea que dice **"IPv4 Address"**. Por ejemplo: `192.168.1.100`

### Paso 2: Compartir con otros

Dile a la otra persona que vaya a su navegador y escriba:

```
https://192.168.1.100:3001/login.html
```

(Cambia `192.168.1.100` por la IP que encontraste)

**Importante:** Ambas computadoras deben estar en la misma red/WiFi

---

## Preguntas frecuentes

### ¿Es seguro?

✅ **Sí.** 
- Solo acceso con usuario y contraseña
- Cada rol ve solo lo que le corresponde
- Los datos están en tu computadora, no en internet
- Se puede conectar a una base de datos profesional (Firebird) cuando sea necesario

### ¿Qué pasa si me olvido la contraseña?

Deberás contactar al Administrador del sistema para que la reestablezca.

### ¿Puedo acceder desde mi celular?

Sí, desde cualquier navegador (Chrome, Safari, etc.). Pero la interfaz está optimizada para computadora.

### ¿Los datos están seguros?

Los datos se guardan en tu computadora en un archivo protegido. No se pierden aunque apagues el servidor.

### ¿Cuántos usuarios puedo crear?

Ilimitados. El sistema soporta desde 1 hasta cientos de usuarios simultáneamente.

### ¿Qué pasa si cierto el PowerShell?

El servidor se apaga. Para que funcione de nuevo, debes hacer `npm start`.

### ¿Es necesario internet?

No, una vez que está instalado funciona localmente. Solo necesitas internet si quieres que accedan personas desde fuera de tu red.

### ¿Puedo cambiar el puerto?

Sí, pero eso requiere configuración técnica. Por defecto es el puerto 3001.

### ¿Puedo guardar en otra computadora (servidor)?

Sí, el sistema soporta dos bases de datos:
- **SQLite:** Para desarrollo local (archivo en tu computadora)
- **Firebird:** Para producción (en un servidor profesional)

Cambiar entre uno y otro requiere configuración técnica.

---

## Información importante

| Aspecto | Detalle |
|--------|---------|
| **URL de acceso** | https://localhost:3001/login.html |
| **Usuario de prueba** | admin |
| **Contraseña de prueba** | admin |
| **Dónde se guardan datos** | Database/acosa_local.db (en tu carpeta) |
| **Puerto por defecto** | 3001 |
| **Tipo de conexión** | HTTPS segura |

---

## ¿Si algo no funciona?

| Problema | Solución |
|----------|----------|
| "No puedo abrir el sistema" | Verifica que PowerShell esté corriendo con `npm start` |
| "Dice que no puedo conectar" | Intenta con otro navegador |
| "Perdí datos" | Revisa la carpeta Database/acosa_local.db |
| "Se cerró el servidor" | Abre PowerShell y corre `npm start` de nuevo |
| "Me olvidé mi contraseña" | Contacta al Administrador del sistema |

---

**¡Listo! Ahora puedes empezar a usar ACOSA. ¡Disfrútalo! 🚀**

### Paso 1: Abrir PowerShell
Busca "PowerShell" en tu Windows y abre.

### Paso 2: Ir a la carpeta del proyecto
```powershell
cd "C:\Users\Francisco Escutia\Desktop\WEBSERVICE ACOSA"
```

### Paso 3: Instalar dependencias (solo la primera vez)
```powershell
npm ci
```
Espera a que complete (tarda 1-2 minutos).

### Paso 4: Crear archivo `.env`
En la carpeta `Config/`, crea un archivo llamado `.env` con:
```env
PORT=3001
USE_SQLITE=true
JWT_SECRET=dev_insecure_secret_change_me
```

### Paso 5: Iniciar el servidor
```powershell
npm start
```

Verás:
```
Servidor HTTPS corriendo en https://localhost:3001/login.html
```

¡El servidor está corriendo! 🎉

### Paso 6: Abrir en tu navegador
Ve a:
```
https://localhost:3001/login.html
```

Verás la pantalla de **LOGIN**. (Ignora el aviso de certificado, es seguro)

---

## 🔑 ¿Cómo Entrar?

En la pantalla de login, escribe:
- **Usuario:** `admin`
- **Contraseña:** `admin`

Presiona "Entrar" ✅

El sistema guarda automáticamente tu sesión en el navegador. Podrás acceder a las funciones según tu rol:
- **Administrador:** Acceso total a todo
- **Compras:** Acceso a proveedores y compras
- **Produccion:** Acceso a lotes y producción
- **Ventas:** Acceso a clientes y ventas
- **Usuario:** Acceso limitado

---

## 📱 ¿Cómo Usar Desde Otra Computadora?

Si quieres que alguien más en tu red use el sistema:

### Paso 1: Encontrar tu IP
En PowerShell, escribe:
```powershell
ipconfig
```

Busca **"IPv4 Address"**, por ejemplo: `192.168.1.100`

### Paso 2: Compartir el acceso
Dile a la otra persona que vaya a:
```
https://192.168.1.100:3001/login.html
```

(Reemplaza `192.168.1.100` con tu IP real)

¡Ambos pueden usar el sistema a la vez!

---

## 📂 Estructura del Proyecto (Dónde están las cosas)

```
📁 WEBSERVICE ACOSA
│
├─ 📁 Backend           ← El "corazón" del sistema (Express.js)
│  ├─ server.js         ← Programa principal (HTTPS, rutas, BD)
│  ├─ 📁 routes         ← Definición de endpoints REST
│  ├─ 📁 controllers    ← Lógica de negocio
│  ├─ 📁 system         ← Configuración (menús.json, catalogs.json)
│  └─ 📁 utils          ← Funciones auxiliares
│
├─ 📁 Public            ← Interfaz web (HTML, CSS, JS)
│  ├─ login.html        ← Pantalla de login
│  ├─ menu.html         ← Menú principal post-login
│  ├─ app.js            ← Lógica principal del frontend
│  ├─ menu.js           ← Gestor de menús y navegación
│  └─ Style.css         ← Estilos
│
├─ 📁 Modules           ← Módulos funcionales (lazy-loaded)
│  ├─ administracion/usuarios/
│  ├─ compras/proveedores/
│  ├─ logistica/
│  ├─ ventas/clientes/
│  ├─ pagos/
│  └─ produccion/lotes/
│
├─ 📁 Database          ← Base de datos
│  └─ acosa_local.db    ← SQLite (desarrollo)
│
├─ 📁 Config            ← Configuración
│  └─ .env              ← Variables de entorno
│
├─ 📁 Scripts           ← Herramientas de utilidad
└─ package.json         ← Dependencias
```

---

## Endpoints API Principales

### 🔐 Autenticación

#### `POST /auth/login`
Autenticar usuario y obtener token JWT
```json
// Request
{
  "username": "admin",
  "password": "admin"
}

// Response (200)
{
  "token": "eyJhbGc..."
}
```
- **Expiración del token:** 2 horas
- **Almacenamiento:** localStorage con clave `authToken`

---

### 📊 Menús (Protegida)

#### `GET /menus`
Obtener menús filtrados por rol del usuario
```
Headers: Authorization: Bearer <token>

Response (200):
[
  {
    "module": "Compras",
    "menus": [
      {
        "name": "Proveedores",
        "roles": ["Administrador", "Compras"],
        "action": "loadModule",
        "path": "/modules/compras/proveedores/proveedores.html"
      }
    ]
  },
  {
    "module": "Producción",
    ...
  }
]
```

---

### 👥 Gestión de Usuarios (Admin, Protegida)

#### `GET /api/usuarios`
Listar todos los usuarios
```
Headers: Authorization: Bearer <token>

Response (200):
{
  "total": 5,
  "usuarios": [
    {
      "id": 1,
      "username": "admin",
      "nombre": "Administrador",
      "email": "admin@acosa.com",
      "rol": "Administrador",
      "activo": 1,
      "created_at": "2026-04-21T10:00:00Z"
    }
  ]
}
```

#### `POST /api/usuarios`
Crear nuevo usuario
```json
Request:
{
  "username": "juanperez",
  "password": "segura123",
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "rol": "Compras",
  "activo": 1
}

Response (201):
{
  "id": 6,
  "username": "juanperez",
  "nombre": "Juan Pérez",
  ...
}
```

#### `PUT /api/usuarios/:id`
Actualizar usuario completo

#### `PATCH /api/usuarios/:id/estado`
Cambiar estado activo/inactivo
```json
{
  "activo": 0
}
```

#### `DELETE /api/usuarios/:id`
Eliminar usuario

---

### 📦 Catálogos Dinámicos (Protegida)

#### `GET /api/datos/`
Listar todas las tablas de consulta disponibles
```
Response (200):
{
  "total": 2,
  "tablas_disponibles": [
    "TBL_PROV_GLOBAL",
    "TBL_CLI_GLOBAL"
  ]
}
```

#### `GET /api/datos/:nombreTabla`
Obtener datos de una tabla
```
Parámetros:
- nombreTabla: "TBL_PROV_GLOBAL"
- filtro (opcional): "WHERE nombre LIKE '%Mexico%'"

Response (200):
{
  "tabla": "TBL_PROV_GLOBAL",
  "total": 45,
  "datos": [
    {
      "id": 1,
      "codigo": "PROV001",
      "nombre": "Proveesor XYZ",
      "rfc": "XXX010101ABC",
      ...
    }
  ]
}
```

#### `GET /api/datos/:nombreTabla/schema`
Obtener metadata (columnas, tipos, etiquetas)
```
Response (200):
{
  "tabla": "TBL_PROV_GLOBAL",
  "descripcion": "Proveedores con datos de fiscales y servicios",
  "tabla_base": "TBL_PROV_DFISCALES",
  "columnas_visibles": [
    {
      "nombre": "id",
      "tipo": "INTEGER",
      "etiqueta": "ID",
      "visible": true
    },
    {
      "nombre": "codigo",
      "tipo": "TEXT",
      "etiqueta": "Código",
      "visible": true
    }
  ]
}
```

#### `GET /api/datos/:nombreTabla/sql` (Debug)
Retorna el SQL que se ejecutaría (solo desarrollo)

---

## Base de Datos

### Tablas Principales (SQLite)

#### `USERS`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | ID único |
| `username` | TEXT UNIQUE | Nombre de usuario |
| `password` | TEXT | Contraseña (⚠️ Almacenada en plano - MEJORAR CON BCRYPT) |
| `nombre` | TEXT | Nombre completo |
| `email` | TEXT | Email del usuario |
| `rol` | TEXT | Rol (Administrador, Compras, etc.) |
| `activo` | INTEGER | 1=activo, 0=inactivo |
| `created_at` | TIMESTAMP | Fecha de creación |

**Datos de prueba:**
- Username: `admin`
- Password: `admin`
- Rol: `Administrador`

#### `TBL_PROV_DFISCALES` (Proveedores - Datos Fiscales)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PRIMARY KEY | ID único |
| `codigo` | TEXT | Código del proveedor |
| `nombre` | TEXT | Nombre comercial |
| `rfc` | TEXT | RFC (Registro Federal de Contribuyentes) |
| `direccion` | TEXT | Domicilio |
| `activo` | INTEGER | 1=activo, 0=inactivo |
| `fecha_registro` | TIMESTAMP | Fecha de alta |

#### `TBL_PROV_DSERVICIOS` (Servicios de Proveedores) - EN DESARROLLO
#### `TBL_PROV_DSUCURSALES` (Sucursales de Proveedores) - EN DESARROLLO
#### `TBL_PROV_DCONTACTOS` (Contactos de Proveedores) - EN DESARROLLO
#### `TBL_CLI_DATOS` (Clientes) - NO CREADA AÚN

### Conexión a Firebird (Producción)

Edita `Config/.env`:
```env
USE_SQLITE=false
FIREBIRD_HOST=tu.servidor.com
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/path/to/acosa.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=tu_contraseña
```

---

## Módulos Funcionales

### 📋 Administración / Usuarios
**Ubicación:** `Modules/administracion/usuarios/`  
**Rutas:** GET/POST/PUT/PATCH/DELETE `/api/usuarios`  
**Funciones:**
- Listar usuarios
- Crear nuevo usuario
- Editar datos de usuario
- Activar/desactivar usuario
- Cambiar roles

**Estado:** ✅ Implementado

---

### 🛒 Compras / Proveedores
**Ubicación:** `Modules/compras/proveedores/`  
**Rutas:** GET `/api/datos/TBL_PROV_GLOBAL`  
**Funciones:**
- Catálogo de proveedores (45+ registros de ejemplo)
- Búsqueda y filtrado en tiempo real
- Pestañas internas:
  - DATOS GENERALES: RFC, dirección, información fiscal
  - SERVICIOS: Qué servicios ofrece el proveedor
  - SUCURSALES: Ubicaciones del proveedor
  - CONTACTOS: Personas de contacto
  - EXPEDIENTE: Documentos y cumplimiento
  - VENTAS: Historial de transacciones
  - SALDOS: Estado de cuenta
  - AGENDA: Eventos y seguimiento

**Estado:** ✅ Vista de lectura implementada | ⏳ Escritura en desarrollo

---

### 📦 Logística
**Ubicación:** `Modules/logistica/`  
**Submódulos:**
- **Comercio Exterior:** [En desarrollo]
- **Expedientes de Carga:**
  - Bill of Landing: [En desarrollo]
  - Cargas: [En desarrollo]
  - Custodias: [En desarrollo]
  - Fletes: [En desarrollo]
  - Packing List: [En desarrollo]
  - Reportes: [En desarrollo]
  - Seguros y Pólizas: [En desarrollo]
- **Expedientes de Descarga:** [En desarrollo]

**Estado:** ⏳ Estructura creada, funcionalidad en desarrollo

---

### 💰 Pagos
**Ubicación:** `Modules/pagos/`  
**Submódulos:**
- Pagos a Clientes: [En desarrollo]
- Pagos a Proveedores: [En desarrollo]

**Estado:** ⏳ En desarrollo

---

### 👥 Ventas / Clientes
**Ubicación:** `Modules/ventas/clientes/`  
**Funciones:** [En desarrollo]  
**Estado:** ⏳ Estructura creada, funcionalidad pendiente

---

### 🏭 Producción / Lotes
**Ubicación:** `Modules/produccion/lotes/`  
**Funciones:** [En desarrollo]  
**Estado:** ⏳ Estructura creada, funcionalidad pendiente

---

## Scripts y Utilidades

### Scripts en la Raíz del Proyecto

| Script | Comando | Propósito |
|--------|---------|-----------|
| [seedProveedores.js](seedProveedores.js) | `node seedProveedores.js` | Insertar 6 proveedores de prueba en BD |
| [checkTableStructure.js](checkTableStructure.js) | `node checkTableStructure.js` | Validar estructura de tablas SQLite |
| [restructure.js](restructure.js) | `node restructure.js` | Reestructuración de datos [uso específico] |

### Scripts en `Scripts/scripts/`

| Script | Propósito |
|--------|-----------|
| [generate-invoice-excel.js](Scripts/scripts/generate-invoice-excel.js) | **Generador de Facturas:** Lee XMLs de CFDI (comprobantes fiscales), parsea datos, genera Excel con columnas: UUID, Serie, Folio, Fecha, Emisor RFC, Receptor RFC, Subtotal, IVA, Total. Perfecto para auditoría. |
| [list-sqlite-tables.js](Scripts/scripts/list-sqlite-tables.js) | Listar todas las tablas en BD SQLite |
| [show-sqlite-sequence.js](Scripts/scripts/show-sqlite-sequence.js) | Mostrar auto-incrementos en SQLite |

### Scripts en `Scripts/Scripts de mantenimiento/`

```
create-client-tables-sqlite.js    - Crear tablas de clientes
create-db-odbc.js                 - Crear BD vía ODBC (Firebird)
create-db.js                       - Crear BD general
get-proveedores.js                - Exportar listado de proveedores
import-proveedores-json-a-sqlite.js - Importar JSON de proveedores
```

### NPM Scripts

```bash
npm start                          # Iniciar servidor: Backend/server.js
npm run invoices:excel             # Generar Excel de facturas
```

---

## Guía de Desarrollo

### Agregar una Nueva Ruta en el Backend

1. Crea el controlador en `Backend/controllers/`
2. Crea la ruta en `Backend/routes/`
3. Registra la ruta en [Backend/server.js](Backend/server.js)

**Ejemplo:**
```javascript
// Backend/controllers/productosController.js
exports.obtenerProductos = async (req, res) => {
  try {
    // Lógica aquí
    res.json({ productos: [...] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Backend/routes/productos.js
const express = require('express');
const { protect } = require('../controllers/authMiddleware');
const { obtenerProductos } = require('../controllers/productosController');

const router = express.Router();
router.get('/', protect, obtenerProductos);
module.exports = router;

// Backend/server.js - Agregar
app.use('/api/productos', require('./routes/productos'));
```

### Agregar un Nuevo Módulo en el Frontend

1. Crea carpeta en `Modules/mi-area/mi-modulo/`
2. Crea archivos:
   - `mi-modulo.html` (estructura)
   - `mi-modulo.js` (lógica)
3. Registra en [Backend/system/menus.json](Backend/system/menus.json)

**Ejemplo en menus.json:**
```json
{
  "module": "Mi Área",
  "menus": [
    {
      "name": "Mi Módulo",
      "roles": ["Administrador"],
      "action": "loadModule",
      "path": "/modules/mi-area/mi-modulo/mi-modulo.html"
    }
  ]
}
```

### Agregar Columnas Dinámicas a Catálogos

Edita [Backend/system/catalogs.json](Backend/system/catalogs.json):
```json
{
  "nombreTabla": "TBL_PROV_GLOBAL",
  "descripcion": "Proveedores con datos fiscales",
  "tabla_base": "TBL_PROV_DFISCALES",
  "columnas_visibles": [
    {
      "nombre": "id",
      "tipo": "INTEGER",
      "etiqueta": "ID",
      "visible": true
    }
  ],
  "joins_activos": [
    // Descomentar para activar JOINs con otras tablas
  ]
}
```

### Debugging en Desarrollo

**En Frontend:**
```javascript
// Activar modo desarrollo
localStorage.setItem('debug', 'true');

// Ver en consola del navegador (F12 > Console)
console.log('Mi variable:', miVar);
```

**En Backend:**
```bash
# Ver logs en tiempo real
node Backend/server.js

# Con nomon (auto-reinicia al cambiar código)
npm install -g nodemon
nodemon Backend/server.js
```

---

## 🛡️ Seguridad (Notas Importantes)

⚠️ **Antes de ir a Producción:**

1. **Contraseñas:** Actualmente almacenadas en **texto plano**. Implementar **bcrypt**:
   ```bash
   npm install bcrypt
   ```
   ```javascript
   const bcrypt = require('bcrypt');
   const hashed = await bcrypt.hash(password, 10);
   ```

2. **JWT Secret:** Cambiar `JWT_SECRET` en `.env` a algo largo y aleatorio:
   ```env
   JWT_SECRET=abc123xyz...longísima_cadena_aleatoria
   ```

3. **HTTPS:** Generar certificados SSL reales (no auto-firmados):
   ```bash
   # Usar Let's Encrypt o similar
   ```

4. **CORS:** Actualmente permite all origins. Restringir en `server.js`:
   ```javascript
   const cors = require('cors');
   app.use(cors({ origin: 'https://tu-dominio.com' }));
   ```

5. **Rate Limiting:** Agregar límite de intentos de login

---

## Estado del Proyecto
- **HTML/CSS/JavaScript:** La pantalla bonita que ves en tu navegador.
- **JWT (Tokens):** Sistema seguro para que solo usuarios autorizados vean los datos.

**¿Qué información se guarda?**

- Nombre, RFC, dirección de **proveedores**
- Servicios que ofrecen (qué venden)
- Sucursales (dónde están ubicados)
- Contactos (teléfono, email)
- Historia de **clientes** y sus compras
- Registro de **cargas y custodias** (logística)

**¿Es seguro?**

- ✅ Acceso controlado con usuario y contraseña
- ✅ Solo usuarios autorizados pueden ver cada área
- ✅ Los datos se guardan en tu computadora (no en internet)
- ✅ Se puede conectar a Firebird (base de datos profesional) en el futuro

---

## 🐛 Si Algo No Funciona

| Problema | Solución |
|----------|----------|
| "No puedo entrar al sitio" | Verifica que el servidor esté corriendo (`npm start`) |
| "Error de conexión desde otra PC" | Asegúrate que ambas estén en la misma red |
| "Olvidé la contraseña" | Usuario: `admin`, Contraseña: `admin` |
| "Perdí datos" | Todos se guardan en `Database/acosa_local.db` |
| "El servidor se cerró" | Corre `npm start` de nuevo |

---

## �️ Panel de Administración (NUEVO ✨)

### ¿Qué es?
Es una pantalla especial **solo para administradores** donde puedes gestionar todos los usuarios del sistema. Permite:
- ✅ **Crear nuevos usuarios** (agregar cuentas para otras personas)
- ✅ **Editar usuarios** (cambiar nombre, email, contraseña, rol)
- ✅ **Cambiar estado** (activar o desactivar usuarios)
- ✅ **Eliminar usuarios** (borrar cuentas que ya no se usan)

### ¿Cómo acceder?
1. **Entra al sistema** con tu usuario admin (admin / admin)
2. **Busca el botón de engranaje ⚙️** en la esquina superior derecha
3. **Haz clic** y se abrirá el Panel de Administración

### ¿Quién puede acceder?
⛔ **Solo Administradores**  
Si tu rol es "Usuario", el botón no aparecerá.

### ¿Cómo agregar un nuevo usuario?
1. Abre el **Panel de Administración**
2. Haz clic en **"+ Nuevo Usuario"** (botón azul arriba)
3. Completa los campos:
   - **Nombre de Usuario:** Lo que usarán para entrar (ej: jperez)
   - **Nombre Completo:** Su nombre real (ej: Juan Pérez)
   - **Correo:** Su email (ej: juan@acosa.com)
   - **Contraseña:** Lo que usarán para entrar (mínimo 4 caracteres)
   - **Rol:** "Usuario" o "Administrador"
   - **Activo:** Marca si está disponible
4. Haz clic en **"Guardar Usuario"**

### ¿Cómo editar un usuario?
1. En la tabla de usuarios, busca al usuario
2. Haz clic en el botón **✎** (lápiz)
3. Edita los campos necesarios
4. Haz clic en **"Guardar Usuario"**

### ¿Cómo cambiar el estado (activar/desactivar)?
1. En la tabla, busca el usuario
2. Haz clic en el botón **⊙** (círculo)
3. El estado cambiará automáticamente

### ¿Cómo eliminar un usuario?
1. En la tabla, busca el usuario
2. Haz clic en el botón **🗑** (basura)
3. Confirma la eliminación

**⚠️ Nota:** No se puede eliminar el usuario "admin". Es el usuario principal del sistema.

---

## �📅 Información Técnica (Para Desarrolladores)

- **Versión del Proyecto:** 1.0.0
- **Puerto por Defecto:** 3000 (configurable en `Config/.env`)
- **Base de Datos:** SQLite (`Database/acosa_local.db`)
- **Autenticación:** JWT (2 horas de sesión)
- **Última Actualización:** 19 de febrero de 2026

---

## 🔐 Usuarios del Sistema

| Usuario | Contraseña | Rol | Acceso |
|---------|------------|-----|--------|
| admin | admin | Administrador | Todo el sistema + Panel de Administración |

**Para agregar más usuarios:**
- Usa el botón de ⚙️ (Configuración) en la parte superior derecha
- O ve a la sección "Panel de Administración" arriba en este documento

**Nota:** Solo los administradores pueden ver el botón de Configuración.

---

## 📞 Soporte

Si algo no funciona:

1. ✅ Verifica que PowerShell esté corriendo el servidor (`npm start`)
2. ✅ Intenta recargar la página (F5)
3. ✅ Cierra el navegador y abre de nuevo
4. ✅ Reinicia el servidor

¡Listo! Si persiste el problema, guarda los mensajes de error y compartelo.

---

**¡Disfruta usando ACOSA! 🚀**
