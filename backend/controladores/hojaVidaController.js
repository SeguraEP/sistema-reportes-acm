//backend/controladores/hojaVidaController.js

const HojaVidaModel = require('../modelos/HojaVidaModel');
const PDFService = require('../servicios/PDFService');
const WordService = require('../servicios/WordService');
const { supabase } = require('../config/conexion');
const limpiarDatosHojaVida = (hojaVidaData) => {
  const limpiarArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).some(val => 
          val !== undefined && val !== null && val !== ''
        );
      }
      return item !== undefined && item !== null && item !== '';
    });
  };

  const limpiarObjeto = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    const resultado = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          const limpiado = limpiarArray(value);
          if (limpiado.length > 0) resultado[key] = limpiado;
        } else if (typeof value === 'object') {
          const limpiado = limpiarObjeto(value);
          if (Object.keys(limpiado).length > 0) resultado[key] = limpiado;
        } else {
          resultado[key] = value;
        }
      }
    }
    return resultado;
  };

  return limpiarObjeto(hojaVidaData);
};

class HojaVidaController {
  
  // Guardar hoja de vida
  static async guardarHojaVida(req, res) {
  try {
    const usuarioId = req.usuario.id;
    let hojaVidaData = req.body;

    console.log('Guardando hoja de vida para usuario:', usuarioId);

    // Limpiar datos: eliminar campos vacíos o nulos
    hojaVidaData = limpiarDatosHojaVida(hojaVidaData);

    // Validar datos mínimos
    if (!hojaVidaData.datos_personales || 
        !hojaVidaData.datos_personales.nombres_completos || 
        !hojaVidaData.datos_personales.cedula) {
      return res.status(400).json({
        success: false,
        message: 'Nombres completos y cédula son requeridos'
      });
    }

    // Asegurar que arrays existan
    hojaVidaData.formacion_academica = hojaVidaData.formacion_academica || [];
    hojaVidaData.experiencia_laboral = hojaVidaData.experiencia_laboral || [];
    hojaVidaData.cursos_capacitaciones = hojaVidaData.cursos_capacitaciones || [];
    hojaVidaData.habilidades = hojaVidaData.habilidades || { tecnicas: [], blandas: [], idiomas: [] };
    hojaVidaData.referencias = hojaVidaData.referencias || [];
    hojaVidaData.informacion_adicional = hojaVidaData.informacion_adicional || {};

    // Guardar hoja de vida
    const hojaVidaGuardada = await HojaVidaModel.guardar(usuarioId, hojaVidaData);

    res.json({
      success: true,
      message: 'Hoja de vida guardada exitosamente',
      data: hojaVidaGuardada
    });

  } catch (error) {
    console.error('Error guardando hoja de vida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar hoja de vida'
    });
  }
}

  // Obtener hoja de vida del usuario actual
