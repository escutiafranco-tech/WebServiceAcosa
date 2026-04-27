# 🔒 CAMBIOS DE SEGURIDAD - FASE 1 COMPLETADA

**Fecha:** Abril 23, 2026  
**Versión:** 1.0.0-security-phase-1  
**Estado:** ✅ IMPLEMENTADO  

---

## 📋 Resumen Ejecutivo

Se implementaron **7 mejoras críticas de seguridad** en ACOSA para prevenir vulnerabilidades OWASP Top 10:

| # | Vulnerabilidad | Solución | Estado |
|---|---|---|---|
| 1 | Contraseñas en texto plano | bcryptjs (10 rounds) | ✅ Hecho |
| 2 | SQL Injection | Validación y sanitización | ✅ Hecho |
| 3 | JWT_SECRET débil | Clave aleatorio 256-bit | ✅ Hecho |
| 4 | Sin Rate Limiting | express-rate-limit | ✅ Hecho |
| 5 | Sin validación entrada | express-validator | ✅ Hecho |
| 6 | Headers HTTP inseguros | helmet | ✅ Hecho |
| 7 | CORS sin restricción | Whitelist de orígenes | ✅ Hecho |

---

## 🔧 Cambios Implementados Detallados

### 1️⃣ **Hasheo de Contraseñas con bcryptjs**

**Archivo:** `Backend/controllers/authController.js`

**Cambios:**
- Reemplazó comparación de texto plano por `bcrypt.compare()`
- Esquema nuevo: columna `password_hash` en lugar de `password`
- 10 rounds de hashing (estándar NIST)

**Antes:**
```javascript
db.get(
  'SELECT id, username, password, role, activo FROM USERS 
   WHERE username = ? AND password = ? LIMIT 1',
  [username, password]
);
```

**Después:**
```javascript
const passwordMatch = await bcrypt.compare(password, row.password_hash);
if (!passwordMatch) {
  return res.status(401).json({ message: 'Usuario o contraseña incorrecto' });
}
```

**Archivo de Migración:** `Scripts/Scripts de mantenimiento/migrate-to-password-hash.js`

**Uso:**
```powershell
node "Scripts/Scripts de mantenimiento/migrate-to-password-hash.js"
```

---

### 2️⃣ **Validación de Entrada con express-validator**

**Archivo:** `Backend/middleware/validationMiddleware.js` (NUEVO)

**Reglas Implementadas:**

#### Login
- Usuario: 3-50 caracteres, solo alfanuméricos/guiones
- Contraseña: 6-100 caracteres

#### Crear Usuario
- Usuario: 3-50 caracteres validados
- Contraseña: 8+ caracteres, requiere mayúsculas, minúsculas, números, especiales
- Email: Validado y normalizado
- Rol: Solo valores permitidos

#### Actualizar Usuario
- Validación de ID
- Normalización de email
- Límites de longitud

#### Crear Proveedor
- RFC: Validación de formato mexicano
- Email: Validado
- Teléfono: Formato seguro

**Validación en Rutas:**
```javascript
router.post('/login', validateLogin, login);
```

---

### 3️⃣ **JWT_SECRET Seguro y Aleatorio**

**Archivo:** `Config/.env`

**Antes:**
```env
JWT_SECRET=un_secreto_largo_y_dificil_123!
```

**Después:**
```env
# JWT_SECRET: Clave criptográficamente segura de 256 bits
JWT_SECRET=90d807e087e53f95a1b5ada45a822889bb88c0e7ae2c61dc47b9b4b71b2c6c74
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

**Generación segura:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Validación en startup:**
- Verifica que JWT_SECRET tenga mínimo 32 caracteres
- Error fatal si no está configurado
- Evita uso de secreto débil en producción

---

### 4️⃣ **Rate Limiting contra Fuerza Bruta**

**Archivo:** `Backend/routes/auth.js`

**Configuración:**
- Máximo 5 intentos de login en 15 minutos
- Por dirección IP
- Response: HTTP 429 "Too Many Requests"

**Código:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos...' }
});
router.post('/login', loginLimiter, validateLogin, login);
```

