/* ================================ */
/* 1. DEPENDENCIAS Y CONEXIÓN DB   */
/* ================================ */

const path = require('path');                    // Módulo nativo para manejar rutas de archivos
const sqlite3 = require('sqlite3').verbose();    // Driver SQLite en modo "verbose" para mayor detalle
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db'); // Ruta a la misma base SQLite que usa el backend (../Database/acosa_local.db)
const db = new sqlite3.Database(dbPath);         // Instancia de conexión a la base de datos

/* ================================ */
/* 2. CONTROLADOR: LISTAR USUARIOS */
/* ================================ */

// Endpoint: GET /users - Devuelve todos los usuarios (para administración)
// O GET /api/users - Devuelve solo usuarios activos (para menú)
exports.getAllUsers = (req, res) => {
  const isAdmin = req.user && req.user.role === 'Administrador';
  
  const query = isAdmin
    ? 'SELECT id, username, nombre, email, role, activo, created_at FROM USERS ORDER BY username ASC'
    : 'SELECT id, username, role FROM USERS WHERE activo = 1 ORDER BY username';

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error leyendo usuarios desde SQLite:', err.message);
      return res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
    res.json(rows || []);
  });
};

// Obtener un usuario por ID
exports.getUserById = (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT id, username, nombre, email, role, activo, created_at FROM USERS WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('Error obteniendo usuario:', err.message);
        return res.status(500).json({ message: 'Error al obtener usuario' });
      }

      if (!row) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(row);
    }
  );
};

// Crear nuevo usuario
exports.createUser = (req, res) => {
  const { username, password, nombre, email, rol, activo } = req.body;

  // Validaciones
  if (!username || !password || !nombre || !email || !rol) {
    return res.status(400).json({ message: 'Campos obligatorios faltantes' });
  }

  if (password.length < 4) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 4 caracteres' });
  }

  // Validar que el usuario no exista
  db.get(
    'SELECT id FROM USERS WHERE username = ?',
    [username],
    (err, row) => {
      if (err) {
        console.error('Error verificando usuario:', err.message);
        return res.status(500).json({ message: 'Error interno' });
      }

      if (row) {
        return res.status(409).json({ message: 'El nombre de usuario ya existe' });
      }

      // Crear el usuario
      const now = new Date().toISOString();
      const nuevoId = `usr_${Date.now()}`;
      const activoValue = activo !== undefined ? (activo ? 1 : 0) : 1;

      db.run(
        'INSERT INTO USERS (id, username, password, nombre, email, role, activo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nuevoId, username, password, nombre, email, rol || 'Usuario', activoValue, now],
        function(insErr) {
          if (insErr) {
            console.error('Error creando usuario:', insErr.message);
            return res.status(500).json({ message: 'Error al crear usuario' });
          }

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
    }
  );
};

// Actualizar usuario
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, password, nombre, email, rol, activo } = req.body;

  // Validaciones
  if (!nombre || !email || !rol) {
    return res.status(400).json({ message: 'Campos obligatorios faltantes' });
  }

  if (password && password.length < 4) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 4 caracteres' });
  }

  // Construir consulta dinámicamente
  let updateFields = [];
  let updateValues = [];

  if (nombre) {
    updateFields.push('nombre = ?');
    updateValues.push(nombre);
  }
  if (email) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (rol) {
    updateFields.push('role = ?');
    updateValues.push(rol);
  }
  if (password) {
    updateFields.push('password = ?');
    updateValues.push(password);
  }
  if (activo !== undefined) {
    updateFields.push('activo = ?');
    updateValues.push(activo ? 1 : 0);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No hay campos para actualizar' });
  }

  updateValues.push(id);

  db.run(
    `UPDATE USERS SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        console.error('Error actualizando usuario:', err.message);
        return res.status(500).json({ message: 'Error al actualizar usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario actualizado correctamente' });
    }
  );
};

// Actualizar solo el estado del usuario
exports.toggleUserStatus = (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  if (activo === undefined) {
    return res.status(400).json({ message: 'El campo activo es requerido' });
  }

  db.run(
    'UPDATE USERS SET activo = ? WHERE id = ?',
    [activo ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Error actualizando estado:', err.message);
        return res.status(500).json({ message: 'Error al actualizar estado' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({ message: 'Estado actualizado correctamente' });
    }
  );
};

// Eliminar usuario
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  // No permitir eliminar al usuario admin del sistema
  if (id === 'admin') {
    return res.status(403).json({ message: 'No se puede eliminar el usuario admin' });
  }

  db.run(
    'DELETE FROM USERS WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Error eliminando usuario:', err.message);
        return res.status(500).json({ message: 'Error al eliminar usuario' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({ message: 'Usuario eliminado correctamente' });
    }
  );
};