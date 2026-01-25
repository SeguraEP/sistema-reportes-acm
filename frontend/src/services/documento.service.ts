//frontend/src/services/documento.service.ts
import api from '@/lib/axios';

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fecha_subida: string;
  tamanio?: number;
  usuario_id?: string;
  reporte_id?: string;
}

export const DocumentoService = {
  // Subir documento
  async subirDocumento(archivo: File, tipo: string, relacionadoId?: string): Promise<Documento> {
    const formData = new FormData();
    formData.append('documento', archivo);
    formData.append('tipo', tipo);
    if (relacionadoId) {
      formData.append('relacionado_id', relacionadoId);
    }

    const response = await api.post('/documentos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Obtener documentos
  async obtenerDocumentos(filtros?: { tipo?: string; usuario_id?: string; reporte_id?: string }): Promise<Documento[]> {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const response = await api.get(`/documentos?${params.toString()}`);
    return response.data.data;
  },

  // Descargar documento
  async descargarDocumento(id: string): Promise<Blob> {
    const response = await api.get(`/documentos/${id}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Eliminar documento
  async eliminarDocumento(id: string): Promise<void> {
    await api.delete(`/documentos/${id}`);
  },

  // Obtener URL pública
  async obtenerUrlPublica(id: string): Promise<string> {
    const response = await api.get(`/documentos/${id}/url-publica`);
    return response.data.data.url;
  }
};