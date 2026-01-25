//backend/controladores/usuarioController.js

const UsuarioModel = require('../modelos/UsuarioModel');
const HojaVidaModel = require('../modelos/HojaVidaModel');
const { supabase } = require('../config/conexion');

class UsuarioController {
  
  // Obtener todos los usuarios (admin)
  static async obtenerUsuarios(req, res) {
    try {
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden ver todos los usuarios'
        });
      }

      const usuarios = await UsuarioModel.obtenerTodos();

      // Omitir contraseñas
      const usuariosSeguros = usuarios.map(usuario => {
        const { password, ...usuarioSeguro } = usuario;
        return usuarioSeguro;
      });

      res.json({
        success: true,
        data: usuariosSeguros
      });

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  // Obtener usuario por ID
 static async obtenerUsuario(req, res) {
  try {
    const { id } = req.params;
    
    // Si no hay usuario autenticado (req.usuario = null), permitir acceso público limitado
    if (!req.usuario) {
      // Solo permitir verificación básica para rutas públicas
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre_completo, cedula, rol')
        .eq('id', id)
        .maybeSingle();

      if (error || !usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          usuario: usuario
        }
      });
    }

    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    // Verificar permisos (admin puede ver todos, otros solo su propio perfil)
    if (usuarioRol !== 'admin' && id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este usuario'
      });
    }

    const usuario = await UsuarioModel.obtenerPorId(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Omitir información sensible
    const { password, ...usuarioSeguro } = usuario;

    // Obtener hoja de vida si existe
    const hojaVida = await HojaVidaModel.obtenerPorUsuario(id);

    res.json({
      success: true,
      data: {
        usuario: usuarioSeguro,
        hoja_vida: hojaVida
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
}

  // Actualizar usuario (admin o propio)
  static async actualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      // Verificar permisos
      if (usuarioRol !== 'admin' && id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para actualizar este usuario'
        });
      }

      // Si no es admin, restringir campos que se pueden actualizar
      if (usuarioRol !== 'admin') {
        const camposPermitidos = [
          'telefono', 'direccion', 'fecha_nacimiento',
          'lugar_nacimiento', 'estado_civil'
        ];
        
        Object.keys(updates).forEach(key => {
          if (!camposPermitidos.includes(key)) {
            delete updates[key];
          }
        });
      } else {
        // Admin puede actualizar más campos, pero no algunos críticos
        const camposProhibidos = ['id', 'email', 'cedula', 'password'];
        camposProhibidos.forEach(campo => delete updates[campo]);
      }

      const usuarioActualizado = await UsuarioModel.actualizar(id, updates);

      const { password, ...usuarioSeguro } = usuarioActualizado;

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioSeguro
      });

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario'
      });
    }
  }

  // Desactivar cuenta (admin)
  static async desactivarCuenta(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden desactivar cuentas'
        });
      }

      const usuarioDesactivado = await UsuarioModel.desactivarCuenta(id);

      res.json({
        success: true,
        message: 'Cuenta desactivada exitosamente',
        data: usuarioDesactivado
      });

    } catch (error) {
      console.error('Error desactivando cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desactivar cuenta'
      });
    }
  }

  // Reactivar cuenta (admin)
  static async reactivarCuenta(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden reactivar cuentas'
        });
      }

      const usuarioReactivado = await UsuarioModel.reactivarCuenta(id);

      res.json({
        success: true,
        message: 'Cuenta reactivada exitosamente',
        data: usuarioReactivado
      });

    } catch (error) {
      console.error('Error reactivando cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reactivar cuenta'
      });
    }
  }

  // Cambiar rol de usuario (admin)
  static async cambiarRol(req, res) {
    try {
      const { id } = req.params;
      const { nuevoRol } = req.body;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden cambiar roles'
        });
      }

      // Validar nuevo rol
      const rolesPermitidos = ['acm', 'jefe_patrulla', 'supervisor', 'admin'];
      if (!rolesPermitidos.includes(nuevoRol)) {
        return res.status(400).json({
          success: false,
          message: 'Rol no válido'
        });
      }

      // No permitir cambiar el rol del último admin
      if (nuevoRol !== 'admin') {
        const { data: admins } = await supabase
          .from('usuarios')
          .select('id')
          .eq('rol', 'admin')
          .eq('cuenta_activa', true);

        if (admins && admins.length <= 1 && admins[0].id === id) {
          return res.status(400).json({
            success: false,
            message: 'No se puede quitar el rol de admin al último administrador activo'
          });
        }
      }

      const usuarioActualizado = await UsuarioModel.actualizar(id, { rol: nuevoRol });

      res.json({
        success: true,
        message: `Rol cambiado a ${nuevoRol} exitosamente`,
        data: usuarioActualizado
      });

    } catch (error) {
      console.error('Error cambiando rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar rol'
      });
    }
  }

  // Buscar usuarios (admin)
  static async buscarUsuarios(req, res) {
    try {
      const usuarioRol = req.usuario.rol;
      const criterios = req.query;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden buscar usuarios'
        });
      }

      const usuarios = await UsuarioModel.buscar(criterios);

      // Omitir contraseñas
      const usuariosSeguros = usuarios.map(usuario => {
        const { password, ...usuarioSeguro } = usuario;
        return usuarioSeguro;
      });

      res.json({
        success: true,
        data: usuariosSeguros,
        total: usuariosSeguros.length
      });

    } catch (error) {
      console.error('Error buscando usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar usuarios'
      });
    }
  }

  // Obtener estadísticas de usuarios (admin)
  static async obtenerEstadisticasUsuarios(req, res) {
    try {
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden ver estadísticas'
        });
      }

      const estadisticas = await UsuarioModel.obtenerEstadisticas();

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }

  // Obtener reportes de un usuario
  static async obtenerReportesUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      // Verificar permisos (admin puede ver todos, otros solo sus propios)
      if (usuarioRol !== 'admin' && id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver los reportes de este usuario'
        });
      }

      // Obtener reportes del usuario
      const { data: reportes, error } = await supabase
        .from('reportes_acm')
        .select('*')
        .eq('usuario_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener estadísticas de reportes
      const totalReportes = reportes?.length || 0;
      const reportesUltimoMes = reportes?.filter(reporte => {
        const fechaReporte = new Date(reporte.created_at);
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);
        return fechaReporte > unMesAtras;
      }).length || 0;

      res.json({
        success: true,
        data: {
          reportes: reportes || [],
          estadisticas: {
            total: totalReportes,
            ultimo_mes: reportesUltimoMes
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo reportes de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reportes de usuario'
      });
    }
  }

  // Generar reporte de actividad de usuario
  static async generarReporteActividad(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden generar reportes de actividad'
        });
      }

      // Obtener usuario
      const usuario = await UsuarioModel.obtenerPorId(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Obtener reportes del usuario
      const { data: reportes } = await supabase
        .from('reportes_acm')
        .select('*')
        .eq('usuario_id', id)
        .order('created_at', { ascending: false });

      // Obtener intentos de login
      const { data: intentosLogin } = await supabase
        .from('intentos_login')
        .select('*')
        .eq('usuario_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Generar reporte de actividad
      const reporteActividad = {
        usuario: {
          id: usuario.id,
          nombre_completo: usuario.nombre_completo,
          cedula: usuario.cedula,
          email: usuario.email,
          rol: usuario.rol,
          cargo: usuario.cargo,
          fecha_ingreso: usuario.fecha_ingreso,
          cuenta_activa: usuario.cuenta_activa,
          created_at: usuario.created_at
        },
        actividad: {
          total_reportes: reportes?.length || 0,
          reportes_ultimo_mes: reportes?.filter(r => {
            const fecha = new Date(r.created_at);
            const unMesAtras = new Date();
            unMesAtras.setMonth(unMesAtras.getMonth() - 1);
            return fecha > unMesAtras;
          }).length || 0,
          reportes_por_zona: reportes?.reduce((acc, r) => {
            acc[r.zona] = (acc[r.zona] || 0) + 1;
            return acc;
          }, {}) || {},
          ultimo_login_exitoso: intentosLogin?.find(i => i.intento_exitoso)?.created_at || null,
          intentos_fallidos_recientes: intentosLogin?.filter(i => !i.intento_exitoso).length || 0
        },
        reportes_recientes: reportes?.slice(0, 10) || [],
        intentos_login_recientes: intentosLogin?.slice(0, 10) || [],
        generado_en: new Date().toISOString(),
        generado_por: req.usuario.id
      };

      res.json({
        success: true,
        data: reporteActividad
      });

    } catch (error) {
      console.error('Error generando reporte de actividad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de actividad'
      });
    }
  }
// Verificar disponibilidad de email
static async verificarEmailDisponible(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    const usuario = await UsuarioModel.obtenerPorEmail(email);

    res.json({
      success: true,
      data: {
        email,
        disponible: !usuario
      }
    });

  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar email'
    });
  }
}

// Verificar disponibilidad de cédula
static async verificarCedulaDisponible(req, res) {
  try {
    const { cedula } = req.query;

    if (!cedula) {
      return res.status(400).json({
        success: false,
        message: 'Cédula es requerida'
      });
    }

    // Usar supabaseAdmin para bypass RLS en verificación pública
    const { supabaseAdmin } = require('../config/supabaseAdmin');
    
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('cedula', cedula)
      .maybeSingle(); // Usar maybeSingle en lugar de single

    if (error) {
      console.error('Error en consulta de cédula:', error);
      // Si hay error, asumimos que está disponible
      return res.json({
        success: true,
        data: {
          cedula,
          disponible: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        cedula,
        disponible: !usuario
      }
    });

  } catch (error) {
    console.error('Error verificando cédula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar cédula'
    });
  }
}

}

module.exports = UsuarioController;