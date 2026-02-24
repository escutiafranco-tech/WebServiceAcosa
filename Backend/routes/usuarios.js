/* ================================ */
/* RUTAS: API DE USUARIOS           */
/* ================================ */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../controllers/authMiddleware');

// RUTA: GET /api/usuarios - Obtener todos los usuarios (admin)
router.get('/', protect, adminOnly, userController.getAllUsers);

// RUTA: GET /api/usuarios/:id - Obtener un usuario específico (admin)
router.get('/:id', protect, adminOnly, userController.getUserById);

// RUTA: POST /api/usuarios - Crear nuevo usuario (admin)
router.post('/', protect, adminOnly, userController.createUser);

// RUTA: PUT /api/usuarios/:id - Actualizar usuario (admin)
router.put('/:id', protect, adminOnly, userController.updateUser);

// RUTA: PATCH /api/usuarios/:id/estado - Cambiar estado del usuario (admin)
router.patch('/:id/estado', protect, adminOnly, userController.toggleUserStatus);

// RUTA: DELETE /api/usuarios/:id - Eliminar usuario (admin)
router.delete('/:id', protect, adminOnly, userController.deleteUser);

module.exports = router;
