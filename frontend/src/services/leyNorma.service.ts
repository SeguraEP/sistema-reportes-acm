//frontend/src/services/leyNorma.service.ts

import api from '@/lib/axios';

export interface LeyNorma {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  articulos?: Articulo[];
}

export interface Articulo {
  id: string;
  ley_norma_id: string;
  numero_articulo: string;
  contenido: string;
  descripcion_corta?: string;
  created_at: string;
}

export const LeyNormaService = {
  // Obtener todas las leyes y normas
  async obtenerLeyesNormas(): Promise<LeyNorma[]> {
    const response = await api.get('/leyes-normas');
    return response.data.data;
  },

  // Obtener leyes/normas por categoría
  async obtenerPorCategoria(categoria: string): Promise<LeyNorma[]> {
    const response = await api.get(`/leyes-normas/categoria/${categoria}`);
    return response.data.data;
  },

  // Obtener ley/norma por ID
  async obtenerPorId(id: string): Promise<LeyNorma> {
    const response = await api.get(`/leyes-normas/${id}`);
    return response.data.data;
  },

  // Buscar leyes/normas
  async buscar(termino: string): Promise<LeyNorma[]> {
    const response = await api.get(`/leyes-normas/buscar?termino=${encodeURIComponent(termino)}`);
    return response.data.data;
  },

  // Obtener categorías
  async obtenerCategorias(): Promise<string[]> {
    const response = await api.get('/leyes-normas/categorias');
    return response.data.data;
  },

  // Obtener artículos de una ley/norma
  async obtenerArticulos(leyId: string): Promise<Articulo[]> {
    const response = await api.get(`/leyes-normas/${leyId}/articulos`);
    return response.data.data;
  },

  // Obtener estructura completa para formulario
 async obtenerEstructuraCompleta(): Promise<{
  estructura_bd: Record<string, any[]>;
  predefinido: Record<string, string[]>;
  usando_bd: boolean;
}> {
  try {
    const response = await api.get('/leyes-normas/estructura-completa');
    
    // Verificar si la respuesta es exitosa
    if (response.data && response.data.success) {
      // Si la BD devuelve datos, usarlos
      if (response.data.data.usando_bd && Object.keys(response.data.data.estructura_bd).length > 0) {
        return {
          estructura_bd: response.data.data.estructura_bd || {},
          predefinido: response.data.data.predefinido || this.getDatosPredefinidos(),
          usando_bd: true
        };
      } else {
        // Si no hay datos de BD, usar predefinidos
        return {
          estructura_bd: {},
          predefinido: response.data.data.predefinido || this.getDatosPredefinidos(),
          usando_bd: false
        };
      }
    } else {
      // Si hay error en la respuesta, usar datos predefinidos
      console.warn('Error en respuesta de estructura completa:', response.data?.message);
      return {
        estructura_bd: {},
        predefinido: this.getDatosPredefinidos(),
        usando_bd: false
      };
    }
  } catch (error: any) {
    console.error('Error obteniendo estructura completa:', error);
    
    // Retornar datos predefinidos en caso de error
    return {
      estructura_bd: {},
      predefinido: this.getDatosPredefinidos(),
      usando_bd: false
    };
  }
},

// Método auxiliar para obtener datos predefinidos
getDatosPredefinidos(): Record<string, string[]> {
  return {
    'Constitución del Ecuador': [
      'Art. 3 - Seguridad y convivencia a través del estado',
      'Art. 10 - Titularidad de derechos',
      'Art. 11 - Derecho de igualdad y no discriminación',
      'Art. 226 - Principio de legalidad y competencias',
      'Art. 264 - Competencias exclusivas de los gobiernos municipales'
    ],
    'COIP - Código Orgánico Integral Penal': [
      'Art. 205 - Ocupación, uso indebido de suelo o tránsito de vía pública',
      'Art. 207 - Invasión de áreas de importancia ecológica o de uso público',
      'Art. 282 - Destrucción de señalización de tránsito',
      'Art. 389 - Comercialización ilícita de productos',
      'Art. 393 - Venta de productos en mal estado',
      'Art. 398 - Contaminación del ambiente'
    ],
    'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana': [
      'Art. 45 - Atribuciones del Control Municipal',
      'Art. 46 - Control del espacio público',
      'Art. 47 - Prevención de infracciones',
      'Art. 48 - Colaboración con autoridades',
      'Art. 52 - Uso progresivo de la fuerza',
      'Art. 163 - Régimen disciplinario'
    ],
    'Ordenanza Municipal de Control y Espacio Público': [
      'Art. 3 - Uso adecuado del espacio público',
      'Art. 5 - Prohibición de venta ambulante no autorizada',
      'Art. 6 - Prohibición de construcciones no autorizadas',
      'Art. 8 - Control de establecimientos comerciales',
      'Art. 9 - Áreas verdes y parques',
      'Art. 12 - Sanciones por ocupación indebida del espacio público',
      'Art. 13 - Mobiliario urbano',
      'Art. 15 - Horarios de funcionamiento de comercios',
      'Art. 16 - Propaganda y publicidad en vía pública',
      'Art. 18 - Requisitos para permisos de funcionamiento',
      'Art. 20 - Permisos para eventos en espacios públicos',
      'Art. 22 - Procedimiento de decomiso'
    ],
    'Ley Orgánica de Transporte Terrestre': [
      'Art. 211 - Estacionamiento en vía pública',
      'Art. 215 - Vehículos abandonados',
      'Art. 140 - Transporte comercial no autorizado',
      'Art. 142 - Zonas de carga y descarga',
      'Art. 385 - Sanciones por mal estacionamiento',
      'Art. 389 - Obstaculización de vía pública'
    ]
  };
},

  // Obtener leyes/normas más utilizadas
  async obtenerMasUtilizadas(limite: number = 10): Promise<any[]> {
    const response = await api.get(`/leyes-normas/mas-utilizadas?limite=${limite}`);
    return response.data.data;
  },

  // Obtener leyes/normas de un reporte
  async obtenerLeyesReporte(reporteId: string): Promise<any[]> {
    const response = await api.get(`/reportes/${reporteId}/leyes-normas`);
    return response.data.data;
  },

  // Asociar ley/norma a reporte
  async asociarLeyReporte(reporteId: string, leyNormaId: string, articuloId?: string): Promise<void> {
    await api.post(`/reportes/${reporteId}/leyes-normas`, {
      ley_norma_id: leyNormaId,
      articulo_id: articuloId
    });
  },

  // Desasociar ley/norma de reporte
  async desasociarLeyReporte(reporteId: string, leyNormaId: string, articuloId?: string): Promise<void> {
    let url = `/reportes/${reporteId}/leyes-normas/${leyNormaId}`;
    if (articuloId) {
      url += `?articulo_id=${articuloId}`;
    }
    await api.delete(url);
  },

  // Crear ley/norma (admin)
  async crearLeyNorma(data: Partial<LeyNorma>): Promise<LeyNorma> {
    try {
      console.log('Creando nueva ley/norma:', data);
      
      const response = await api.post('/leyes-normas', data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear ley/norma');
      }
    } catch (error: any) {
      console.error('Error en crearLeyNorma:', error);
      throw error;
    }
  },

  // Actualizar ley/norma (admin)
  async actualizarLeyNorma(id: string, data: Partial<LeyNorma>): Promise<LeyNorma> {
    const response = await api.put(`/leyes-normas/${id}`, data);
    return response.data.data;
  },

  // Eliminar ley/norma (admin)
  async eliminarLeyNorma(id: string): Promise<void> {
    await api.delete(`/leyes-normas/${id}`);
  },

  // Agregar artículo (admin)
  async agregarArticulo(leyId: string, data: Partial<Articulo>): Promise<Articulo> {
    const response = await api.post(`/leyes-normas/${leyId}/articulos`, data);
    return response.data.data;
  },

  // Actualizar artículo (admin)
  async actualizarArticulo(id: string, data: Partial<Articulo>): Promise<Articulo> {
    const response = await api.put(`/leyes-normas/articulos/${id}`, data);
    return response.data.data;
  },

  // Eliminar artículo (admin)
  async eliminarArticulo(id: string): Promise<void> {
    await api.delete(`/leyes-normas/articulos/${id}`);
  },
};