**Rate Limit Global (server.js):**
- 100 requests por 15 minutos
- Configurable en `.env` (RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS)

---

### 5️⃣ **Sanitización contra SQL Injection**

**Archivo:** `Backend/routes/catalogos.js`

**Mejoras:**
1. **Validación de tabla:**
   ```javascript
   function validateTableName(tableName) {
     if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
       throw new Error('Nombre de tabla inválido');
     }
   }
   ```

2. **Sanitización de WHERE clause:**
   ```javascript
   function sanitizeWhereClause(filtro) {
     // Validar longitud
     // Blacklist de palabras clave peligrosas
     // Whitelist de operadores permitidos
     // Validar formato seguro
   }
   ```

3. **Operadores permitidos:**
   - `campo = 'valor'`
   - `campo LIKE '%valor%'`
   - `campo > número`
   - `campo IN (...)`

4. **Palabras clave bloqueadas:**
   - DROP, DELETE, INSERT, UPDATE, TRUNCATE
   - EXEC, EXECUTE, UNION
   - Comentarios SQL `--`, `/* */`

**Antes:**
```javascript
const sql = filtro ? `${selectBase} WHERE ${filtro}` : selectBase; // ❌ VULNERABLE
```

**Después:**
```javascript
try {
  const safeFiltro = sanitizeWhereClause(filtro);
  sql = `${selectBase} WHERE ${safeFiltro}`;
} catch (validationErr) {
  return res.status(400).json({ error: 'Validación fallida' });
}
```

---

### 6️⃣ **Headers HTTP Seguros con Helmet**

**Archivo:** `Backend/server.js`

