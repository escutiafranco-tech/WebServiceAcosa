/* ================================ */
/* RUTA: MENÚS POR ROL             */
/* ================================ */

const express = require('express');                           // Framework HTTP
const router = express.Router();                              // Instancia de router
const { getMenusByRole } = require('../controllers/menuController'); // Controlador que filtra menús por rol
const { protect } = require('../controllers/authMiddleware'); // Middleware que valida el token JWT

// GET /menus
// - Primero ejecuta `protect` para verificar que el usuario tenga un JWT válido
// - Luego llama a `getMenusByRole`, que usa req.user.role para filtrar los menús
router.get('/', protect, getMenusByRole);
module.exports = router; // Exportamos este router para montarlo en /menus desde Backend/server.js
