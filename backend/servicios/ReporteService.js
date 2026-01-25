//backend/servicios/ReporteService.js

const ReporteModel = require('../modelos/ReporteModel');
const StorageService = require('./StorageService');
const WordService = require('./WordService');
const PDFService = require('./PDFService');
const { supabase } = require('../config/conexion');

class ReporteService {
  
  // Procesar creación completa de reporte
  static async procesarCreacionReporte(usuarioId, usuarioInfo, reporteData, imagenes) {
    try {
      console.log('Procesando creación de reporte para usuario:', usuarioId);
      
      // Preparar datos del reporte
      const datosCompletos = {
        usuario_id: usuarioId,
        nombre_completo: usuarioInfo.nombre_completo || '',
        cedula: usuarioInfo.cedula || '',
        zona: reporteData.zona,
        distrito: reporteData.distrito,
        circuito: reporteData.circuito,
        direccion: reporteData.direccion,
        horario_jornada: reporteData.horario_jornada,
        hora_reporte: reporteData.hora_reporte,
        fecha: reporteData.fecha,
        novedad: reporteData.novedad,
        reporta: reporteData.reporta || '',
        coordenadas: reporteData.coordenadas || null,
        tipo_reporte: reporteData.tipo_reporte || 'encargado_cuadra',
        estado: 'pendiente'
      };

      // 1. Crear reporte en la base de datos
      const reporteCreado = await ReporteModel.crear(datosCompletos);
      console.log('Reporte creado en BD:', reporteCreado.id);

      // 2. Procesar imágenes si existen
      let imagenesProcesadas = [];
      if (imagenes && imagenes.length > 0) {
        imagenesProcesadas = await this.procesarImagenes(reporteCreado.id, imagenes);
        await ReporteModel.guardarImagenes(reporteCreado.id, imagenesProcesadas);
        console.log('Imágenes procesadas:', imagenesProcesadas.length);
      }

      // 3. Procesar leyes/normas aplicables
      if (reporteData.leyes_aplicables && Array.isArray(reporteData.leyes_aplicables)) {
        await this.procesarLeyesAplicables(reporteCreado.id, reporteData.leyes_aplicables);
        console.log('Leyes/normas procesadas');
      }

      // 4. Generar y almacenar documento Word
      const documentoWord = await WordService.generarReporteWord({
        ...reporteCreado,
        nombre_completo: usuarioInfo.nombre_completo,
        cedula: usuarioInfo.cedula
      });

      const rutaDocumento = `documentos/reportes/${reporteCreado.id}/reporte-${reporteCreado.id}.docx`;
      const urlDocumento = await StorageService.subirDocumento(rutaDocumento, documentoWord);

      // 5. Actualizar reporte con URL del documento
      const reporteActualizado = await ReporteModel.actualizar(reporteCreado.id, {
        url_documento_word: urlDocumento,
        estado: 'completado'
      });

      console.log('Reporte procesado completamente:', reporteActualizado.id);

      return {
        reporte: reporteActualizado,
        imagenes: imagenesProcesadas.length,
        tieneDocumento: true
      };

    } catch (error) {
      console.error('Error en procesarCreacionReporte:', error);
      throw error;
    }
  }

  // Procesar imágenes de reporte
  static async procesarImagenes(reporteId, imagenes) {
    const imagenesProcesadas = [];
    
    for (const [index, imagen] of imagenes.entries()) {
      try {
        const rutaStorage = `reportes/${reporteId}/${Date.now()}-${index}-${imagen.originalname}`;
        const urlImagen = await StorageService.subirImagen(rutaStorage, imagen.buffer);
        
        imagenesProcesadas.push({
          url: urlImagen,
          nombre: imagen.originalname,
          tipo: imagen.mimetype,
          orden: index + 1
        });
      } catch (error) {
        console.error(`Error procesando imagen ${index}:`, error);
        // Continuar aunque falle una imagen
      }
    }

    return imagenesProcesadas;
  }

