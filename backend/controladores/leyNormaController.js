//backend/controladores/leyNormaController.js

const LeyNormaModel = require('../modelos/LeyNormaModel');
const { supabase } = require('../config/conexion');

class LeyNormaController {
  
  // Obtener todas las leyes y normas
static async obtenerLeyesNormas(req, res) {
  try {
    console.log('Obteniendo todas las leyes y normas');

    // Usar la nueva función con conteo
    const leyesNormas = await LeyNormaModel.obtenerTodasConConteo();

    res.json({
      success: true,
      data: leyesNormas
    });

  } catch (error) {
    console.error('Error obteniendo leyes y normas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener leyes y normas'
    });
  }
}

  // Obtener leyes/normas por categoría
  static async obtenerPorCategoria(req, res) {
    try {
      const { categoria } = req.params;

      console.log('Obteniendo leyes/normas por categoría:', categoria);

      const leyesNormas = await LeyNormaModel.obtenerPorCategoria(categoria);

      res.json({
        success: true,
        data: leyesNormas
      });

    } catch (error) {
      console.error('Error obteniendo leyes/normas por categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener leyes y normas'
      });
    }
  }

  // Obtener ley/norma por ID
  static async obtenerPorId(req, res) {
  try {
    const { id } = req.params;

    console.log('Obteniendo ley/norma por ID:', id);

    // Validar formato del ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID no válido. Debe ser un UUID.'
      });
    }

    const leyNorma = await LeyNormaModel.obtenerPorId(id);

    if (!leyNorma) {
      return res.status(404).json({
        success: false,
        message: 'Ley/norma no encontrada'
      });
    }

    res.json({
      success: true,
      data: leyNorma
    });

  } catch (error) {
    console.error('Error obteniendo ley/norma por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ley/norma'
    });
  }
}
  // Buscar leyes/normas
  static async buscarLeyesNormas(req, res) {
    try {
      const { termino } = req.query;

      console.log('Buscando leyes/normas con término:', termino);

      if (!termino || termino.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda debe tener al menos 3 caracteres'
        });
      }

      const resultados = await LeyNormaModel.buscar(termino);

      res.json({
        success: true,
        data: resultados,
        total: resultados.length
      });

    } catch (error) {
      console.error('Error buscando leyes/normas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar leyes y normas'
      });
    }
  }

  // Obtener categorías disponibles
static async obtenerCategorias(req, res) {
  try {
    console.log('Obteniendo categorías de leyes/normas');

    // Verificar si hay usuario, pero permitir acceso público
    // Solo log para debugging
    if (req.usuario) {
      console.log('Usuario autenticado:', req.usuario.id);
    } else {
      console.log('Acceso público a categorías');
    }

    const categorias = await LeyNormaModel.obtenerCategorias();

    res.json({
      success: true,
      data: categorias || [] // Asegurar que siempre sea un array
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    
    // En caso de error, devolver array vacío
    res.json({
      success: true,
      data: []
    });
  }
}
// Obtener categorías públicas (sin autenticación)
static async obtenerCategoriasPublico(req, res) {
  try {
    console.log('Obteniendo categorías públicas');

    const categorias = await LeyNormaModel.obtenerCategorias();

    res.json({
      success: true,
      data: categorias || []
    });

  } catch (error) {
    console.error('Error obteniendo categorías públicas:', error);
    res.json({
      success: true,
      data: []
    });
  }
}

  // Obtener artículos de una ley/norma
  static async obtenerArticulos(req, res) {
    try {
      const { ley_id } = req.params;

      console.log('Obteniendo artículos para ley/norma:', ley_id);

      const articulos = await LeyNormaModel.obtenerArticulos(ley_id);

      res.json({
        success: true,
        data: articulos
      });

    } catch (error) {
      console.error('Error obteniendo artículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener artículos'
      });
    }
  }

  // Crear nueva ley/norma (admin)
  static async crearLeyNorma(req, res) {
    try {
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden crear leyes/normas'
        });
      }

      const leyNormaData = req.body;

      console.log('Creando nueva ley/norma:', leyNormaData.nombre);

      // Validar datos obligatorios
      if (!leyNormaData.nombre || !leyNormaData.categoria) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y categoría son obligatorios'
        });
      }

      const nuevaLeyNorma = await LeyNormaModel.crear(leyNormaData);

      res.status(201).json({
        success: true,
        message: 'Ley/norma creada exitosamente',
        data: nuevaLeyNorma
      });

    } catch (error) {
      console.error('Error creando ley/norma:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear ley/norma'
      });
    }
  }

  // Actualizar ley/norma (admin)
  static async actualizarLeyNorma(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;
      const updates = req.body;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden actualizar leyes/normas'
        });
      }

      console.log('Actualizando ley/norma:', id);

      // Campos que no se pueden actualizar
      const camposProhibidos = ['id', 'created_at'];
      camposProhibidos.forEach(campo => delete updates[campo]);

      const leyNormaActualizada = await LeyNormaModel.actualizar(id, updates);

      res.json({
        success: true,
        message: 'Ley/norma actualizada exitosamente',
        data: leyNormaActualizada
      });

    } catch (error) {
      console.error('Error actualizando ley/norma:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar ley/norma'
      });
    }
  }
