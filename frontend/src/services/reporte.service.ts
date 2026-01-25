// frontend/src/services/reporte.service.ts
import api from '@/lib/axios';

export interface Reporte {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  cedula: string;
  zona: string;
  distrito: string;
  circuito: string;
  direccion: string;
  horario_jornada: string;
  hora_reporte: string;
  fecha: string;
  novedad: string;
  reporta: string;
  coordenadas?: string;
  tipo_reporte: string;
  estado: string;
  url_documento_word?: string;
  created_at: string;
  updated_at: string;
  usuario?: {
    nombre_completo: string;
    cedula: string;
    rol: string;
  };
}

export interface ImagenReporte {
  id: string;
  reporte_id: string;
  url_storage: string;
  nombre_archivo: string;
  orden: number;
  created_at: string;
}

interface LeyNormaSeleccionada {
  ley_id: string;
  ley_nombre: string;
  articulo_id?: string;
  articulo_numero?: string;
}

export interface LeyNormaReporte {
  id: string;
  reporte_id: string;
  ley_norma_id: string;
  articulo_id?: string;
  ley_norma?: {
    id: string;
    nombre: string;
    categoria: string;
    descripcion?: string;
  };
  articulo?: {
    id: string;
    numero_articulo: string;
    contenido: string;
    descripcion_corta?: string;
  };
}

export interface FiltrosReporte {
  fecha_desde?: string;
  fecha_hasta?: string;
  zona?: string;
  distrito?: string;
  circuito?: string;
  usuario_id?: string;
}

export const ReporteService = {
  // Crear nuevo reporte
  async crearReporte(data: FormData): Promise<Reporte> {
    try {
      // Obtener token si existe
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 
        'Content-Type': 'multipart/form-data',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await api.post('/reportes', data, { headers });
      
      if (response.data.success) {
        return response.data.data.reporte;
      } else {
        throw new Error(response.data.message || 'Error al crear reporte');
      }
    } catch (error: any) {
      console.error('Error creando reporte:', error);
      
      // Si es error de autenticación, intentar sin token
      if (error.response?.status === 401) {
        try {
          const response = await api.post('/reportes', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (response.data.success) {
            return response.data.data.reporte;
          }
        } catch (retryError) {
          console.error('Error en reintento sin autenticación:', retryError);
        }
      }
      
      throw error;
    }
  },

  // Obtener mis reportes
  async obtenerMisReportes(): Promise<Reporte[]> {
    const response = await api.get('/reportes/mis-reportes');
    return response.data.data;
  },

  // Buscar reportes
  async buscarReportes(filtros: FiltrosReporte): Promise<Reporte[]> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await api.get(`/reportes/buscar?${params.toString()}`);
    return response.data.data;
  },

  // Obtener reporte por ID
  async obtenerReporte(id: string): Promise<{
    reporte: Reporte;
    imagenes: ImagenReporte[];
    leyes_aplicables: LeyNormaReporte[];
  }> {
    const response = await api.get(`/reportes/${id}`);
    return response.data.data;
  },

  // Actualizar reporte
  async actualizarReporte(id: string, data: FormData): Promise<Reporte> {
    const response = await api.put(`/reportes/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Eliminar reporte (admin)
  async eliminarReporte(id: string): Promise<void> {
    await api.delete(`/reportes/${id}`);
  },

  // Descargar reporte como Word
  async descargarReporteWord(id: string): Promise<Blob> {
    const response = await api.get(`/reportes/${id}/descargar-word`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Descargar reporte como PDF
  async descargarReportePDF(id: string): Promise<Blob> {
    const response = await api.get(`/reportes/${id}/descargar-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Obtener HTML para impresión
  async obtenerHTMLImpresion(id: string): Promise<string> {
    const response = await api.get(`/reportes/${id}/imprimir`);
    return response.data.data.html;
  },

  // Agregar coordenadas
  async agregarCoordenadas(id: string, latitud: number, longitud: number): Promise<Reporte> {
    const response = await api.post(`/reportes/${id}/coordenadas`, {
      latitud,
      longitud
    });
    return response.data.data;
  },

  // Obtener estadísticas
  async obtenerEstadisticas(): Promise<any> {
      try {
    const response = await api.get('/reportes/estadisticas');
    return response.data.data;
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    
    // Devolver estadísticas vacías en caso de error
    return {
      total: 0,
      por_zona: {},
      por_distrito: {},
      por_mes: {},
      completados: 0,
      pendientes: 0,
      revisados: 0,
      archivados: 0
    };
  }
},

  // Obtener reportes por ubicación
  async obtenerReportesPorUbicacion(latitud: number, longitud: number, radioKm: number = 5): Promise<Reporte[]> {
    const params = new URLSearchParams({
      latitud: latitud.toString(),
      longitud: longitud.toString(),
      radio_km: radioKm.toString()
    });
    
    const response = await api.get(`/reportes/ubicacion/cercanos?${params.toString()}`);
    return response.data.data;
  },

  // Obtener zonas de Guayaquil
  async obtenerZonasGuayaquil(): Promise<any> {
    const response = await api.get('/zonas-guayaquil');
    return response.data.data;
  },

  // Funciones públicas (sin autenticación)
  async buscarReportesPublicos(filtros: any): Promise<Reporte[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/reportes/buscar-publico?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error buscando reportes públicos:', error);
      throw error;
    }
  },

  // CORREGIDO: Este método debe devolver el objeto completo del reporte público
  async obtenerReportePublico(id: string): Promise<{
    reporte: Reporte;
    imagenes: ImagenReporte[];
    leyes_aplicables: LeyNormaReporte[];
  }> {
    try {
      const response = await api.get(`/reportes/${id}/publico`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo reporte público:', error);
      throw error;
    }
  },

  async descargarReportePDFPublico(id: string): Promise<Blob> {
    try {
      const response = await api.get(
        `/reportes/${id}/descargar-pdf-publico`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error descargando PDF público:', error);
      throw error;
    }
  },

  async descargarReporteWordPublico(id: string): Promise<Blob> {
    try {
      const response = await api.get(
        `/reportes/${id}/descargar-word-publico`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error descargando Word público:', error);
      throw error;
    }
  },

  async obtenerHTMLImpresionPublico(id: string): Promise<string> {
    try {
      const response = await api.get(`/reportes/${id}/imprimir-publico`);
      return response.data.data.html;
    } catch (error) {
      console.error('Error obteniendo HTML público:', error);
      throw error;
    }
  },

  async obtenerEstadisticasPublicas(): Promise<any> {
    try {
      const response = await api.get('/reportes/estadisticas-publicas');
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas públicas:', error);
      return {
        total: 0,
        por_zona: {},
        completados: 0,
        pendientes: 0,
      };
    }
  },

  async asociarLeyesReportePublico(
    reporteId: string,
    leyes: LeyNormaSeleccionada[]
  ): Promise<void> {
    try {
      await api.post(`/reportes/${reporteId}/leyes-publico`, {
        leyes,
      });
    } catch (error) {
      console.error('Error asociando leyes públicas:', error);
      throw error;
    }
  },

};