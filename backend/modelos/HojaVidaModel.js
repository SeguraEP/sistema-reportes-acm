//backend/modelos/HojaVidaModel.js

const { supabase } = require('../config/conexion');

class HojaVidaModel {
  
  // Crear o actualizar hoja de vida
  static async guardar(usuarioId, hojaVidaData) {
    try {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('hojas_vida')
        .select('id')
        .eq('usuario_id', usuarioId)
        .single();

      if (existente) {
        // Actualizar
        const { data, error } = await supabase
          .from('hojas_vida')
          .update({
            ...hojaVidaData,
            updated_at: new Date().toISOString()
          })
          .eq('usuario_id', usuarioId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nueva
        const { data, error } = await supabase
          .from('hojas_vida')
          .insert([{
            usuario_id: usuarioId,
            ...hojaVidaData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error en HojaVidaModel.guardar:', error);
      throw error;
    }
  }

  // Obtener hoja de vida por usuario
  static async obtenerPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('hojas_vida')
        .select(`
          *,
          usuario:usuarios (
            nombre_completo,
            cedula,
            email,
            telefono,
            rol,
            fecha_ingreso,
            cargo,
            anio_graduacion
          )
        `)
        .eq('usuario_id', usuarioId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no encontrado
      return data || null;
    } catch (error) {
      console.error('Error en HojaVidaModel.obtenerPorUsuario:', error);
      throw error;
    }
  }

  // Obtener todas las hojas de vida (admin)
  static async obtenerTodas() {
    try {
      const { data, error } = await supabase
        .from('hojas_vida')
        .select(`
          *,
          usuario:usuarios (
            nombre_completo,
            cedula,
            email,
            rol,
            cargo
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en HojaVidaModel.obtenerTodas:', error);
      throw error;
    }
  }

  // Eliminar hoja de vida
  static async eliminar(usuarioId) {
    try {
      const { error } = await supabase
        .from('hojas_vida')
        .delete()
        .eq('usuario_id', usuarioId);

      if (error) throw error;
      return { success: true, message: 'Hoja de vida eliminada' };
    } catch (error) {
      console.error('Error en HojaVidaModel.eliminar:', error);
      throw error;
    }
  }

  // Buscar hojas de vida por criterios
  static async buscar(criterios = {}) {
    try {
      let query = supabase
        .from('hojas_vida')
        .select(`
          *,
          usuario:usuarios (
            nombre_completo,
            cedula,
            email,
            rol,
            cargo,
            fecha_ingreso
          )
        `);

      if (criterios.nombre) {
        query = query.ilike('usuarios.nombre_completo', `%${criterios.nombre}%`);
      }
      if (criterios.cedula) {
        query = query.eq('usuarios.cedula', criterios.cedula);
      }
      if (criterios.cargo) {
        query = query.ilike('cargo', `%${criterios.cargo}%`);
      }
      if (criterios.especialidad) {
        query = query.ilike('especialidad', `%${criterios.especialidad}%`);
      }
      if (criterios.anio_ingreso_desde) {
        query = query.gte('fecha_ingreso', criterios.anio_ingreso_desde);
      }
      if (criterios.anio_ingreso_hasta) {
        query = query.lte('fecha_ingreso', criterios.anio_ingreso_hasta);
      }

      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en HojaVidaModel.buscar:', error);
      throw error;
    }
  }

  // Generar estructura estándar de hoja de vida
  static generarEstructuraEstándar() {
    return {
      // Información personal
      datos_personales: {
        nombres_completos: '',
        cedula: '',
        fecha_nacimiento: '',
        lugar_nacimiento: '',
        nacionalidad: '',
        estado_civil: '',
        direccion: '',
        telefono: '',
        email: ''
      },
      
      // Formación académica
      formacion_academica: [
        {
          nivel: 'Primaria',
          institucion: '',
          titulo: '',
          anio_inicio: '',
          anio_fin: '',
          finalizado: true
        },
        {
          nivel: 'Secundaria',
          institucion: '',
          titulo: '',
          anio_inicio: '',
          anio_fin: '',
          finalizado: true
        },
        {
          nivel: 'Universitaria',
          institucion: '',
          titulo: '',
          anio_inicio: '',
          anio_fin: '',
          finalizado: true,
          anio_graduacion: ''
        }
      ],
      
      // Experiencia laboral
      experiencia_laboral: [
        {
          empresa: 'Municipio de Guayaquil',
          cargo: 'Agente de Control Municipal',
          fecha_inicio: '',
          fecha_fin: '',
          funciones: [],
          logros: []
        }
      ],
      
      // Cursos y capacitaciones
      cursos_capacitaciones: [],
      
      // Habilidades
      habilidades: {
        tecnicas: [],
        blandas: [],
        idiomas: []
      },
      
      // Referencias
      referencias: [],
      
      // Información adicional
      informacion_adicional: {
        disponibilidad_viajar: false,
        licencia_conducir: '',
        tipo_licencia: '',
        discapacidad: false,
        tipo_discapacidad: ''
      }
    };
  }
}

module.exports = HojaVidaModel;