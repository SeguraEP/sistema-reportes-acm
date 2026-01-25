// backend/config/cors.js
const cors = require('cors');

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000', // Frontend local
  'http://localhost:3001', // Backend local si aplica
  'https://sistema-reportes-acm.vercel.app', // Frontend producción Vercel
  'https://sistema-reportes-acm-backend.onrender.com' // Backend Render
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej. Postman o server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Permitir todos los subdominios de Vercel y Render por si cambian URLs dinámicas
      if (origin.match(/\.vercel\.app$/)) return callback(null, true);
      if (origin.match(/\.onrender\.com$/)) return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Access-Control-Expose-Headers'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Exportar middleware listo para usar en Express
module.exports = cors(corsOptions);
