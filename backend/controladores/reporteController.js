//backend/controladores/reporteController.js

const ReporteModel = require('../modelos/ReporteModel');
const StorageService = require('../servicios/StorageService');
const WordService = require('../servicios/WordService');
const PDFService = require('../servicios/PDFService');
const { supabase } = require('../config/conexion');

class ReporteController {
  
// Crear nuevo reporte
static async crearReporte(req, res) {
  try {
    console.log('Usuario desde middleware:', req.usuario);

    let usuarioId = null;
    let usuarioInfo = {
      nombre_completo: 'Usuario Público',
      cedula: '0000000000',
      rol: 'publico'
    };

    // Usuario autenticado
    if (req.usuario && req.usuario.id) {
      usuarioId = req.usuario.id;
      usuarioInfo = {
        nombre_completo: req.usuario.nombre_completo || 'Usuario Autenticado',
        cedula: req.usuario.cedula || '9999999999',
        rol: req.usuario.rol || 'acm'
      };
      console.log('Usuario autenticado:', usuarioInfo.nombre_completo);
    } else {
      console.log('Usuario no autenticado - usando perfil público');
    }

    const reporteData = req.body;
    const imagenes = req.files || [];

    // Validar campos obligatorios
    const camposObligatorios = [
      'zona',
      'distrito',
      'circuito',
      'direccion',
      'horario_jornada',
      'hora_reporte',
      'fecha',
      'novedad'
    ];

    for (const campo of camposObligatorios) {
      if (!reporteData[campo]) {
        return res.status(400).json({
          success: false,
          message: `El campo ${campo} es obligatorio`
        });
      }
    }

    // Preparar datos del reporte
    const datosCompletos = {
      usuario_id: usuarioId,
      nombre_completo: usuarioInfo.nombre_completo,
      cedula: usuarioInfo.cedula,
      zona: reporteData.zona,
      distrito: reporteData.distrito,
      circuito: reporteData.circuito,
      direccion: reporteData.direccion,
      horario_jornada: reporteData.horario_jornada,
      hora_reporte: reporteData.hora_reporte,
      fecha: reporteData.fecha,
      novedad: reporteData.novedad,
      reporta: reporteData.reporta || usuarioInfo.nombre_completo,
      tipo_reporte: reporteData.tipo_reporte || 'encargado_cuadra',
      estado: 'pendiente'
    };

    // Procesar coordenadas si existen
    if (reporteData.coordenadas) {
      try {
        const [lat, lng] = reporteData.coordenadas.split(',').map(coord => coord.trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          datosCompletos.coordenadas = `POINT(${lng} ${lat})`;
          datosCompletos.tiene_coordenadas = true;
        }
      } catch (error) {
        console.error('Error procesando coordenadas:', error);
      }
    }

    console.log('Datos completos para insertar:', datosCompletos);

    // Parsear leyes_aplicables - IMPORTANTE: para usuarios públicos también
    let leyesAplicables = [];
    if (reporteData.leyes_aplicables) {
      try {
        leyesAplicables = typeof reporteData.leyes_aplicables === 'string'
          ? JSON.parse(reporteData.leyes_aplicables)
          : reporteData.leyes_aplicables;
        console.log('Leyes aplicables recibidas:', leyesAplicables);
      } catch (error) {
        console.error('Error parseando leyes_aplicables:', error);
        leyesAplicables = [];
      }
    }

    // Crear reporte
    const reporteCreado = await ReporteModel.crear(datosCompletos);
    
    if (!reporteCreado || !reporteCreado.id) {
      throw new Error('Error al crear el reporte en la base de datos');
    }

    // Procesar imágenes
    if (imagenes.length > 0) {
      const imagenesProcesadas = [];

      for (const imagen of imagenes) {
        try {
          const rutaStorage = `reportes/${reporteCreado.id}/${Date.now()}-${imagen.originalname}`;
          const urlImagen = await StorageService.subirImagen(
            rutaStorage,
            imagen.buffer
          );

          imagenesProcesadas.push({
            url: urlImagen,
            nombre: imagen.originalname,
            tipo: imagen.mimetype
          });
        } catch (error) {
          console.error('Error subiendo imagen:', error);
        }
      }

      if (imagenesProcesadas.length > 0) {
        await ReporteModel.guardarImagenes(
          reporteCreado.id,
          imagenesProcesadas
        );
      }
    }

    // Asociar leyes / normas - PARA USUARIOS NO AUTENTICADOS TAMBIÉN
    if (Array.isArray(leyesAplicables) && leyesAplicables.length > 0) {
      console.log('Procesando leyes/normas para usuario:', usuarioId ? 'autenticado' : 'público');
      
      for (const leyNorma of leyesAplicables) {
        try {
          // Verificar que la ley existe antes de asociarla
          const { data: leyExistente } = await supabase
            .from('leyes_normas')
            .select('id')
            .eq('id', leyNorma.ley_id)
            .single();

          if (leyExistente) {
            await supabase
              .from('reportes_leyes_normas')
              .insert({
                reporte_id: reporteCreado.id,
                ley_norma_id: leyNorma.ley_id,
                articulo_id: leyNorma.articulo_id || null,
                created_at: new Date().toISOString()
              });
            console.log(`Ley asociada: ${leyNorma.ley_id} al reporte ${reporteCreado.id}`);
          } else {
            console.warn(`Ley no encontrada: ${leyNorma.ley_id}`);
          }
        } catch (error) {
          console.error('Error asociando ley/norma:', error);
        }
      }
    }

    // Generar documento Word (incluyendo leyes para usuarios públicos)
 
      setTimeout(async () => {
  try {
    const { data: leyesAsociadas } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', reporteCreado.id);

    // ===== WORD =====
    const documentoWord = await WordService.generarReporteWord(
      reporteCreado,
      [],
      leyesAsociadas || []
    );

    const rutaWord = `documentos/reportes/${reporteCreado.id}/reporte-${reporteCreado.id}.docx`;
    const urlWord = await StorageService.subirDocumento(rutaWord, documentoWord);

    // ===== PDF =====
    const documentoPDF = await PDFService.generarReportePDF(
      reporteCreado,
      [],
      leyesAsociadas || []
    );

    const rutaPDF = `documentos/reportes/${reporteCreado.id}/reporte-${reporteCreado.id}.pdf`;
    const urlPDF = await StorageService.subirDocumento(rutaPDF, documentoPDF);

    // ===== ACTUALIZAR REPORTE =====
    await ReporteModel.actualizar(reporteCreado.id, {
      url_documento_word: urlWord,
      url_documento_pdf: urlPDF,
      estado: 'completado'
    });

    console.log('Word y PDF generados correctamente');
  } catch (error) {
    console.error('Error generando documentos:', error);
  }
}, 1000);


    console.log('Reporte creado exitosamente:', reporteCreado.id);

    return res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente',
      data: {
        reporte: reporteCreado,
        imagenes: imagenes.length,
        leyes_aplicables: leyesAplicables.length,
        usuario_autenticado: !!usuarioId
      }
    });

  } catch (error) {
    console.error('Error creando reporte:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear reporte',
      error: error.message,
      details: error.details || 'No hay detalles adicionales'
    });
  }
}
  // Obtener reporte por ID
  static async obtenerReporte(req, res) {
  try {
    const { id } = req.params;
    
    // Obtener información del usuario si existe
    let usuarioId = null;
    let usuarioRol = 'publico';
    
    if (req.usuario && req.usuario.id) {
      usuarioId = req.usuario.id;
      usuarioRol = req.usuario.rol || 'publico';
    }

    console.log('Obteniendo reporte:', id, 'Usuario:', usuarioId);

    const reporte = await ReporteModel.obtenerPorId(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Verificar permisos (admin puede ver todos, otros solo sus propios o si es público)
    if (usuarioRol !== 'admin' && reporte.usuario_id !== usuarioId && reporte.usuario_id !== null) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este reporte'
      });
    }

    // Obtener imágenes del reporte
    const imagenes = await ReporteModel.obtenerImagenes(id);

    // Obtener leyes/normas aplicables
    const leyesAplicables = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    res.json({
      success: true,
      data: {
        reporte,
        imagenes: imagenes || [],
        leyes_aplicables: leyesAplicables.data || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte'
    });
  }
}

  // Obtener reportes del usuario
  static async obtenerMisReportes(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Obteniendo reportes para usuario:', usuarioId);

      const reportes = await ReporteModel.obtenerPorUsuario(usuarioId, usuarioRol);

      res.json({
        success: true,
        data: reportes
      });

    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener reportes'
      });
    }
  }

  // Buscar reportes con filtros
  static async buscarReportes(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;
      const filtros = req.query;

      console.log('Buscando reportes con filtros:', filtros);

      const filtrosBusqueda = {
        ...filtros,
        usuario_id: usuarioId,
        rol: usuarioRol
      };

      const reportes = await ReporteModel.buscar(filtrosBusqueda);

      res.json({
        success: true,
        data: reportes,
        total: reportes.length
      });

    } catch (error) {
      console.error('Error buscando reportes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar reportes'
      });
    }
  }

  // Actualizar reporte
  static async actualizarReporte(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;
      const updates = req.body;
      const nuevasImagenes = req.files || [];

      console.log('Actualizando reporte:', id);

      // Obtener reporte actual
      const reporteActual = await ReporteModel.obtenerPorId(id);

      if (!reporteActual) {
        return res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
      }

      // Verificar permisos (solo admin o el creador puede actualizar)
      if (usuarioRol !== 'admin' && reporteActual.usuario_id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para actualizar este reporte'
        });
      }

      // Campos que no se pueden actualizar
      const camposProhibidos = ['id', 'usuario_id', 'created_at'];
      camposProhibidos.forEach(campo => delete updates[campo]);

      // Procesar nuevas imágenes si existen
      if (nuevasImagenes.length > 0) {
        const imagenesProcesadas = [];
        
        for (const imagen of nuevasImagenes) {
          try {
            const rutaStorage = `reportes/${id}/${Date.now()}-${imagen.originalname}`;
            const urlImagen = await StorageService.subirImagen(rutaStorage, imagen.buffer);
            
            imagenesProcesadas.push({
              url: urlImagen,
              nombre: imagen.originalname,
              tipo: imagen.mimetype
            });
          } catch (error) {
            console.error('Error subiendo imagen:', error);
          }
        }

        // Guardar nuevas imágenes
        if (imagenesProcesadas.length > 0) {
          await ReporteModel.guardarImagenes(id, imagenesProcesadas);
        }
      }

      // Actualizar reporte
      const reporteActualizado = await ReporteModel.actualizar(id, updates);

      // Si se actualizó información importante, regenerar documento Word
      const camposImportantes = ['novedad', 'zona', 'distrito', 'circuito', 'direccion'];
      const necesitaRegenerar = camposImportantes.some(campo => updates[campo]);

      if (necesitaRegenerar) {
        const documentoWord = await WordService.generarReporteWord(reporteActualizado);
        const rutaDocumento = `documentos/reportes/${id}/reporte-${id}-actualizado.docx`;
        const urlDocumento = await StorageService.subirDocumento(rutaDocumento, documentoWord);

        await ReporteModel.actualizar(id, {
          url_documento_word: urlDocumento,
          version: (reporteActualizado.version || 0) + 1
        });
      }

      res.json({
        success: true,
        message: 'Reporte actualizado exitosamente',
        data: reporteActualizado
      });

    } catch (error) {
      console.error('Error actualizando reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar reporte'
      });
    }
  }

  // Eliminar reporte (solo admin)
  static async eliminarReporte(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      console.log('Eliminando reporte:', id);

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden eliminar reportes'
        });
      }

      // Obtener reporte para verificar existencia
      const reporte = await ReporteModel.obtenerPorId(id);

      if (!reporte) {
        return res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
      }

      // Eliminar imágenes del storage
      try {
        const imagenes = await ReporteModel.obtenerImagenes(id);
        for (const imagen of imagenes) {
          await StorageService.eliminarArchivo(imagen.url_storage);
        }

        // Eliminar imágenes de la base de datos
        await supabase
          .from('imagenes_reportes')
          .delete()
          .eq('reporte_id', id);
      } catch (error) {
        console.error('Error eliminando imágenes:', error);
        // Continuar aunque falle la eliminación de imágenes
      }

      // Eliminar documento Word del storage si existe
      if (reporte.url_documento_word) {
        try {
          await StorageService.eliminarArchivo(reporte.url_documento_word);
        } catch (error) {
          console.error('Error eliminando documento:', error);
        }
      }

      // Eliminar asociaciones con leyes/normas
      await supabase
        .from('reportes_leyes_normas')
        .delete()
        .eq('reporte_id', id);

      // Eliminar reporte
      await ReporteModel.eliminar(id);

      res.json({
        success: true,
        message: 'Reporte eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar reporte'
      });
    }
  }

  // Descargar reporte como Word
  static async descargarReporteWord(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    console.log('Descargando reporte Word:', id);

    const reporte = await ReporteModel.obtenerPorId(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Verificar permisos
    if (usuarioRol !== 'admin' && reporte.usuario_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para descargar este reporte'
      });
    }

    // Formatear coordenadas si existen
    let coordenadasFormateadas = null;
    
    if (reporte.coordenadas) {
      try {
        // Si es un string que contiene POINT
        if (typeof reporte.coordenadas === 'string') {
          const match = reporte.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            coordenadasFormateadas = `${lat}, ${lng}`;
            // También agregar al objeto reporte para el servicio
            reporte.coordenadas_formateadas = coordenadasFormateadas;
          }
        }
        // Si es un objeto geometry
        else if (reporte.coordenadas.type === 'Point' && reporte.coordenadas.coordinates) {
          const [lng, lat] = reporte.coordenadas.coordinates;
          coordenadasFormateadas = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          reporte.coordenadas_formateadas = coordenadasFormateadas;
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        reporte.coordenadas_formateadas = 'No disponibles';
      }
    }

    // Obtener imágenes del reporte
    const imagenes = await ReporteModel.obtenerImagenes(id);

    // Obtener leyes/normas aplicables
    const { data: leyesAplicables } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    // Generar documento Word con toda la información
    const documentoBuffer = await WordService.generarReporteWord(
      reporte, 
      imagenes || [], 
      leyesAplicables || []
    );

    // Configurar headers para descarga
    const nombreArchivo = `reporte-${id}-${new Date().toISOString().split('T')[0]}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', documentoBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(documentoBuffer);

  } catch (error) {
    console.error('Error descargando reporte Word:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar reporte',
      error: error.message
    });
  }
}
// Descargar reporte como PDF
static async descargarReportePDF(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    console.log('Descargando reporte PDF:', id);

    // Obtener reporte
    const reporte = await ReporteModel.obtenerPorId(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Verificar permisos
    if (usuarioRol !== 'admin' && reporte.usuario_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para descargar este reporte'
      });
    }

    // Formatear coordenadas
    let coordenadasFormateadas = null;
    if (reporte.coordenadas) {
      try {
        if (typeof reporte.coordenadas === 'string') {
          const match = reporte.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            coordenadasFormateadas = `${lat}, ${lng}`;
            reporte.coordenadas_formateadas = coordenadasFormateadas;
          }
        } else if (reporte.coordenadas.type === 'Point' && reporte.coordenadas.coordinates) {
          const [lng, lat] = reporte.coordenadas.coordinates;
          coordenadasFormateadas = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          reporte.coordenadas_formateadas = coordenadasFormateadas;
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        reporte.coordenadas_formateadas = 'No disponibles';
      }
    }

    // Obtener imágenes del reporte
    const imagenes = await ReporteModel.obtenerImagenes(id);
    
    // Asegurar URLs completas
    const imagenesConUrlsCompletas = imagenes.map(img => {
      if (img.url_storage && !img.url_storage.startsWith('http')) {
        const partes = img.url_storage.split('/');
        const nombreArchivo = partes[partes.length - 1];
        const urlCompleta = `https://laxsftiaxgoiglhazyio.supabase.co/storage/v1/object/public/acm-reportes/reportes/${reporte.id}/${nombreArchivo}`;
        return { ...img, url_storage: urlCompleta, url: urlCompleta };
      }
      return img;
    });

    // ================= OBTENER LEYES / NORMAS =================
    const { data: leyesAplicables } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    // ================= GENERAR PDF =================
    const documentoBuffer = await PDFService.generarReportePDF(
      reporte, 
      imagenesConUrlsCompletas || [],
      leyesAplicables || []  // ← PASAR LAS LEYES AQUÍ
    );

    // Configurar headers para descarga
    const nombreArchivo = `reporte-${id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', documentoBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(documentoBuffer);

  } catch (error) {
    console.error('Error descargando reporte PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar reporte',
      error: error.message
    });
  }
}

// Buscar reportes públicos (sin autenticación)
static async buscarReportesPublicos(req, res) {
  try {
    const filtros = req.query;
    console.log('Buscando reportes públicos con filtros:', filtros);

    // Aplicar filtros básicos (sin información sensible)
    let query = supabase
      .from('reportes_acm')
      .select(`
        id,
        zona,
        distrito,
        circuito,
        direccion,
        horario_jornada,
        hora_reporte,
        fecha,
        novedad,
        reporta,
        tipo_reporte,
        estado,
        created_at,
        updated_at
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
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }

    // Paginación
    const limit = parseInt(filtros.limit) || 50;
    const offset = parseInt(filtros.offset) || 0;
    query = query.range(offset, offset + limit - 1);

    // Ordenamiento
    if (filtros.ordenar_por) {
      const ordenDireccion = filtros.orden_direccion || 'desc';
      query = query.order(filtros.ordenar_por, { ascending: ordenDireccion === 'asc' });
    }

    const { data: reportes, error } = await query;

    if (error) throw error;

    // Obtener conteo total para paginación
    const { count } = await supabase
      .from('reportes_acm')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: reportes || [],
      total: count || 0,
      pagina_actual: Math.floor(offset / limit) + 1,
      total_paginas: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Error buscando reportes públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar reportes'
    });
  }
}
// Obtener estadísticas públicas
static async obtenerEstadisticasPublicas(req, res) {
  try {
    console.log('Obteniendo estadísticas públicas');

    // Consulta para estadísticas básicas
    const { data: reportes, error } = await supabase
      .from('reportes_acm')
      .select('zona, estado, created_at');

    if (error) throw error;

    // Procesar estadísticas
    const estadisticas = {
      total: reportes?.length || 0,
      por_zona: {},
      completados: 0,
      pendientes: 0,
      revisados: 0,
      archivados: 0,
      ultima_semana: 0,
      por_mes: {}
    };

    if (reportes) {
      const ahora = new Date();
      const hace7Dias = new Date(ahora);
      hace7Dias.setDate(ahora.getDate() - 7);

      reportes.forEach(reporte => {
        // Estadísticas por zona
        if (reporte.zona) {
          estadisticas.por_zona[reporte.zona] = (estadisticas.por_zona[reporte.zona] || 0) + 1;
        }

        // Estadísticas por estado
        switch (reporte.estado) {
          case 'completado':
            estadisticas.completados++;
            break;
          case 'pendiente':
            estadisticas.pendientes++;
            break;
          case 'revisado':
            estadisticas.revisados++;
            break;
          case 'archivado':
            estadisticas.archivados++;
            break;
        }

        // Reportes de la última semana
        const fechaReporte = new Date(reporte.created_at);
        if (fechaReporte > hace7Dias) {
          estadisticas.ultima_semana++;
        }

        // Estadísticas por mes
        const mesAnio = fechaReporte.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        estadisticas.por_mes[mesAnio] = (estadisticas.por_mes[mesAnio] || 0) + 1;
      });
    }

    // Obtener reportes más recientes (últimos 5)
    const { data: recientes } = await supabase
      .from('reportes_acm')
      .select('id, zona, distrito, fecha, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    estadisticas.recientes = recientes || [];

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      data: {
        total: 0,
        por_zona: {},
        completados: 0,
        pendientes: 0,
        revisados: 0,
        archivados: 0,
        ultima_semana: 0,
        recientes: []
      }
    });
  }
}
// Obtener reporte público por ID
static async obtenerReportePublico(req, res) {
  try {
    const { id } = req.params;
    console.log('Obteniendo reporte público:', id);

    // Obtener reporte con información básica
    const { data: reporte, error } = await supabase
      .from('reportes_acm')
      .select(`
        id,
        zona,
        distrito,
        circuito,
        direccion,
        horario_jornada,
        hora_reporte,
        fecha,
        novedad,
        reporta,
        tipo_reporte,
        estado,
        coordenadas,
        created_at,
        updated_at,
        usuario:usuario_id (
          nombre_completo,
          cedula,
          rol
        )
      `)
      .eq('id', id)
      .single();

    if (error || !reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Obtener imágenes del reporte
    const { data: imagenes } = await supabase
      .from('imagenes_reportes')
      .select('*')
      .eq('reporte_id', id)
      .order('orden', { ascending: true });

    // Obtener leyes/normas aplicables
    const { data: leyesAplicables } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        id,
        ley_norma:leyes_normas (
          id,
          nombre,
          categoria,
          descripcion
        ),
        articulo:leyes_normas_articulos (
          id,
          numero_articulo,
          contenido,
          descripcion_corta
        )
      `)
      .eq('reporte_id', id);

    res.json({
      success: true,
      data: {
        reporte,
        imagenes: imagenes || [],
        leyes_aplicables: leyesAplicables || []
      }
    });

  } catch (error) {
    console.error('Error obteniendo reporte público:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte'
    });
  }
}
// Descargar reporte público como PDF
static async descargarReportePDFPublico(req, res) {
  try {
    const { id } = req.params;
    console.log('Descargando reporte PDF público:', id);

    // Verificar que el reporte existe
    const { data: reporte, error } = await supabase
      .from('reportes_acm')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Formatear coordenadas si existen
    if (reporte.coordenadas) {
      try {
        if (typeof reporte.coordenadas === 'string') {
          const match = reporte.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            reporte.coordenadas_formateadas = `${lat}, ${lng}`;
          }
        } else if (reporte.coordenadas.type === 'Point' && reporte.coordenadas.coordinates) {
          const [lng, lat] = reporte.coordenadas.coordinates;
          reporte.coordenadas_formateadas = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        reporte.coordenadas_formateadas = 'No disponibles';
      }
    }

    // Obtener imágenes del reporte
    const { data: imagenes } = await supabase
      .from('imagenes_reportes')
      .select('*')
      .eq('reporte_id', id)
      .order('orden', { ascending: true });

    // Asegurar URLs completas
    const imagenesConUrlsCompletas = (imagenes || []).map(img => {
      if (img.url_storage && !img.url_storage.startsWith('http')) {
        const partes = img.url_storage.split('/');
        const nombreArchivo = partes[partes.length - 1];
        const urlCompleta = `https://laxsftiaxgoiglhazyio.supabase.co/storage/v1/object/public/acm-reportes/reportes/${id}/${nombreArchivo}`;
        return { ...img, url_storage: urlCompleta, url: urlCompleta };
      }
      return img;
    });

    // ================= OBTENER LEYES / NORMAS =================
    const { data: leyesAplicables } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    // ================= GENERAR PDF =================
    const documentoBuffer = await PDFService.generarReportePDF(
      reporte, 
      imagenesConUrlsCompletas || [],
      leyesAplicables || []  // ← PASAR LEYES/NORMAS AQUÍ
    );

    // Configurar headers para descarga
    const nombreArchivo = `reporte-${id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', documentoBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(documentoBuffer);

  } catch (error) {
    console.error('Error descargando reporte PDF público:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar reporte',
      error: error.message
    });
  }
}


static async descargarReporteWordPublico(req, res) {
  try {
    const { id } = req.params;
    console.log('Descargando reporte Word público:', id);

    const reporte = await ReporteModel.obtenerPorId(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Formatear coordenadas si existen
    if (reporte.coordenadas) {
      try {
        if (typeof reporte.coordenadas === 'string') {
          const match = reporte.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            reporte.coordenadas_formateadas = `${lat}, ${lng}`;
          }
        } else if (reporte.coordenadas.type === 'Point' && reporte.coordenadas.coordinates) {
          const [lng, lat] = reporte.coordenadas.coordinates;
          reporte.coordenadas_formateadas = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        reporte.coordenadas_formateadas = 'No disponibles';
      }
    }

    // Obtener imágenes del reporte
    const imagenes = await ReporteModel.obtenerImagenes(id);

    // Obtener leyes/normas aplicables
    const { data: leyesAplicables } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    // Generar documento Word
    const documentoBuffer = await WordService.generarReporteWord(
      reporte, 
      imagenes || [], 
      leyesAplicables || []
    );

    // Configurar headers para descarga
    const nombreArchivo = `reporte-${id}-${new Date().toISOString().split('T')[0]}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', documentoBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(documentoBuffer);

  } catch (error) {
    console.error('Error descargando reporte Word público:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar reporte',
      error: error.message
    });
  }
}
// Imprimir reporte (generar versión para impresión pública)
static async imprimirReportePublico(req, res) {
  try {
    const { id } = req.params;
    console.log('Generando versión para impresión pública del reporte:', id);

    const reporte = await ReporteModel.obtenerPorId(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Generar versión HTML para impresión
    const htmlImpresion = await PDFService.generarHTMLImpresion(reporte);

    res.json({
      success: true,
      data: {
        html: htmlImpresion,
        reporte: reporte
      }
    });

  } catch (error) {
    console.error('Error generando versión para impresión pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar versión para impresión'
    });
  }
}
// Asociar leyes/normas a reporte (público - solo lectura)
static async asociarLeyesReportePublico(req, res) {
  try {
    const { id } = req.params;
    const { leyes } = req.body;

    console.log('Asociando leyes a reporte público:', id);

    // Verificar que el reporte existe
    const { data: reporte, error } = await supabase
      .from('reportes_acm')
      .select('id')
      .eq('id', id)
      .single();

    if (error || !reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // En versión pública, solo permitir ver las leyes ya asociadas
    // No permitir modificar (solo lectura)
    const { data: leyesAsociadas } = await supabase
      .from('reportes_leyes_normas')
      .select(`
        *,
        ley_norma:leyes_normas (*),
        articulo:leyes_normas_articulos (*)
      `)
      .eq('reporte_id', id);

    res.json({
      success: true,
      message: 'Leyes obtenidas (modo lectura pública)',
      data: leyesAsociadas || []
    });

  } catch (error) {
    console.error('Error asociando leyes a reporte público:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener leyes del reporte'
    });
  }
}
  // Obtener estadísticas de reportes
  static async obtenerEstadisticas(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    console.log('Obteniendo estadísticas para usuario:', usuarioId);

    // Obtener estadísticas con manejo de errores
    let estadisticas;
    try {
      estadisticas = await ReporteModel.obtenerEstadisticas(usuarioId, usuarioRol);
    } catch (error) {
      console.error('Error al obtener estadísticas del modelo:', error);
      estadisticas = {
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

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      data: {
        total: 0,
        por_zona: {},
        por_distrito: {},
        por_mes: {},
        completados: 0,
        pendientes: 0,
        revisados: 0,
        archivados: 0
      }
    });
  }
}
  // Obtener zonas de Guayaquil
  static async obtenerZonasGuayaquil(req, res) {
    try {
      const zonasGuayaquil = {
        'Norte': {
          distritos: ['Tarqui', 'Ximena', 'Febres Cordero'],
          circuitos: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8']
        },
        'Sur': {
          distritos: ['Urdaneta', 'Letamendi', 'García Moreno'],
          circuitos: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
        },
        'Centro': {
          distritos: ['Rocafuerte', 'Bolívar', 'Sucre', '9 de Octubre'],
          circuitos: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
        },
        'Oeste': {
          distritos: ['Ayacucho', 'Olmedo', 'Roca'],
          circuitos: ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8']
        },
        'Este': {
          distritos: ['Carbo', 'Chongón'],
          circuitos: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']
        }
      };

      res.json({
        success: true,
        data: zonasGuayaquil
      });

    } catch (error) {
      console.error('Error obteniendo zonas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener zonas'
      });
    }
  }

  // Agregar coordenadas a reporte
  static async agregarCoordenadas(req, res) {
    try {
      const { id } = req.params;
      const { latitud, longitud } = req.body;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Agregando coordenadas al reporte:', id);

      const reporte = await ReporteModel.obtenerPorId(id);

      if (!reporte) {
        return res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
      }

      // Verificar permisos
      if (usuarioRol !== 'admin' && reporte.usuario_id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para modificar este reporte'
        });
      }

      // Validar coordenadas
      if (!latitud || !longitud) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas fuera de rango válido'
        });
      }

      // Actualizar reporte con coordenadas
      const reporteActualizado = await ReporteModel.actualizar(id, {
        coordenadas: `POINT(${lng} ${lat})`,
        tiene_coordenadas: true
      });

      res.json({
        success: true,
        message: 'Coordenadas agregadas exitosamente',
        data: reporteActualizado
      });

    } catch (error) {
      console.error('Error agregando coordenadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar coordenadas'
      });
    }
  }

  // Obtener reportes por ubicación
  static async obtenerReportesPorUbicacion(req, res) {
    try {
      const { latitud, longitud, radio_km = 5 } = req.query;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Buscando reportes cerca de:', latitud, longitud);

      // Validar coordenadas
      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      const radio = parseFloat(radio_km);

      if (isNaN(lat) || isNaN(lng) || isNaN(radio)) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos'
        });
      }

      // Consulta SQL para buscar reportes por distancia
      // Nota: Esta consulta depende de que PostgreSQL tenga la extensión PostGIS instalada
      const { data: reportes, error } = await supabase
        .from('reportes_acm')
        .select(`
          *,
          usuario:usuario_id (
            nombre_completo,
            cedula
          )
        `)
        .not('coordenadas', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en consulta de ubicación:', error);
        throw error;
      }

      // Filtrar reportes por distancia (simulado si no hay PostGIS)
      const reportesCercanos = reportes.filter(reporte => {
        if (!reporte.coordenadas) return false;
        
        // Parsear coordenadas del reporte
        // Asumiendo formato: "POINT(lng lat)"
        const match = reporte.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (!match) return false;
        
        const reporteLng = parseFloat(match[1]);
        const reporteLat = parseFloat(match[2]);
        
        // Calcular distancia (fórmula Haversine simplificada)
        const distancia = calcularDistancia(lat, lng, reporteLat, reporteLng);
        
        return distancia <= radio;
      });

      res.json({
        success: true,
        data: reportesCercanos,
        total: reportesCercanos.length,
        radio_km: radio
      });

    } catch (error) {
      console.error('Error buscando reportes por ubicación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar reportes por ubicación'
      });
    }
  }

  // Imprimir reporte (generar versión para impresión)
  static async imprimirReporte(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Generando versión para impresión del reporte:', id);

      const reporte = await ReporteModel.obtenerPorId(id);

      if (!reporte) {
        return res.status(404).json({
          success: false,
          message: 'Reporte no encontrado'
        });
      }

      // Verificar permisos
      if (usuarioRol !== 'admin' && reporte.usuario_id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para imprimir este reporte'
        });
      }

      // Generar versión HTML para impresión
      const htmlImpresion = await PDFService.generarHTMLImpresion(reporte);

      res.json({
        success: true,
        data: {
          html: htmlImpresion,
          reporte: reporte
        }
      });

    } catch (error) {
      console.error('Error generando versión para impresión:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar versión para impresión'
      });
    }
  }
}

// Función auxiliar para calcular distancia entre dos puntos
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(value) {
  return value * Math.PI / 180;
}

module.exports = ReporteController;