//backend/index.js
const express = require('express');
const cors = require('./config/cors');
const routes = require('./routes/routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api', routes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Archivo demasiado grande. Límite: 10MB'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(` API disponible en http://localhost:${PORT}/api/health`);
  console.log(` Modo: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;