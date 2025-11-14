const express = require('express');
const app = express();
const path = require('path');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ AGREGA ESTA LÍNEA PARA SERVIR ARCHIVOS JSON
app.use('/data', express.static(path.join(__dirname, 'data')));

// Rutas
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);

// Redirigir raíz al login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://localhost:${PORT} y http://192.168.0.75:${PORT}`));
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));