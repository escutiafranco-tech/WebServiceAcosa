const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');

const app = express();

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menus');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ SERVIR ARCHIVOS ESTÁTICOS DE modules
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// ✅ SERVIR ARCHIVOS JSON
app.use('/data', express.static(path.join(__dirname, 'data')));

// Rutas
app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);

// Redirigir raíz al login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Soporte HTTPS opcional: si colocas certificados en ./certs/server.pem y ./certs/server-key.pem
const certDir = path.join(__dirname, 'certs');
const certFile = path.join(certDir, 'server.pem');
const keyFile = path.join(certDir, 'server-key.pem');

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  try {
    const options = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    };
    https.createServer(options, app).listen(PORT, HOST, () => {
      console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error al leer certificados, arrancando HTTP en su lugar:', err);
    app.listen(PORT, HOST, () => console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`));
  }
} else {
  // Fallback HTTP (mantener comportamiento actual)
  app.listen(PORT, HOST, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
    console.log('Nota: no se encontraron certificados en ./certs — para HTTPS coloque server.pem y server-key.pem en esa carpeta');
  });
}