// Obtener leyes y normas públicas (sin autenticación)
static async obtenerLeyesNormasPublico(req, res) {
   try {
    console.log('Obteniendo leyes y normas públicas completas');
    
    const { data: leyes, error } = await supabase
      .from('leyes_normas')
      .select(`
        *,
        articulos:leyes_normas_articulos (
          id,
          numero_articulo,
          contenido,
          descripcion_corta
        )
      `)
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        leyes: leyes || [],
        total: leyes?.length || 0,
        categorias: [...new Set((leyes || []).map(l => l.categoria))]
      }
    });

  } catch (error) {
    console.error('Error obteniendo leyes públicas completas:', error);
    res.json({
      success: true,
      data: {
        leyes: [],
        total: 0,
        categorias: []
      }
    });
  }
}
  // Eliminar ley/norma (admin)
  static async eliminarLeyNorma(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden eliminar leyes/normas'
        });
      }

      console.log('Eliminando ley/norma:', id);

      await LeyNormaModel.eliminar(id);

      res.json({
        success: true,
        message: 'Ley/norma eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando ley/norma:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar ley/norma'
      });
    }
  }

  // Agregar artículo a ley/norma (admin)
  static async agregarArticulo(req, res) {
    try {
      const { ley_id } = req.params;
      const usuarioRol = req.usuario.rol;
      const articuloData = req.body;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden agregar artículos'
        });
      }

      console.log('Agregando artículo a ley/norma:', ley_id);

      // Validar datos obligatorios
      if (!articuloData.numero_articulo || !articuloData.contenido) {
        return res.status(400).json({
          success: false,
          message: 'Número y contenido del artículo son obligatorios'
        });
      }

      const nuevoArticulo = await LeyNormaModel.agregarArticulo(ley_id, articuloData);

      res.status(201).json({
        success: true,
        message: 'Artículo agregado exitosamente',
        data: nuevoArticulo
      });

    } catch (error) {
      console.error('Error agregando artículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar artículo'
      });
    }
  }

  // Actualizar artículo (admin)
  static async actualizarArticulo(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;
      const updates = req.body;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden actualizar artículos'
        });
      }

      console.log('Actualizando artículo:', id);

      // Campos que no se pueden actualizar
      const camposProhibidos = ['id', 'ley_norma_id', 'created_at'];
      camposProhibidos.forEach(campo => delete updates[campo]);

      const articuloActualizado = await LeyNormaModel.actualizarArticulo(id, updates);

      res.json({
        success: true,
        message: 'Artículo actualizado exitosamente',
        data: articuloActualizado
      });

    } catch (error) {
      console.error('Error actualizando artículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar artículo'
      });
    }
  }

  // Eliminar artículo (admin)
  static async eliminarArticulo(req, res) {
    try {
      const { id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden eliminar artículos'
        });
      }

      console.log('Eliminando artículo:', id);

      await LeyNormaModel.eliminarArticulo(id);

      res.json({
        success: true,
        message: 'Artículo eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando artículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar artículo'
      });
    }
  }

  // Obtener leyes/normas aplicables a un reporte
  static async obtenerLeyesReporte(req, res) {
    try {
      const { reporte_id } = req.params;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Obteniendo leyes/normas para reporte:', reporte_id);

      // Verificar permisos para ver el reporte
      // (Esta verificación se haría mejor obteniendo el reporte primero)
      // Por ahora asumimos que el usuario tiene permisos

      const leyesAplicables = await LeyNormaModel.obtenerParaReporte(reporte_id);

      res.json({
        success: true,
        data: leyesAplicables
      });

    } catch (error) {
      console.error('Error obteniendo leyes de reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener leyes/normas del reporte'
      });
    }
  }

  // Asociar ley/norma a reporte
  static async asociarLeyReporte(req, res) {
    try {
      const { reporte_id } = req.params;
      const { ley_norma_id, articulo_id } = req.body;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Asociando ley/norma a reporte:', { reporte_id, ley_norma_id, articulo_id });

      // Verificar permisos para modificar el reporte
      // (Esta verificación se haría mejor obteniendo el reporte primero)

      const asociacion = await LeyNormaModel.asociarAReporte(reporte_id, ley_norma_id, articulo_id);

      res.json({
        success: true,
        message: 'Ley/norma asociada al reporte exitosamente',
        data: asociacion
      });

    } catch (error) {
      console.error('Error asociando ley/norma a reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asociar ley/norma al reporte'
      });
    }
  }

  // Desasociar ley/norma de reporte
  static async desasociarLeyReporte(req, res) {
    try {
      const { reporte_id, ley_norma_id } = req.params;
      const { articulo_id } = req.query;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      console.log('Desasociando ley/norma de reporte:', { reporte_id, ley_norma_id, articulo_id });

      // Verificar permisos para modificar el reporte

      await LeyNormaModel.desasociarDeReporte(reporte_id, ley_norma_id, articulo_id);

      res.json({
        success: true,
        message: 'Ley/norma desasociada del reporte exitosamente'
      });

    } catch (error) {
      console.error('Error desasociando ley/norma de reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desasociar ley/norma del reporte'
      });
    }
  }

  // Obtener leyes/normas más utilizadas
  static async obtenerMasUtilizadas(req, res) {
    try {
      const { limite = 10 } = req.query;

      console.log('Obteniendo leyes/normas más utilizadas, límite:', limite);

      // Consulta para obtener leyes/normas más utilizadas en reportes
      const { data: leyesUtilizadas, error } = await supabase
        .from('reportes_leyes_normas')
        .select(`
          ley_norma_id,
          leyes_normas!inner (
            nombre,
            categoria
          ),
          count
        `)
        .group('ley_norma_id, leyes_normas.nombre, leyes_normas.categoria')
        .order('count', { ascending: false })
        .limit(limite);

      if (error) throw error;

      res.json({
        success: true,
        data: leyesUtilizadas || []
      });

    } catch (error) {
      console.error('Error obteniendo leyes más utilizadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener leyes más utilizadas'
      });
    }
  }