  // Procesar leyes/normas aplicables
  static async procesarLeyesAplicables(reporteId, leyesAplicables) {
    for (const leyNorma of leyesAplicables) {
      try {
        await supabase
          .from('reportes_leyes_normas')
          .insert({
            reporte_id: reporteId,
            ley_norma_id: leyNorma.ley_id,
            articulo_id: leyNorma.articulo_id || null,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error asociando ley/norma:', error);
      }
    }
  }

  // Obtener reporte con información completa
  static async obtenerReporteCompleto(id) {
    try {
      const reporte = await ReporteModel.obtenerPorId(id);
      if (!reporte) return null;

      const [imagenes, leyesAplicables] = await Promise.all([
        ReporteModel.obtenerImagenes(id),
        this.obtenerLeyesReporte(id)
      ]);

      return {
        reporte,
        imagenes,
        leyes_aplicables: leyesAplicables
      };
    } catch (error) {
      console.error('Error en obtenerReporteCompleto:', error);
      throw error;
    }
  }

  // Obtener leyes/normas de un reporte
  static async obtenerLeyesReporte(reporteId) {
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
      console.error('Error obteniendo leyes de reporte:', error);
      return [];
    }
  }

  // Buscar reportes con filtros avanzados
  static async buscarReportesAvanzados(filtros, usuarioId, usuarioRol) {
    try {
      const filtrosBusqueda = {
        ...filtros,
        usuario_id: usuarioId,
        rol: usuarioRol
      };

      const reportes = await ReporteModel.buscar(filtrosBusqueda);
      
      // Enriquecer con información adicional si hay pocos resultados
      if (reportes.length <= 10) {
        for (const reporte of reportes) {
          try {
            const imagenes = await ReporteModel.obtenerImagenes(reporte.id);
            reporte.total_imagenes = imagenes.length;
            reporte.tiene_imagenes = imagenes.length > 0;
          } catch (error) {
            reporte.total_imagenes = 0;
            reporte.tiene_imagenes = false;
          }
        }
      }

      return reportes;
    } catch (error) {
      console.error('Error en buscarReportesAvanzados:', error);
      throw error;
    }
  }

  // Generar estadísticas detalladas
  static async generarEstadisticasDetalladas(usuarioId, usuarioRol) {
    try {
      const estadisticas = await ReporteModel.obtenerEstadisticas(usuarioId, usuarioRol);
      
      // Calcular promedios y tendencias
      const ahora = new Date();
      const hace30Dias = new Date(ahora.setDate(ahora.getDate() - 30));
      
      const { data: reportesRecientes } = await supabase
        .from('reportes_acm')
        .select('created_at')
        .gte('created_at', hace30Dias.toISOString())
        .order('created_at', { ascending: false });

      // Tendencia diaria (últimos 7 días)
      const tendenciaDiaria = {};
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        return fecha.toISOString().split('T')[0];
      }).reverse();

      ultimos7Dias.forEach(dia => {
        tendenciaDiaria[dia] = 0;
      });

      if (reportesRecientes) {
        reportesRecientes.forEach(reporte => {
          const fecha = new Date(reporte.created_at).toISOString().split('T')[0];
          if (tendenciaDiaria[fecha] !== undefined) {
            tendenciaDiaria[fecha]++;
          }
        });
      }

      return {
        ...estadisticas,
        tendencia_diaria: tendenciaDiaria,
        promedio_diario: (estadisticas.total / 30).toFixed(1),
        actividad_reciente: reportesRecientes?.length || 0
      };
    } catch (error) {
      console.error('Error en generarEstadisticasDetalladas:', error);
      throw error;
    }
  }

  // Exportar reportes en diferentes formatos
  static async exportarReportes(filtros, formato = 'json') {
    try {
      const reportes = await ReporteModel.buscar(filtros);
      
      switch (formato.toLowerCase()) {
        case 'json':
          return JSON.stringify(reportes, null, 2);
          
        case 'csv':
          return this.convertirACSV(reportes);
          
        case 'excel':
          return await this.convertirAExcel(reportes);
          
        default:
          return reportes;
      }
    } catch (error) {
      console.error('Error en exportarReportes:', error);
      throw error;
    }
  }

  // Convertir reportes a CSV
  static convertirACSV(reportes) {
    if (!reportes.length) return '';
    
    const headers = Object.keys(reportes[0]).join(',');
    const rows = reportes.map(reporte => 
      Object.values(reporte)
        .map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        )
        .join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  // Convertir reportes a Excel (simulado)
  static async convertirAExcel(reportes) {
    // En una implementación real usaríamos una librería como 'exceljs'
    // Por ahora retornamos JSON
    return JSON.stringify({
      metadata: {
        formato: 'excel',
        total_registros: reportes.length,
        generado_en: new Date().toISOString()
      },
      data: reportes
    }, null, 2);
  }

  // Validar datos de reporte
  static validarReporteData(reporteData) {
    const errores = [];
    
    const camposRequeridos = [
      'zona', 'distrito', 'circuito', 'direccion',
      'horario_jornada', 'hora_reporte', 'fecha', 'novedad'
    ];

    camposRequeridos.forEach(campo => {
      if (!reporteData[campo]) {
        errores.push(`El campo ${campo} es obligatorio`);
      }
    });

    // Validar fecha
    if (reporteData.fecha) {
      const fecha = new Date(reporteData.fecha);
      if (isNaN(fecha.getTime())) {
        errores.push('Fecha no válida');
      }
    }

    // Validar coordenadas si existen
    if (reporteData.coordenadas) {
      const coords = reporteData.coordenadas.split(',').map(Number);
      if (coords.length !== 2 || coords.some(isNaN)) {
        errores.push('Coordenadas no válidas');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // Obtener resumen de actividades recientes
  static async obtenerResumenActividad(usuarioId, usuarioRol, limite = 10) {
    try {
      const filtros = {
        usuario_id: usuarioRol !== 'admin' ? usuarioId : undefined,
        rol: usuarioRol
      };

      const reportes = await ReporteModel.buscar(filtros);
      const reportesRecientes = reportes.slice(0, limite);

      // Agrupar por fecha
      const actividadesPorFecha = {};
      reportesRecientes.forEach(reporte => {
        const fecha = new Date(reporte.created_at).toLocaleDateString();
        if (!actividadesPorFecha[fecha]) {
          actividadesPorFecha[fecha] = [];
        }
        actividadesPorFecha[fecha].push({
          id: reporte.id,
          zona: reporte.zona,
          distrito: reporte.distrito,
          novedad: reporte.novedad.substring(0, 100) + '...'
        });
      });

      return {
        total_reportes: reportes.length,
        recientes: reportesRecientes.length,
        actividades_por_fecha: actividadesPorFecha,
        ultimo_reporte: reportesRecientes[0] || null
      };
    } catch (error) {
      console.error('Error en obtenerResumenActividad:', error);
      throw error;
    }
  }
}

module.exports = ReporteService;