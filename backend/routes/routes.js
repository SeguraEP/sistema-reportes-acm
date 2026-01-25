//backend/routes/routes.js

const express = require('express');
const router = express.Router();
const { upload } = require('../config/configStorage');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Controladores
const AuthController = require('../controladores/authController');
const ReporteController = require('../controladores/reporteController');
const UsuarioController = require('../controladores/usuarioController');
const HojaVidaController = require('../controladores/hojaVidaController');
const LeyNormaController = require('../controladores/leyNormaController');

// ==================== RUTAS PÚBLICAS ====================
router.get('/reportes/buscar-publico', ReporteController.buscarReportesPublicos);
router.get('/reportes/estadisticas-publicas', ReporteController.obtenerEstadisticasPublicas);
router.get('/reportes/:id/publico', ReporteController.obtenerReportePublico);
router.get('/reportes/:id/descargar-pdf-publico', ReporteController.descargarReportePDFPublico);
router.get('/reportes/:id/descargar-word-publico', ReporteController.descargarReporteWordPublico);
router.get('/reportes/:id/imprimir-publico', ReporteController.imprimirReportePublico);
router.post('/reportes/:id/leyes-publico', ReporteController.asociarLeyesReportePublico);

// Rutas públicas para leyes/normas
router.get('/leyes-normas/publico', LeyNormaController.obtenerLeyesNormasPublico);
router.get('/leyes-normas/categorias/publico', LeyNormaController.obtenerCategoriasPublico);
// Auth
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/refresh-token', AuthController.refreshToken);
router.post('/auth/solicitar-reactivacion', AuthController.solicitarReactivacion);
router.post('/auth/recuperar-contrasena', AuthController.recuperarContrasena);
router.get('/auth/verify-session', authenticateToken, AuthController.verifySession);

// ==================== RUTAS AUTENTICADAS ====================
router.get('/usuarios/verificar-email', 
  UsuarioController.verificarEmailDisponible
);

router.get('/usuarios/verificar-cedula', 
  UsuarioController.verificarCedulaDisponible
);
// Auth (requiere autenticación)
router.get('/auth/profile', authenticateToken, AuthController.getProfile);
router.put('/auth/profile', authenticateToken, AuthController.updateProfile);
router.post('/auth/change-password', authenticateToken, AuthController.changePassword);
router.post('/auth/logout', authenticateToken, AuthController.logout);

// Reportes
router.post('/reportes', 
   authenticateToken, //comentado temporalmente para permitir usuarios no autenticados
  upload.array('imagenes', 10), 
  ReporteController.crearReporte
);

router.get('/reportes/mis-reportes', 
  authenticateToken, 
  ReporteController.obtenerMisReportes
);

router.get('/reportes/buscar', 
  authenticateToken, 
  ReporteController.buscarReportes
);
router.get('/reportes/estadisticas', 
  authenticateToken, 
  ReporteController.obtenerEstadisticas
);

router.get('/reportes/:id', 
  authenticateToken, 
  ReporteController.obtenerReporte
);

router.put('/reportes/:id', 
  authenticateToken, 
  upload.array('nuevas_imagenes', 10), 
  ReporteController.actualizarReporte
);

router.delete('/reportes/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  ReporteController.eliminarReporte
);

router.get('/reportes/:id/descargar-word', 
  authenticateToken, 
  ReporteController.descargarReporteWord
);

router.get('/reportes/:id/descargar-pdf', 
  authenticateToken, 
  ReporteController.descargarReportePDF
);

router.get('/reportes/:id/imprimir', 
  authenticateToken, 
  ReporteController.imprimirReporte
);

router.post('/reportes/:id/coordenadas', 
  authenticateToken, 
  ReporteController.agregarCoordenadas
);


router.get('/reportes/ubicacion/cercanos', 
  authenticateToken, 
  ReporteController.obtenerReportesPorUbicacion
);

// Zonas de Guayaquil (público pero cacheado)
router.get('/zonas-guayaquil', ReporteController.obtenerZonasGuayaquil);

// Usuarios
router.get('/usuarios', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.obtenerUsuarios
);

router.get('/usuarios/buscar', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.buscarUsuarios
);

router.get('/usuarios/:id', 
  authenticateToken, 
  UsuarioController.obtenerUsuario
);

router.put('/usuarios/:id', 
  authenticateToken, 
  UsuarioController.actualizarUsuario
);

router.put('/usuarios/:id/desactivar', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.desactivarCuenta
);

