/* ================================ */
/* ⚠️ RUTA CONSOLIDADA - NO SE USA  */
/* ================================ */

/*
  Este archivo FUE LA RUTA ANTIGUA para usuarios.
  
  CAMBIO: Ahora se usa usuarios.js para TODO
  - Ruta antigua: /users (solo GET de usuarios activos)
  - Ruta nueva:   /api/usuarios (CRUD completo + admin)
  
  Este archivo se mantiene como backup histórico.
  Si necesitas restaurar: descomenta el código abajo.
  
  ELIMINADO: Línea de require en Backend/server.js
  CAMBIO: app.use('/users', ...) removido
*/

/*
// CÓDIGO ANTERIOR (NO USAR):
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../controllers/authMiddleware');

router.get('/', protect, userController.getAllUsers);
module.exports = router;
*/

// USAR USUARIOS.JS EN SU LUGAR
module.exports = null;