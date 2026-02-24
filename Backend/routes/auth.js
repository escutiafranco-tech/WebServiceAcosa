/* ================================ */
/* RUTA: AUTENTICACIÓN (LOGIN)     */
/* ================================ */

const express = require('express');                         // Framework HTTP
const router = express.Router();                            // Instancia de router de Express
const { login } = require('../controllers/authController'); // Controlador con la lógica de login

// POST /auth/login
// - Recibe { username, password } en el cuerpo de la petición
// - Delegamos la validación y generación de token a authController.login
router.post('/login', login);

// Exportamos el router para que Backend/server.js lo monte en /auth
module.exports = router;