**Headers Implementados:**
```javascript
app.use(helmet({
  contentSecurityPolicy: { /* ... */ },
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Headers Removidos:**
- `X-Powered-By` (no revelar Express)
- `Server` (no revelar versión)

**Headers Agregados:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)
- `Content-Security-Policy`

---

### 7️⃣ **CORS Configurado de Forma Segura**

**Archivo:** `Backend/server.js`

**Configuración:**
```javascript
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://localhost:3001').split(',');
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));
```

**En `.env`:**
```env
ALLOWED_ORIGINS=https://localhost:3001,http://localhost:3001
```

---

## 📦 Dependencias Agregadas

```json
{
  "bcryptjs": "2.4.3",           // Hashing de contraseñas
  "express-validator": "7.0.0",  // Validación de entrada
  "express-rate-limit": "6.7.0", // Rate limiting
  "helmet": "7.0.0",             // Headers HTTP seguros
  "cors": "2.8.5"                // CORS controlado
}
```

**Instalación:** `npm install` (ya está hecho)

---

## 🚀 Guía de Migración a Producción

### Paso 1: Migrar Contraseñas Existentes

```powershell
node "Scripts/Scripts de mantenimiento/migrate-to-password-hash.js"
```

**Qué hace:**
1. Verifica si existe columna `password_hash`
2. La crea si no existe
3. Obtiene todos los usuarios
4. Hashea cada contraseña con bcryptjs
5. Actualiza BD con hashes

**Output esperado:**
```
🔐 MIGRACIÓN: Contraseñas texto plano → hash bcryptjs
✅ Conectado a BD
✅ Columna password_hash creada
📊 Encontrados 5 usuario(s)
✅ admin: contraseña hasheada
✅ usuario1: contraseña hasheada
✅ usuario2: contraseña hasheada
...
📊 RESULTADO:
✅ Migrados: 5
⏭️  Saltados: 0
✅ Migración completada
```

### Paso 2: Generar Nuevo JWT_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiar el resultado y actualizar `Config/.env`:**
```env
JWT_SECRET=<NUEVO_VALOR_AQUI>
```

### Paso 3: Configurar .env para Producción

```env
NODE_ENV=production
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
DEBUG=false
LOG_LEVEL=info
```

### Paso 4: Usar Certificados HTTPS Válidos

**NO usar auto-firmados en producción:**
- Obtener certificado de Let's Encrypt o proveedor
- Actualizar `Backend/certs/` con certificados válidos
- Configurar `USE_HTTPS=true`

### Paso 5: Cambiar Credenciales de BD

En `Config/.env`:
```env
FB_PASSWORD=<CONTRASEÑA_SEGURA>
FB_USER=<USUARIO_PRODUCCION>
```

### Paso 6: Pruebas de Seguridad

**Verificar que funciona:**
```powershell
npm start
```

**Test de login:**
```powershell
curl -X POST https://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin"}'
```

---

## ✅ Checklist de Validación

- [ ] Dependencias instaladas (`npm install`)
- [ ] authController.js actualizado con bcryptjs
- [ ] validationMiddleware.js creado
- [ ] auth.js actualizado con validación y rate limit
- [ ] catalogos.js sanitizado contra SQL injection
- [ ] server.js actualizado con helmet, CORS, rate limit
- [ ] .env actualizado con JWT_SECRET seguro
- [ ] Migración de contraseñas ejecutada
- [ ] Servidor inicia sin errores (`npm start`)
- [ ] Login funciona con credenciales
- [ ] Rate limit funciona (probar 6 logins fallidos)
- [ ] CORS funciona correctamente
- [ ] Headers seguros presentes (DevTools → Network)

---

## 🛡️ Vulnerabilidades Prevenidas

| OWASP Top 10 | Antes | Después | Evidencia |
|---|---|---|---|
| A2: Cryptographic Failures | ❌ Texto plano | ✅ bcryptjs 10 rounds | authController.js:L45 |
| A3: Injection | ❌ Sin validación | ✅ Sanitización + whitelist | catalogos.js:L16-50 |
| A4: Insecure Design | ❌ Sin rate limit | ✅ express-rate-limit | auth.js:L14, server.js:L52 |
| A5: Security Misconfiguration | ❌ Headers débiles | ✅ Helmet + CORS | server.js:L23-70 |
| A6: Vulnerable Components | ❌ Antiguas | ✅ Versiones actuales | package.json |
| A7: Identification & Auth | ❌ JWT débil | ✅ JWT_SECRET seguro 256-bit | .env |

---

## 📞 Soporte

**Problemas comunes:**

### Error: "JWT_SECRET no está configurado"
```
❌ Ejecutar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
✅ Copiar resultado a Config/.env
```

### Error: "Demasiados intentos de login"
```
Normal después de 5 intentos fallidos en 15 minutos
Esperar o usar otra dirección IP
```

### Migración falla
```
Verificar: SELECT COUNT(*) FROM USERS;
Ejecutar manualmente si es necesario
Revisar logs del script
```

---

## 📚 Referencias OWASP

- **Passworads:** https://owasp.org/www-community/controls/Password_Storage_Cheat_Sheet
- **Injection:** https://owasp.org/www-community/attacks/SQL_Injection
- **Rate Limiting:** https://owasp.org/www-community/attacks/Brute_force_attack
- **HTTPS/CORS:** https://owasp.org/www-community/attacks/csrf

---

## 🎯 Próximos Pasos

**Fase 2: Refactorización** (semanas 3-4)
- [ ] Singleton para conexión BD
- [ ] Logger centralizado
- [ ] Manejo de errores global
- [ ] Caché de catálogos

**Fase 3: Documentación** (semana 5)
- [ ] Swagger API docs
- [ ] Diagramas de seguridad

**Fase 4: Testing** (semanas 6-7)
- [ ] Tests de seguridad
- [ ] Penetration testing
- [ ] OWASP ZAP scan

---

**Versión:** 1.0.0-security-phase-1  
**Auditoría:** Francisco Escutia  
**Licencia:** Privada - Uso interno  

*ACOSA © 2026. Todos los derechos reservados.*
