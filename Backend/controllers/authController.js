/* ================================ */
/* 1. DEPENDENCIAS Y CONFIGURACIÓN */
/* ================================ */

const path = require('path');                 // Módulo nativo para trabajar con rutas de archivos
const jwt = require('jsonwebtoken');          // Librería para generar y firmar tokens JWT
const sqlite3 = require('sqlite3').verbose(); // Driver de SQLite en modo "verbose" (más mensajes de depuración)

// Ruta absoluta a la base de datos SQLite

const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db'); // Coincide con la que se utiliza en Backend/server.js (../Database/acosa_local.db)
const db = new sqlite3.Database(dbPath); // Instancia de conexión contra esa base de datos

/* ================================ */
/* 2. CONTROLADOR: LOGIN DE USUARIO */
/* ================================ */

// Endpoint: POST /auth/login

// - Si es correcto, genera y devuelve un token JWT
exports.login = (req, res) => { // - Valida usuario y contraseña contra la tabla USERS de SQLite
  const { username, password } = req.body;   // Extraemos credenciales enviadas en el cuerpo de la petición


  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }    // Validación rápida de que vengan ambos campos

  // Consulta SQL: busca un usuario activo que coincida con usuario y contraseña
  // NOTA: Actualmente compara contraseña en texto plano (pendiente: usar hashes)
  db.get(
    'SELECT id, username, password, role, activo FROM USERS WHERE username = ? AND password = ? LIMIT 1',
    [username, password],
    (err, row) => {
      // Si hubo error al consultar la BD, devolvemos 500
      if (err) {
        console.error('Error consultando USERS:', err.message);
        return res.status(500).json({ message: 'Error interno de autenticación' });
      }

      // Si no encontró ningún usuario, credenciales inválidas
      if (!row) {
        return res.status(401).json({ message: 'Usuario o contraseña incorrecto' });
      }

      // Si el usuario está marcado como inactivo, bloqueamos el acceso
      if (row.activo === 0) {
        return res.status(403).json({ message: 'Usuario inactivo' });
      }

      // Secreto usado para firmar el JWT (se recomienda definir JWT_SECRET en .env)
      const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';

      // Cargamos en el payload datos mínimos del usuario (id, username, rol)
      const token = jwt.sign(
        { id: row.id, username: row.username, role: row.role },
        JWT_SECRET,
        { expiresIn: '2h' } // El token caduca en 2 horas
      );

      // Devolvemos el token al frontend
      res.json({ token });
    }
  );
};
