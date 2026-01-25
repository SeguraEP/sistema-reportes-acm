//backend/config/configStorage.js

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en memoria para imágenes
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
    files: 10 // Máximo 10 imágenes por reporte
  }
});

module.exports = { upload };