static async obtenerMiHojaVida(req, res) {
  try {
    const usuarioId = req.usuario.id;

    console.log('Obteniendo hoja de vida para usuario:', usuarioId);

    // Obtener hoja de vida
    const hojaVida = await HojaVidaModel.obtenerPorUsuario(usuarioId);

    if (hojaVida) {
      // Obtener información actualizada del usuario
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', usuarioId)
        .single();

      // Asegurar que los campos requeridos existan en datos_personales
      if (!hojaVida.datos_personales) {
        hojaVida.datos_personales = {};
      }
      
      hojaVida.datos_personales.nombres_completos = hojaVida.datos_personales.nombres_completos || usuario.nombre_completo || '';
      hojaVida.datos_personales.cedula = hojaVida.datos_personales.cedula || usuario.cedula || '';
      hojaVida.datos_personales.email = hojaVida.datos_personales.email || usuario.email || '';
      hojaVida.datos_personales.telefono = hojaVida.datos_personales.telefono || usuario.telefono || '';

      return res.json({
        success: true,
        data: {
          hoja_vida: hojaVida,
          usuario_info: usuario
        }
      });
    }

    // Si no existe hoja de vida, generar estructura con datos del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', usuarioId)
      .single();

    const estructuraVacia = HojaVidaModel.generarEstructuraEstándar();
    
    if (usuario) {
      estructuraVacia.datos_personales.nombres_completos = usuario.nombre_completo || '';
      estructuraVacia.datos_personales.cedula = usuario.cedula || '';
      estructuraVacia.datos_personales.email = usuario.email || '';
      estructuraVacia.datos_personales.telefono = usuario.telefono || '';
    }

    return res.json({
      success: true,
      data: {
        hoja_vida: null,
        estructura_inicial: estructuraVacia,
        usuario_info: usuario
      }
    });

  } catch (error) {
    console.error('Error obteniendo hoja de vida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hoja de vida'
    });
  }
}

  // Obtener hoja de vida de cualquier usuario (admin)
  static async obtenerHojaVidaUsuario(req, res) {
    try {
      const { usuario_id } = req.params;
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden ver hojas de vida de otros usuarios'
        });
      }

      console.log('Obteniendo hoja de vida para usuario:', usuario_id);

      const hojaVida = await HojaVidaModel.obtenerPorUsuario(usuario_id);

      if (!hojaVida) {
        return res.status(404).json({
          success: false,
          message: 'Hoja de vida no encontrada'
        });
      }

      res.json({
        success: true,
        data: hojaVida
      });

    } catch (error) {
      console.error('Error obteniendo hoja de vida de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener hoja de vida'
      });
    }
  }

  // Descargar hoja de vida como PDF
  static async descargarHojaVidaPDF(req, res) {
  try {
    const { usuario_id } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    // Verificar permisos
    if (usuarioRol !== 'admin' && usuario_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para descargar esta hoja de vida'
      });
    }

    console.log('Descargando hoja de vida PDF para usuario:', usuario_id);

    // Obtener hoja de vida
    const hojaVida = await HojaVidaModel.obtenerPorUsuario(usuario_id);

    if (!hojaVida) {
      return res.status(404).json({
        success: false,
        message: 'Hoja de vida no encontrada'
      });
    }

    // Limpiar datos antes de generar PDF
    const hojaVidaLimpia = limpiarDatosHojaVida(hojaVida);

    // Generar PDF
    const pdfBuffer = await PDFService.generarHojaVidaPDF(hojaVidaLimpia);

    // Configurar headers para descarga
    const nombreArchivo = `hoja-vida-${hojaVidaLimpia.datos_personales?.nombres_completos?.replace(/\s+/g, '-') || 'usuario'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error descargando hoja de vida PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar hoja de vida'
    });
  }
}
  // Descargar hoja de vida como Word
  static async descargarHojaVidaWord(req, res) {
  try {
    const { usuario_id } = req.params;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    // Verificar permisos
    if (usuarioRol !== 'admin' && usuario_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para descargar esta hoja de vida'
      });
    }

    console.log('Descargando hoja de vida Word para usuario:', usuario_id);

    // Obtener hoja de vida
    const hojaVida = await HojaVidaModel.obtenerPorUsuario(usuario_id);

    if (!hojaVida) {
      return res.status(404).json({
        success: false,
        message: 'Hoja de vida no encontrada'
      });
    }

    // Limpiar datos antes de generar Word
    const hojaVidaLimpia = limpiarDatosHojaVida(hojaVida);

    // Generar documento Word
    const wordBuffer = await WordService.generarHojaVidaWord(hojaVidaLimpia);

    // Configurar headers para descarga
    const nombreArchivo = `hoja-vida-${hojaVidaLimpia.datos_personales?.nombres_completos?.replace(/\s+/g, '-') || 'usuario'}-${new Date().toISOString().split('T')[0]}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', wordBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(wordBuffer);

  } catch (error) {
    console.error('Error descargando hoja de vida Word:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar hoja de vida'
    });
  }
}

  // Buscar hojas de vida (admin)
  static async buscarHojasVida(req, res) {
    try {
      const usuarioRol = req.usuario.rol;
      const criterios = req.query;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden buscar hojas de vida'
        });
      }

      const hojasVida = await HojaVidaModel.buscar(criterios);

      res.json({
        success: true,
        data: hojasVida,
        total: hojasVida.length
      });

    } catch (error) {
      console.error('Error buscando hojas de vida:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar hojas de vida'
      });
    }
  }

  // Obtener todas las hojas de vida (admin)
  static async obtenerTodasHojasVida(req, res) {
    try {
      const usuarioRol = req.usuario.rol;

      if (usuarioRol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden ver todas las hojas de vida'
        });
      }

      const hojasVida = await HojaVidaModel.obtenerTodas();

      res.json({
        success: true,
        data: hojasVida,
        total: hojasVida.length
      });

    } catch (error) {
      console.error('Error obteniendo hojas de vida:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener hojas de vida'
      });
    }
  }

  // Eliminar hoja de vida (admin o propio)
  static async eliminarHojaVida(req, res) {
    try {
      const { usuario_id } = req.params;
      const usuarioId = req.usuario.id;
      const usuarioRol = req.usuario.rol;

      // Verificar permisos (admin puede eliminar todas, otros solo la suya)
      if (usuarioRol !== 'admin' && usuario_id !== usuarioId) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para eliminar esta hoja de vida'
        });
      }

      console.log('Eliminando hoja de vida para usuario:', usuario_id);

      await HojaVidaModel.eliminar(usuario_id);

      res.json({
        success: true,
        message: 'Hoja de vida eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando hoja de vida:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar hoja de vida'
      });
    }
  }

  // Generar plantilla de hoja de vida
  static async generarPlantilla(req, res) {
    try {
      const usuarioId = req.usuario.id;

      // Obtener información del usuario
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', usuarioId)
        .single();

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Generar estructura estándar con datos del usuario
      const plantilla = HojaVidaModel.generarEstructuraEstándar();

      // Completar con datos del usuario
      plantilla.datos_personales.nombres_completos = usuario.nombre_completo || '';
      plantilla.datos_personales.cedula = usuario.cedula || '';
      plantilla.datos_personales.email = usuario.email || '';
      plantilla.datos_personales.telefono = usuario.telefono || '';

      // Agregar experiencia en ACM
      if (usuario.fecha_ingreso) {
        plantilla.experiencia_laboral[0].fecha_inicio = usuario.fecha_ingreso;
        plantilla.experiencia_laboral[0].fecha_fin = 'Actualidad';
        plantilla.experiencia_laboral[0].cargo = usuario.cargo || 'Agente de Control Municipal';
        plantilla.experiencia_laboral[0].funciones = [
          'Control y vigilancia del espacio público',
          'Elaboración de reportes de novedades',
          'Aplicación de normas y ordenanzas municipales',
          'Colaboración con autoridades competentes'
        ];
      }

      // Agregar formación universitaria si existe
      if (usuario.anio_graduacion) {
        const formacionUniv = plantilla.formacion_academica.find(f => f.nivel === 'Universitaria');
        if (formacionUniv) {
          formacionUniv.anio_fin = usuario.anio_graduacion;
          formacionUniv.anio_graduacion = usuario.anio_graduacion;
          formacionUniv.finalizado = true;
        }
      }

      // Agregar cursos típicos de ACM
      plantilla.cursos_capacitaciones = [
        {
          nombre: 'Curso de Control Municipal',
          institucion: 'Municipio de Guayaquil',
          duracion: '40 horas',
          año: new Date().getFullYear().toString()
        },
        {
          nombre: 'Manejo de Conflictos',
          institucion: 'Escuela de Formación ACM',
          duracion: '20 horas',
          año: (new Date().getFullYear() - 1).toString()
        }
      ];

      // Agregar habilidades típicas
      plantilla.habilidades = {
        tecnicas: [
          'Conocimiento de leyes y ordenanzas municipales',
          'Elaboración de reportes técnicos',
          'Manejo de sistemas informáticos',
          'Primeros auxilios básicos'
        ],
        blandas: [
          'Comunicación efectiva',
          'Trabajo en equipo',
          'Resolución de conflictos',
          'Responsabilidad y disciplina'
        ],
        idiomas: [
          { idioma: 'Español', nivel: 'Nativo' },
          { idioma: 'Inglés', nivel: 'Básico' }
        ]
      };

      res.json({
        success: true,
        data: plantilla
      });

    } catch (error) {
      console.error('Error generando plantilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar plantilla'
      });
    }
  }

  // Exportar hoja de vida en múltiples formatos
  static async exportarHojaVida(req, res) {
  try {
    const { usuario_id } = req.params;
    const { formatos = ['pdf', 'word'] } = req.body;
    const usuarioId = req.usuario.id;
    const usuarioRol = req.usuario.rol;

    // Verificar permisos
    if (usuarioRol !== 'admin' && usuario_id !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para exportar esta hoja de vida'
      });
    }

    console.log('Exportando hoja de vida para usuario:', usuario_id);

    // Obtener hoja de vida
    const hojaVida = await HojaVidaModel.obtenerPorUsuario(usuario_id);

    if (!hojaVida) {
      return res.status(404).json({
        success: false,
        message: 'Hoja de vida no encontrada'
      });
    }

    // Limpiar datos
    const hojaVidaLimpia = limpiarDatosHojaVida(hojaVida);

    // Generar archivos según formatos solicitados
    const archivos = {};

    if (formatos.includes('pdf')) {
      const pdfBuffer = await PDFService.generarHojaVidaPDF(hojaVidaLimpia);
      archivos.pdf = pdfBuffer.toString('base64');
    }

    if (formatos.includes('word')) {
      const wordBuffer = await WordService.generarHojaVidaWord(hojaVidaLimpia);
      archivos.word = wordBuffer.toString('base64');
    }

    if (formatos.includes('json')) {
      archivos.json = JSON.stringify(hojaVidaLimpia, null, 2);
    }

    res.json({
      success: true,
      data: {
        archivos,
        formatos_generados: Object.keys(archivos),
        hoja_vida: {
          usuario: hojaVidaLimpia.datos_personales?.nombres_completos || 'Usuario',
          ultima_actualizacion: hojaVidaLimpia.updated_at || new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error exportando hoja de vida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar hoja de vida'
    });
  }
}
}

module.exports = HojaVidaController;