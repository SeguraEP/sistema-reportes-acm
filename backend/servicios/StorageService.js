//backend/servicios/StorageService.js

const { supabase } = require('../config/conexion');

class StorageService {
  
  // Subir imagen a Supabase Storage
  static async subirImagen(rutaStorage, buffer) {
  try {
    console.log('Subiendo imagen a storage:', rutaStorage);

    const { data, error } = await supabase.storage
      .from('acm-reportes') // Nombre del bucket en Supabase
      .upload(rutaStorage, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }

    // Obtener URL pública CORRECTA
    const { data: urlData } = supabase.storage
      .from('acm-reportes')
      .getPublicUrl(rutaStorage);

    const urlPublica = urlData.publicUrl;
    console.log('Imagen subida exitosamente:', urlPublica);

    // Asegurar que la URL sea completa
    if (!urlPublica.includes('https://')) {
      // Construir URL completa si no lo está
      const urlCompleta = `https://laxsftiaxgoiglhazyio.supabase.co/storage/v1/object/public/acm-reportes/${rutaStorage}`;
      console.log('URL completada:', urlCompleta);
      return urlCompleta;
    }

    return urlPublica;

  } catch (error) {
    console.error('Error en StorageService.subirImagen:', error);
    throw error;
  }
}

  // Subir documento a Supabase Storage
  static async subirDocumento(rutaStorage, buffer) {
    try {
      console.log('Subiendo documento a storage:', rutaStorage);

      const { data, error } = await supabase.storage
        .from('acm-documentos')
        .upload(rutaStorage, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        console.error('Error subiendo documento:', error);
        throw error;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('acm-documentos')
        .getPublicUrl(rutaStorage);

      console.log('Documento subido exitosamente:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error en StorageService.subirDocumento:', error);
      throw error;
    }
  }

  // Eliminar archivo de Supabase Storage
  static async eliminarArchivo(rutaStorage) {
    try {
      console.log('Eliminando archivo de storage:', rutaStorage);

      // Determinar bucket según el tipo de archivo
      let bucket = 'acm-reportes';
      if (rutaStorage.includes('documentos')) {
        bucket = 'acm-documentos';
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([rutaStorage]);

      if (error) {
        console.error('Error eliminando archivo:', error);
        throw error;
      }

      console.log('Archivo eliminado exitosamente:', rutaStorage);
      return data;

    } catch (error) {
      console.error('Error en StorageService.eliminarArchivo:', error);
      throw error;
    }
  }

  // Descargar archivo de Supabase Storage
  static async descargarArchivo(rutaStorage) {
    try {
      console.log('Descargando archivo de storage:', rutaStorage);

      // Determinar bucket según el tipo de archivo
      let bucket = 'acm-reportes';
      if (rutaStorage.includes('documentos')) {
        bucket = 'acm-documentos';
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(rutaStorage);

      if (error) {
        console.error('Error descargando archivo:', error);
        throw error;
      }

      console.log('Archivo descargado exitosamente');
      return data;

    } catch (error) {
      console.error('Error en StorageService.descargarArchivo:', error);
      throw error;
    }
  }

  // Obtener URL pública de archivo
  static async obtenerUrlPublica(rutaStorage) {
    try {
      // Determinar bucket según el tipo de archivo
      let bucket = 'acm-reportes';
      if (rutaStorage.includes('documentos')) {
        bucket = 'acm-documentos';
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(rutaStorage);

      return urlData.publicUrl;

    } catch (error) {
      console.error('Error en StorageService.obtenerUrlPublica:', error);
      throw error;
    }
  }

  // Listar archivos en una carpeta
  static async listarArchivos(carpeta, bucket = 'acm-reportes') {
    try {
      console.log('Listando archivos en carpeta:', carpeta);

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(carpeta);

      if (error) {
        console.error('Error listando archivos:', error);
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error en StorageService.listarArchivos:', error);
      throw error;
    }
  }

  // Verificar si archivo existe
  static async verificarArchivoExiste(rutaStorage, bucket = 'acm-reportes') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          search: rutaStorage
        });

      if (error) {
        console.error('Error verificando archivo:', error);
        return false;
      }

      return data && data.length > 0;

    } catch (error) {
      console.error('Error en StorageService.verificarArchivoExiste:', error);
      return false;
    }
  }

  // Crear carpeta en storage
  static async crearCarpeta(rutaCarpeta, bucket = 'acm-reportes') {
    try {
      console.log('Creando carpeta en storage:', rutaCarpeta);

      // En Supabase Storage, las carpetas se crean automáticamente al subir archivos
      // Para crear una carpeta vacía, subimos un archivo dummy
      const rutaDummy = `${rutaCarpeta}/.keep`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(rutaDummy, Buffer.from(''), {
          contentType: 'text/plain'
        });

      if (error) {
        console.error('Error creando carpeta:', error);
        throw error;
      }

      console.log('Carpeta creada exitosamente:', rutaCarpeta);
      return true;

    } catch (error) {
      console.error('Error en StorageService.crearCarpeta:', error);
      throw error;
    }
  }

  // Obtener estadísticas de storage
  static async obtenerEstadisticas(bucket = 'acm-reportes') {
    try {
      console.log('Obteniendo estadísticas de storage para bucket:', bucket);

      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 1000
        });

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
      }

      const estadisticas = {
        total_archivos: data?.length || 0,
        total_tamanio: 0,
        por_tipo: {}
      };

      if (data) {
        data.forEach(archivo => {
          // Sumar tamaño total
          estadisticas.total_tamanio += archivo.metadata?.size || 0;
          
          // Contar por tipo de archivo
          const tipo = this.obtenerTipoArchivo(archivo.name);
          estadisticas.por_tipo[tipo] = (estadisticas.por_tipo[tipo] || 0) + 1;
        });

        // Convertir tamaño a MB
        estadisticas.total_tamanio_mb = (estadisticas.total_tamanio / (1024 * 1024)).toFixed(2);
      }

      return estadisticas;

    } catch (error) {
      console.error('Error en StorageService.obtenerEstadisticas:', error);
      throw error;
    }
  }

  // Método auxiliar para determinar tipo de archivo
  static obtenerTipoArchivo(nombreArchivo) {
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    
    const tipos = {
      'jpg': 'imagen',
      'jpeg': 'imagen',
      'png': 'imagen',
      'gif': 'imagen',
      'docx': 'documento',
      'pdf': 'documento',
      'txt': 'texto',
      'json': 'datos'
    };

    return tipos[extension] || 'otro';
  }
}

module.exports = StorageService;