// Obtener estructura completa de leyes/normas para formulario
static async obtenerEstructuraCompleta(req, res) {
  try {
    console.log('Obteniendo estructura completa de leyes/normas');

    let usandoBD = false;
    let estructuraBD = {};
    
    try {
      // Intentar obtener datos de la base de datos
      const leyesNormas = await LeyNormaModel.obtenerTodas();
      
      if (leyesNormas && Array.isArray(leyesNormas) && leyesNormas.length > 0) {
        usandoBD = true;
        
        // Estructurar por categorías
        leyesNormas.forEach(leyNorma => {
          if (leyNorma && leyNorma.categoria) {
            if (!estructuraBD[leyNorma.categoria]) {
              estructuraBD[leyNorma.categoria] = [];
            }
            
            estructuraBD[leyNorma.categoria].push({
              id: leyNorma.id,
              nombre: leyNorma.nombre,
              descripcion: leyNorma.descripcion || '',
              articulos: leyNorma.articulos || []
            });
          }
        });
      }
    } catch (bdError) {
      console.warn('Error al obtener datos de BD, usando predefinidos:', bdError);
      usandoBD = false;
      estructuraBD = {};
    }

    // Datos predefinidos como respaldo
    const datosPredefinidos = {
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

    res.json({
      success: true,
      data: {
        estructura_bd: estructuraBD,
        predefinido: datosPredefinidos,
        usando_bd: usandoBD
      }
    });

  } catch (error) {
    console.error('Error obteniendo estructura completa:', error);
    
    // Si hay error, retornar solo datos predefinidos
    res.json({
      success: true,
      data: {
        estructura_bd: {},
        predefinido: {
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
        },
        usando_bd: false
      }
    });
  }
}
}

module.exports = LeyNormaController;