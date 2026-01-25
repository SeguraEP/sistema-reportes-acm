//backend/modelos/LeyNormaModel.js

const { supabase } = require('../config/conexion');

class LeyNormaModel {
  
  // Obtener todas las leyes y normas
static async obtenerTodas() {
  try {
    // Primero obtener las leyes con sus artículos
    const { data, error } = await supabase
      .from('leyes_normas')
      .select(`
        *,
        articulos:leyes_normas_articulos (
          id,
          numero_articulo,
          contenido,
          descripcion_corta,
          created_at
        )
      `)
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error en consulta de leyes:', error);
      throw error;
    }
    
    // Procesar los datos para asegurar que articulos sea un array
    const leyesProcesadas = (data || []).map(ley => ({
      ...ley,
      articulos: ley.articulos || [],
      // Asegurar que articulos sea siempre un array
      cantidad_articulos: ley.articulos ? ley.articulos.length : 0
    }));
    
    return leyesProcesadas;
  } catch (error) {
    console.error('Error en LeyNormaModel.obtenerTodas:', error);
    throw error;
  }
}
// Contar artículos por ley
static async contarArticulosPorLey(leyId) {
  try {
    const { data, error, count } = await supabase
      .from('leyes_normas_articulos')
      .select('id', { count: 'exact', head: false })
      .eq('ley_norma_id', leyId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error contando artículos:', error);
    return 0;
  }
}

// Obtener todas las leyes con conteo de artículos (versión optimizada)
static async obtenerTodasConConteo() {
  try {
    // Obtener leyes
    const { data: leyes, error } = await supabase
      .from('leyes_normas')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Obtener conteos de artículos en paralelo
    const leyesConConteo = await Promise.all(
      (leyes || []).map(async (ley) => {
        const conteo = await this.contarArticulosPorLey(ley.id);
        return {
          ...ley,
          cantidad_articulos: conteo
        };
      })
    );

    return leyesConConteo;
  } catch (error) {
    console.error('Error en LeyNormaModel.obtenerTodasConConteo:', error);
    throw error;
  }
}
  // Obtener por categoría
  static async obtenerPorCategoria(categoria) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas')
        .select('*')
        .eq('categoria', categoria)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en LeyNormaModel.obtenerPorCategoria:', error);
      throw error;
    }
  }

  // Obtener por ID
  static async obtenerPorId(id) {
  try {
    // Validar si es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      console.warn(`ID no es un UUID válido: ${id}`);
      return null;
    }

    const { data, error } = await supabase
      .from('leyes_normas')
      .select(`
        *,
        articulos:leyes_normas_articulos (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error en LeyNormaModel.obtenerPorId:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en LeyNormaModel.obtenerPorId:', error);
    // No lanzar el error para evitar cascada
    return null;
  }
}
  // Buscar leyes/normas
  static async buscar(termino) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas')
        .select(`
          *,
          articulos:leyes_normas_articulos (*)
        `)
        .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
        .order('categoria', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en LeyNormaModel.buscar:', error);
      throw error;
    }
  }

  // Obtener categorías
  // Obtener categorías
static async obtenerCategorias() {
  try {
    const { data, error } = await supabase
      .from('leyes_normas')
      .select('categoria')
      .order('categoria', { ascending: true });

    if (error) {
      console.error('Error en Supabase obtenerCategorias:', error);
      return []; // Retornar array vacío en caso de error
    }
    
    // Obtener categorías únicas
    if (!data || data.length === 0) {
      return [];
    }
    
    const categorias = [...new Set(data.map(item => item.categoria).filter(Boolean))];
    return categorias;
  } catch (error) {
    console.error('Error en LeyNormaModel.obtenerCategorias:', error);
    return []; // Siempre retornar array vacío en caso de error
  }
}

  // Obtener artículos por ley
  static async obtenerArticulos(leyId) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas_articulos')
        .select('*')
        .eq('ley_norma_id', leyId)
        .order('numero_articulo', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en LeyNormaModel.obtenerArticulos:', error);
      throw error;
    }
  }

  // Crear nueva ley/norma (admin)
  static async crear(leyData) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas')
        .insert([{
          ...leyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en LeyNormaModel.crear:', error);
      throw error;
    }
  }

  // Actualizar ley/norma (admin)
  static async actualizar(id, updates) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas')
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
      console.error('Error en LeyNormaModel.actualizar:', error);
      throw error;
    }
  }

  // Eliminar ley/norma (admin)
  static async eliminar(id) {
    try {
      // Primero eliminar artículos relacionados
      await supabase
        .from('leyes_normas_articulos')
        .delete()
        .eq('ley_norma_id', id);

      // Luego eliminar la ley/norma
      const { error } = await supabase
        .from('leyes_normas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Ley/norma eliminada' };
    } catch (error) {
      console.error('Error en LeyNormaModel.eliminar:', error);
      throw error;
    }
  }

  // Agregar artículo (admin)
  static async agregarArticulo(leyId, articuloData) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas_articulos')
        .insert([{
          ley_norma_id: leyId,
          ...articuloData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en LeyNormaModel.agregarArticulo:', error);
      throw error;
    }
  }

  // Actualizar artículo (admin)
  static async actualizarArticulo(id, updates) {
    try {
      const { data, error } = await supabase
        .from('leyes_normas_articulos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en LeyNormaModel.actualizarArticulo:', error);
      throw error;
    }
  }

  // Eliminar artículo (admin)
  static async eliminarArticulo(id) {
    try {
      const { error } = await supabase
        .from('leyes_normas_articulos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Artículo eliminado' };
    } catch (error) {
      console.error('Error en LeyNormaModel.eliminarArticulo:', error);
      throw error;
    }
  }

  // Obtener leyes/normas aplicables a un reporte
  static async obtenerParaReporte(reporteId) {
    try {
      const { data, error } = await supabase
        .from('reportes_leyes_normas')
        .select(`
          *,
          ley_norma:leyes_normas (*),
          articulo:leyes_normas_articulos (*)
        `)
        .eq('reporte_id', reporteId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en LeyNormaModel.obtenerParaReporte:', error);
      throw error;
    }
  }

  // Asociar ley/norma a reporte
  static async asociarAReporte(reporteId, leyNormaId, articuloId = null) {
    try {
      const { data, error } = await supabase
        .from('reportes_leyes_normas')
        .insert([{
          reporte_id: reporteId,
          ley_norma_id: leyNormaId,
          articulo_id: articuloId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en LeyNormaModel.asociarAReporte:', error);
      throw error;
    }
  }

  // Desasociar ley/norma de reporte
  static async desasociarDeReporte(reporteId, leyNormaId, articuloId = null) {
    try {
      let query = supabase
        .from('reportes_leyes_normas')
        .delete()
        .eq('reporte_id', reporteId)
        .eq('ley_norma_id', leyNormaId);

      if (articuloId) {
        query = query.eq('articulo_id', articuloId);
      }

      const { error } = await query;

      if (error) throw error;
      return { success: true, message: 'Ley/norma desasociada' };
    } catch (error) {
      console.error('Error en LeyNormaModel.desasociarDeReporte:', error);
      throw error;
    }
  }
}

module.exports = LeyNormaModel;