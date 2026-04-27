/* ================================ */
/* 1. DEPENDENCIAS Y CONEXIÓN DB   */
/* ================================ */

const path = require('path');                    // Módulo nativo para manejar rutas de archivos
const bcrypt = require('bcryptjs');              // Hashing de contraseñas
const { getSQLiteInstance } = require('../utils/database'); // Pool centralizado
const { 
  isValidUsername, 
  isValidPassword, 
  isValidEmail, 
  isValidName,
  isValidId,
  createErrorResponse, 
  createSuccessResponse,
  safeHandler 
} = require('../utils/security'); // Validación y seguridad

// Inicializar BD de forma lazy
const dbPath = path.join(__dirname, '..', '..', 'Database', 'acosa_local.db');
let db = null;

function getDb() {
  if (!db) {
    db = getSQLiteInstance(dbPath);
  }
  return db;
}

/* ================================ */
/* 2. CONTROLADOR: LISTAR USUARIOS */
/* ================================ */

// Endpoint: GET /users - Devuelve todos los usuarios (para administración)
// O GET /api/users - Devuelve solo usuarios activos (para menú)
// Con paginación: ?page=1&pageSize=20
exports.getAllUsers = (req, res) => {
  const isAdmin = req.user && req.user.role === 'Administrador';
  const { page = 1, pageSize = 20 } = req.pagination || {};
  
  // Parámetros validados
  const currentPage = Math.max(1, parseInt(page) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  const offset = (currentPage - 1) * size;

  const baseQuery = isAdmin
    ? 'SELECT id, username, nombre, email, role, activo, created_at FROM USERS ORDER BY username ASC'
    : 'SELECT id, username, role FROM USERS WHERE activo = 1 ORDER BY username';

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_table`;
  
  getDb().get(countQuery, [], (countErr, countResult) => {
    if (countErr) {
      console.error('Error contando usuarios:', countErr.message);
      return res.status(500).json({ error: 'Error obteniendo usuarios' });
    }

    const total = countResult?.total || 0;

    // Obtener registros paginados
    const paginatedQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    
    getDb().all(paginatedQuery, [size, offset], (err, rows) => {
      if (err) {
        console.error('Error leyendo usuarios desde SQLite:', err.message);
        return res.status(500).json({ error: 'Error obteniendo usuarios' });
      }
      
      // Respuesta con datos paginados
      res.json(createSuccessResponse(
        {
          usuarios: rows || [],
          paginacion: {
            pagina: currentPage,
            tamanoPagina: size,
            total,
            totalPaginas: Math.ceil(total / size)
          }
        },
        'Usuarios obtenidos exitosamente'
      ));
    });
  });
};

// Obtener un usuario por ID
exports.getUserById = (req, res) => {
  const { id } = req.params;

  // 🔒 Validar ID
  if (!isValidId(id)) {
    const { statusCode, body } = createErrorResponse('ID de usuario inválido');
    return res.status(statusCode).json(body);
  }

  getDb().get(
    'SELECT id, username, nombre, email, role, activo, created_at FROM USERS WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('Error obteniendo usuario:', err.message);
        const { statusCode, body } = createErrorResponse('Error al obtener usuario', 500);
        return res.status(statusCode).json(body);
      }

      if (!row) {
        const { statusCode, body } = createErrorResponse('Usuario no encontrado', 404);
        return res.status(statusCode).json(body);
      }

      res.json(createSuccessResponse(row, 'Usuario obtenido exitosamente'));
    }
  );
};

// Crear nuevo usuario
exports.createUser = (req, res) => {
  const { username, password, nombre, email, rol, activo } = req.body;

  // 🔒 VALIDACIONES MEJORADAS
  if (!username || !password || !nombre || !email || !rol) {
    const { statusCode, body } = createErrorResponse('Campos obligatorios faltantes');
    return res.status(statusCode).json(body);
  }

  // Validar username
  if (!isValidUsername(username)) {
    const { statusCode, body } = createErrorResponse(
      'Username inválido: 3-50 caracteres, solo alfanumérico, guiones y guiones bajos'
    );
    return res.status(statusCode).json(body);
  }

  // Validar contraseña (fuerza mínima)
  if (!isValidPassword(password, 8)) {
    const { statusCode, body } = createErrorResponse(
      'Contraseña débil: mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números'
    );
    return res.status(statusCode).json(body);
  }

  // Validar nombre
  if (!isValidName(nombre)) {
    const { statusCode, body } = createErrorResponse(
      'Nombre inválido: 2-100 caracteres, solo letras y espacios'
    );
    return res.status(statusCode).json(body);
  }

  // Validar email
  if (!isValidEmail(email)) {
    const { statusCode, body } = createErrorResponse('Email inválido');
    return res.status(statusCode).json(body);
  }

  // Validar rol
  const rolesValidos = ['Administrador', 'Supervisor', 'Usuario'];
  if (!rolesValidos.includes(rol)) {
    const { statusCode, body } = createErrorResponse(
      `Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`
    );
    return res.status(statusCode).json(body);
  }

  // Verificar que el usuario no exista
  getDb().get(
    'SELECT id FROM USERS WHERE username = ?',
    [username],
    (err, row) => {
      if (err) {
        console.error('Error verificando usuario:', err.message);
        const { statusCode, body } = createErrorResponse('Error al verificar usuario', 500);
        return res.status(statusCode).json(body);
      }

      if (row) {
        const { statusCode, body } = createErrorResponse('El nombre de usuario ya existe', 409);
        return res.status(statusCode).json(body);
      }

      // 🔒 HASHEAR CONTRASEÑA antes de guardar
      bcrypt.hash(password, 10, (hashErr, passwordHash) => {
        if (hashErr) {
          console.error('Error hasheando contraseña:', hashErr.message);
          const { statusCode, body } = createErrorResponse('Error al crear usuario', 500);
          return res.status(statusCode).json(body);
        }

        // Crear el usuario
        const now = new Date().toISOString();
        const nuevoId = `usr_${Date.now()}`;
        const activoValue = activo !== undefined ? (activo ? 1 : 0) : 1;

        getDb().run(
          'INSERT INTO USERS (id, username, password_hash, nombre, email, role, activo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [nuevoId, username, passwordHash, nombre, email, rol, activoValue, now],
          function(insErr) {
            if (insErr) {
              console.error('Error creando usuario:', insErr.message);
              const { statusCode, body } = createErrorResponse('Error al crear usuario', 500);
              return res.status(statusCode).json(body);
            }

            res.status(201).json(createSuccessResponse({
              id: nuevoId,
              username,
              nombre,
              email,
              role: rol,
              activo: activoValue,
              created_at: now
            }, 'Usuario creado exitosamente'));
          }
        );
      });
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

  getDb().run(
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

  getDb().run(
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

  getDb().run(
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