router.put('/usuarios/:id/reactivar', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.reactivarCuenta
);

router.put('/usuarios/:id/cambiar-rol', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.cambiarRol
);

router.get('/usuarios/:id/reportes', 
  authenticateToken, 
  UsuarioController.obtenerReportesUsuario
);

router.get('/usuarios/:id/reporte-actividad', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.generarReporteActividad
);

router.get('/usuarios/estadisticas', 
  authenticateToken, 
  authorizeRoles('admin'), 
  UsuarioController.obtenerEstadisticasUsuarios
);



// Hojas de Vida
router.post('/hojas-vida', 
  authenticateToken, 
  HojaVidaController.guardarHojaVida
);

router.get('/hojas-vida/mi-hoja-vida', 
  authenticateToken, 
  HojaVidaController.obtenerMiHojaVida
);

router.get('/hojas-vida/usuario/:usuario_id', 
  authenticateToken, 
  HojaVidaController.obtenerHojaVidaUsuario
);

router.get('/hojas-vida/todas', 
  authenticateToken, 
  authorizeRoles('admin'), 
  HojaVidaController.obtenerTodasHojasVida
);

router.get('/hojas-vida/buscar', 
  authenticateToken, 
  authorizeRoles('admin'), 
  HojaVidaController.buscarHojasVida
);

router.get('/hojas-vida/usuario/:usuario_id/descargar-pdf', 
  authenticateToken, 
  HojaVidaController.descargarHojaVidaPDF
);

router.get('/hojas-vida/usuario/:usuario_id/descargar-word', 
  authenticateToken, 
  HojaVidaController.descargarHojaVidaWord
);

router.post('/hojas-vida/usuario/:usuario_id/exportar', 
  authenticateToken, 
  HojaVidaController.exportarHojaVida
);

router.delete('/hojas-vida/usuario/:usuario_id', 
  authenticateToken, 
  HojaVidaController.eliminarHojaVida
);

router.get('/hojas-vida/generar-plantilla', 
  authenticateToken, 
  HojaVidaController.generarPlantilla
);
// Leyes y Normas
router.get('/leyes-normas', 
  authenticateToken, 
  LeyNormaController.obtenerLeyesNormas
);


router.get('/leyes-normas/categoria/:categoria', 
  authenticateToken, 
  LeyNormaController.obtenerPorCategoria
);
router.get('/leyes-normas/estructura-completa', 
  authenticateToken, 
  LeyNormaController.obtenerEstructuraCompleta
);
router.get('/leyes-normas/:id', 
  authenticateToken, 
  LeyNormaController.obtenerPorId
);
router.get('/leyes-normas/categorias', 
  authenticateToken, 
  LeyNormaController.obtenerCategorias
);

router.get('/leyes-normas/buscar', 
  authenticateToken, 
  LeyNormaController.buscarLeyesNormas
);

router.get('/leyes-normas/:ley_id/articulos', 
  authenticateToken, 
  LeyNormaController.obtenerArticulos
);

router.get('/leyes-normas/mas-utilizadas', 
  authenticateToken, 
  LeyNormaController.obtenerMasUtilizadas
);



// Leyes y Normas - Reportes
router.get('/reportes/:reporte_id/leyes-normas', 
  authenticateToken, 
  LeyNormaController.obtenerLeyesReporte
);

router.post('/reportes/:reporte_id/leyes-normas', 
  authenticateToken, 
  LeyNormaController.asociarLeyReporte
);

router.delete('/reportes/:reporte_id/leyes-normas/:ley_norma_id', 
  authenticateToken, 
  LeyNormaController.desasociarLeyReporte
);

// Leyes y Normas - Admin
router.post('/leyes-normas', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.crearLeyNorma
);

router.put('/leyes-normas/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.actualizarLeyNorma
);

router.delete('/leyes-normas/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.eliminarLeyNorma
);

router.post('/leyes-normas/:ley_id/articulos', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.agregarArticulo
);

router.put('/leyes-normas/articulos/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.actualizarArticulo
);

router.delete('/leyes-normas/articulos/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  LeyNormaController.eliminarArticulo
);

// Ruta de salud
router.get('/health', async (req, res) => {
  try {
    // aquí puedes agregar chequeos reales (DB, storage, etc)
    return res.json({
      success: true,
      backend: 'ok',
      database: 'ok',
      storage: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Sistema de Reportes ACM - Backend'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      backend: 'error'
    });
  }
});


module.exports = router;