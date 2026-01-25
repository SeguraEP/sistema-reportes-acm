//backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/conexion');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // Usuario no autenticado
      req.usuario = null;
      return next();
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Error verificando token Supabase:', error?.message);
      req.usuario = null;
      return next();
    }

    // Obtener información del usuario desde la base de datos
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !usuario) {
      req.usuario = null;
      return next();
    }

    req.usuario = usuario;
    next();

  } catch (err) {
    console.error('Error en authenticateToken:', err.message);
    req.usuario = null;
    next();
  }
};

// Middleware para rutas públicas que no requieren autenticación
const allowPublicAccess = (req, res, next) => {
  // Para estas rutas, establecer req.usuario = null y permitir acceso
  req.usuario = null;
  next();
};

// Middleware para verificar si es admin, pero permitir acceso público si no hay usuario
const authorizeRolesOrPublic = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      // Si no hay usuario autenticado, permitir acceso público (solo para lectura)
      if (req.method === 'GET') {
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para esta acción' 
      });
    }

    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para esta acción' 
      });
    }

    next();
  };
};

module.exports = { 
  authenticateToken, 
  authorizeRoles, 
  allowPublicAccess,
  authorizeRolesOrPublic 
};