//backend/modelos/ReporteModel.js

const { supabase } = require('../config/conexion');
const { v4: uuidv4 } = require('uuid');

class ReporteModel {
  
  // Generar ID único para reporte
  static generarIdUnico() {
    return `REP-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  // Crear nuevo reporte
static async crear(reporteData) {
    try {
        // Generar ID único
        const reporteId = this.generarIdUnico();
        
        // Preparar datos para inserción
        const reporteParaInsertar = {
            id: reporteId,
            ...reporteData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Insertar reporte
        const { data, error } = await supabase
            .from('reportes_acm')
            .insert([reporteParaInsertar])
            .select()
            .single();

        if (error) {
            console.error('Error de Supabase al crear reporte:', error);
            throw error;
        }
        
        return data;

    } catch (error) {
        console.error('Error en ReporteModel.crear:', error);
        throw error;
    }
}
// Obtener reporte por ID
static async obtenerPorId(id) {
  try {
    const { data, error, status } = await supabase
      .from('reportes_acm')
      .select(`
        *,
        usuario:usuario_id (
          nombre_completo,
          cedula,
          rol
        )
      `)
      .eq('id', id)
      .maybeSingle(); // Usa maybeSingle en lugar de single

    if (error && status !== 406) throw error; // 406 es el código para "no rows"
    return data; // Devuelve null si no hay datos
  } catch (error) {
    console.error('Error en ReporteModel.obtenerPorId:', error);
    throw error;
  }
}

  // Buscar reportes por usuario
  static async obtenerPorUsuario(usuarioId, rol) {
    try {
      let query = supabase
        .from('reportes_acm')
        .select(`
          *,
          usuario:usuario_id (
            nombre_completo,
            cedula
          )
        `)
        .order('created_at', { ascending: false });

      // Si no es administrador, solo ver sus propios reportes
      if (rol !== 'admin') {
        query = query.eq('usuario_id', usuarioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en ReporteModel.obtenerPorUsuario:', error);
      throw error;
    }
  }

  // Buscar reportes con filtros
  static async buscar(filtros = {}) {
    try {
      let query = supabase
        .from('reportes_acm')
        .select(`
          *,
          usuario:usuario_id (
            nombre_completo,
            cedula,
            rol
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.fecha_desde) {
        query = query.gte('fecha', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        query = query.lte('fecha', filtros.fecha_hasta);
      }
      if (filtros.zona) {
        query = query.eq('zona', filtros.zona);
      }
      if (filtros.distrito) {
        query = query.eq('distrito', filtros.distrito);
      }
      if (filtros.circuito) {
        query = query.eq('circuito', filtros.circuito);
      }
      if (filtros.usuario_id && filtros.rol !== 'admin') {
        query = query.eq('usuario_id', filtros.usuario_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en ReporteModel.buscar:', error);
      throw error;
    }
  }

  // Actualizar reporte
  static async actualizar(id, updates) {
    try {
      const { data, error } = await supabase
        .from('reportes_acm')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en ReporteModel.actualizar:', error);
      throw error;
    }
  }

  // Eliminar reporte (solo admin)
  static async eliminar(id) {
    try {
      const { error } = await supabase
        .from('reportes_acm')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Reporte eliminado' };
    } catch (error) {
      console.error('Error en ReporteModel.eliminar:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(usuarioId, rol) {
    try {
      let query = supabase
        .from('reportes_acm')
        .select('*', { count: 'exact', head: false });

      if (rol !== 'admin') {
        query = query.eq('usuario_id', usuarioId);
      }

const { data = [], error, count = 0 } = await query;

      if (error) throw error;

      // Estadísticas por zona
      const zonas = {};
      // Estadísticas por distrito
      const distritos = {};
      // Estadísticas por mes
      const meses = {};

      if (data) {
        data.forEach(reporte => {
          // Contar por zona
          if (reporte.zona) {
            zonas[reporte.zona] = (zonas[reporte.zona] || 0) + 1;
          }

          // Contar por distrito
          if (reporte.distrito) {
            distritos[reporte.distrito] = (distritos[reporte.distrito] || 0) + 1;
          }

          // Contar por mes
          const fecha = new Date(reporte.created_at);
          const mesAnio = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
          meses[mesAnio] = (meses[mesAnio] || 0) + 1;
        });
      }

      return {
        total: count || 0,
        por_zona: zonas,
        por_distrito: distritos,
        por_mes: meses
      };
    } catch (error) {
      console.error('Error en ReporteModel.obtenerEstadisticas:', error);
      throw error;
    }
  }

  // Verificar si existe reporte con mismo ID
  static async verificarIdExistente(id) {
    try {
      const { data, error } = await supabase
        .from('reportes_acm')
        .select('id')
        .eq('id', id)
        .single();

      return { existe: !!data, error };
    } catch (error) {
      return { existe: false, error };
    }
  }

  // Obtener imágenes de reporte
  static async obtenerImagenes(reporteId) {
    try {
      const { data, error } = await supabase
        .from('imagenes_reportes')
        .select('*')
        .eq('reporte_id', reporteId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en ReporteModel.obtenerImagenes:', error);
      throw error;
    }
  }

  // Guardar imágenes de reporte
  static async guardarImagenes(reporteId, imagenes) {
  try {
    const imagenesData = imagenes.map((imagen, index) => ({
      reporte_id: reporteId,
      url_storage: imagen.url,
      nombre_archivo: imagen.nombre,
      orden: index + 1,
      created_at: new Date().toISOString()
    }));

    console.log('Guardando imágenes en BD:', imagenesData);

    const { data, error } = await supabase
      .from('imagenes_reportes')
      .insert(imagenesData);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en ReporteModel.guardarImagenes:', error);
    throw error;
  }
}
}

module.exports = ReporteModel;