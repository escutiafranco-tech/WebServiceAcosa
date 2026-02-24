# 📋 Sistema ACOSA — Manual Fácil de Entender

---

## ¿Qué es ACOSA?

**ACOSA es un sistema web para gestionar y organizar datos de una empresa.** Imagina que es como un armario muy grande con muchas carpetas:

- 📂 Carpeta de **Proveedores** (empresas de las que compramos cosas)
- 📂 Carpeta de **Clientes** (a quiénes les vendemos)
- 📂 Carpeta de **Logística** (dónde van las cosas)
- 📂 Carpeta de **Pagos** (cuánto dinero entra y sale)

Puedes **buscar, agregar, editar y eliminar** información en cada carpeta, todo desde tu navegador (Chrome, Firefox, Edge, Safari).

---

## 🎯 ¿Para qué sirve?

✅ **Guardar información de proveedores:** Nombre, dirección, contacto, qué servicios ofrecen.  
✅ **Guardar información de clientes:** Quiénes compran y sus detalles.  
✅ **Controlar logística:** Seguimiento de cargas, custodias, expedientes.  
✅ **Registrar pagos:** Control de dinero que entra y sale.  
✅ **Buscar rápido:** Encuentra lo que necesitas con un clic.  
✅ **Acceso desde cualquier lado:** Si tienes internet, puedes ver tu información desde cualquier computadora.

---

## 🚀 Cómo Iniciar (Paso a Paso)

### Paso 1: Abrir PowerShell
Busca "PowerShell" en tu Windows y abre.

### Paso 2: Ir a la carpeta del proyecto
Copia y pega esto en PowerShell:

```powershell
cd "C:\Users\Francisco Escutia\Desktop\WEBSERVICE ACOSA"
```

Presiona **Enter**.

### Paso 3: Instalar (solo la primera vez)
Copia y pega esto:

```powershell
npm ci
```

Presiona **Enter** y espera (tarda unos minutos).

### Paso 4: Iniciar el servidor
Copia y pega esto:

```powershell
npm start
```

Presiona **Enter**. Verás algo como:

```
Server running on port 3000
```

¡El servidor está corriendo! 🎉

### Paso 5: Abrir en tu navegador
Abre Google Chrome, Firefox, Edge o Safari y ve a:

```
http://localhost:3000
```

Verás la pantalla de **LOGIN**.

---

## 🔑 ¿Cómo Entrar?

En la pantalla de login, escribe:
- **Usuario:** `admin`
- **Contraseña:** `admin`

Presiona "Entrar" y listo, ¡estás adentro! ✅

**Nota:** El sistema guarda automáticamente tu información en el navegador, así que podrás acceder a todas las funciones según tu rol (admin = administrador, usuario = usuario normal).

---

## 📱 ¿Cómo Usar Desde Otra Computadora?

Si quieres que alguien más en la red use el sistema desde su computadora:

### Paso 1: Saber tu IP
En PowerShell, escribe:

```powershell
ipconfig
```

Busca una línea que dice **"IPv4 Address"**. Por ejemplo: `192.168.1.100`

### Paso 2: Compartir el acceso
Dile a la otra persona que vaya a:

```
http://TU_IP:3000
```

Cambia `TU_IP` por tu número. Por ejemplo:

```
http://192.168.1.100:3000
```

Eso es todo. ¡Ambos pueden usar el sistema a la vez!

---

## 📂 Estructura del Proyecto (Dónde están las cosas)

```
📁 WEBSERVICE ACOSA
│
├─ 📁 Backend           ← El "corazón" del sistema (donde se guardan los datos)
│  ├─ server.js         ← El programa principal
│  ├─ 📁 routes         ← Rutas de acceso a la información
│  └─ 📁 controllers    ← La lógica de qué hacer con los datos
│
├─ 📁 Public            ← La pantalla bonita que ves (HTML, CSS, botones)
│  ├─ login.html        ← Pantalla de login
│  ├─ menu.html         ← Menú principal
│  ├─ Style.css         ← Colores y estilos
│  └─ app.js            ← Lógica de la interfaz
│
├─ 📁 Modules           ← Pantallas especiales para cada área
│  ├─ 📁 compras        ← Proveedores y compras
│  ├─ 📁 logistica      ← Cargas, custodias
│  ├─ 📁 ventas         ← Clientes
│  └─ 📁 pagos          ← (próximamente)
│
├─ 📁 Database          ← Donde se guardan todos los datos
│  └─ acosa_local.db    ← La "caja de almacenamiento"
│
├─ 📁 Config            ← Configuración del sistema
│  └─ .env              ← Contraseñas y puertos (secreto)
│
└─ package.json         ← Lista de programas que necesita el sistema
```

---

## 🛠️ Tecnicismos (Para Gerentes o Curiosos)

**¿Qué tecnología usa?**

- **Node.js + Express:** El servidor que guarda y entrega información.
- **SQLite:** La "caja de almacenamiento" de datos (rápida, fácil, no necesita servidor aparte).
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
