# 📦 ACOSA - ERP para tu Empresa

**Bienvenido a ACOSA**, tu plataforma integral de gestión empresarial diseñada para **pequeñas y medianas empresas** que necesitan controlar proveedores, clientes, logística, pagos y producción en un solo lugar.

---

## 🎯 ¿Qué es ACOSA?

ACOSA es un **Sistema de Gestión Empresarial (ERP)** web que te permite:

- 📂 **Organizar** toda la información de tu negocio
- 🔍 **Encontrar** datos rápidamente
- 📊 **Reportar** a través de Excel y análisis
- 🔐 **Proteger** la información con roles y permisos
- 🌐 **Acceder** desde cualquier navegador y computadora

No necesitas instalar nada complicado. Solo abre tu navegador, accede al sistema y empieza.

---

## 💼 Para Qué Sirve

### 📋 **Gestión de Proveedores**
- Guarda información de empresas de las que compras
- RFC, dirección, contactos, teléfonos
- Servicios que ofrecen
- Sucursales y ubicaciones
- Historial de transacciones

### 👥 **Gestión de Clientes**
- Quiénes son tus clientes
- A dónde envías productos/servicios
- Historial de compras
- Formas de contacto
- Restricciones o notas especiales

### 🚚 **Logística y Entregas**
- Seguimiento de cargas
- Bill of Lading (guías de embarque)
- Packing lists (listas de empaque)
- Custodias y seguros
- Reportes de logística
- Expedientes de carga y descarga

### 💰 **Gestión de Pagos**
- Registra pagos a proveedores
- Registra pagos de clientes
- Historial de transacciones
- Control de deudas
- Reportes financieros

### 🏭 **Control de Producción**
- Gestión de lotes
- Control de procesos
- Seguimiento de materiales
- Reportes de producción

### 👨‍💼 **Gestión de Usuarios**
- Quién puede entrar al sistema
- Qué puede ver cada persona (roles)
- Auditoría de actividades
- Administración de acceso

---

## 🚀 Cómo Empezar

### 📋 Lo que necesitas

- Una computadora con **Windows**
- **PowerShell** (ya viene instalado)
- Conexión a internet
- Un navegador (Chrome, Firefox, Edge)

### ⚙️ Instalación (Solo la Primera Vez)

**Paso 1:** Abre PowerShell (presiona `Windows + R`, escribe `powershell` y presiona Enter)

**Paso 2:** Ve a la carpeta del proyecto:
```powershell
cd "C:\Users\Francisco Escutia\Desktop\WEBSERVICE ACOSA"
```

**Paso 3:** Instala las dependencias (tarda 1-2 minutos):
```powershell
npm ci
```

**Paso 4:** Inicia el servidor:
```powershell
npm start
```

Verás un mensaje como:
```
✅ Servidor HTTPS corriendo en https://localhost:3001/login.html
```

**Paso 5:** Abre tu navegador y accede a:
```
https://localhost:3001/login.html
```

---

## 🔐 Acceso Inicial

**Usuario por defecto:**
- 👤 **Usuario:** `admin`
- 🔑 **Contraseña:** `admin`

⚠️ **Nota:** Cambia esta contraseña inmediatamente después del primer acceso por seguridad.

---

## 📚 Módulos (Áreas del Sistema)

El sistema está organizado en módulos especializados:

### 🛒 **Compras**
- **Proveedores:** Registra y busca proveedores
- **Productos/Servicios:** Catálogo de lo que compras
- **Reportes:** Análisis de compras

### 🚚 **Logística**
- **Comercio Exterior:** Gestión de importaciones/exportaciones
- **Cargas:** Seguimiento de entregas
- **Custodias:** Resguardo de mercancía
- **Fletes:** Gestión de transporte
- **Seguros:** Pólizas y coberturas

### 💸 **Pagos**
- **Pagos a Proveedores:** Registro de pagos salientes
- **Pagos de Clientes:** Registro de ingresos

### 🏭 **Producción**
- **Lotes:** Gestión de tandas de producción

### 💼 **Administración**
- **Usuarios:** Crear y gestionar accesos
- **Configuración:** Ajustes del sistema

---

## 💡 Preguntas Frecuentes

### ❓ ¿Puedo acceder desde mi celular?
Sí, pero no está optimizado. Se recomienda usar computadora de escritorio.

### ❓ ¿Qué pasa si cierro el navegador?
Tu información se guarda. Al volver a acceder verás todo igual.

### ❓ ¿Qué pasa si falla internet?
El servidor sigue funcionando en tu computadora. Puedes seguir usando el sistema localmente. Cuando internet vuelva, se sincronizará.

### ❓ ¿Cuántos usuarios puede haber?
No hay límite. Puedes crear todos los que necesites y asignarles diferentes permisos.

### ❓ ¿Cómo genero reportes?
En la mayoría de módulos encontrarás botones de "Exportar a Excel". El sistema genera automáticamente los reportes en Excel.

### ❓ ¿Es seguro mi información?
Sí. El sistema usa encriptación HTTPS y autenticación de usuarios. Solo quienes tengan acceso autenticado pueden ver datos.

### ❓ ¿Puedo hacer backup de mis datos?
Sí. Los datos se guardan en archivos que puedes copiar y respaldar. Consulta con tu administrador del sistema.

### ❓ ¿Qué hago si algo no funciona?
1. Recarga la página (Ctrl+R o Cmd+R)
2. Cierra y abre el navegador nuevamente
3. Reinicia el servidor (cierra PowerShell y ejecuta `npm start` de nuevo)
4. Contacta al equipo de soporte

---

## 📞 Soporte

Si tienes problemas o dudas sobre cómo usar ACOSA:

1. **Consulta el README_TECNICO.md** para detalles técnicos
2. **Revisa los análisis de auditoría** para mejoras planeadas
3. **Contacta al administrador del sistema** de tu empresa

---

## 📋 Características Principales

✅ **Interfaz intuitiva:** Diseñada para usuarios no técnicos  
✅ **Acceso desde cualquier navegador:** Chrome, Firefox, Edge, Safari  
✅ **Sin instalación:** Solo abre y usa  
✅ **Seguridad:** Autenticación y roles de usuario  
✅ **Datos centralizados:** Todo en un solo lugar  
✅ **Reportes en Excel:** Exporta información fácilmente  
✅ **Catálogos dinámicos:** Configura tus propios valores  
✅ **Escalable:** Crece con tu negocio  

---

## 🎓 Aprende Más

Para información técnica sobre cómo está construido ACOSA, consulta **README_TECNICO.md**

Para una auditoría detallada del código y mejoras planeadas, consulta:
- 📄 **ANALISIS_DETALLADO_ACOSA.md** - Análisis exhaustivo
- 📄 **GUIA_REFACTORIZACION.md** - Cómo mejorar el código
- 📄 **RESUMEN_EJECUTIVO.md** - Resumen ejecutivo

---

**Versión:** 1.0.0  
**Última actualización:** Abril 2026  
**Licencia:** Privada - Uso interno

*ACOSA © 2026. Todos los derechos reservados.*
