//backend/servicios/PDFService.js

const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFService {
    
  // Función auxiliar para formatear coordenadas
  static formatearCoordenadas(coordenadas) {
    if (!coordenadas) return null;
    
    console.log('Tipo de coordenadas:', typeof coordenadas);
    console.log('Coordenadas recibidas:', coordenadas);
    
    try {
      // Si ya está formateado (del controlador)
      if (coordenadas.coordenadas_formateadas) {
        return coordenadas.coordenadas_formateadas;
      }
      
      // Si es string con formato POINT
      if (typeof coordenadas === 'string') {
        const match = coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (match) {
          const lng = parseFloat(match[1]).toFixed(6);
          const lat = parseFloat(match[2]).toFixed(6);
          return `${lat}, ${lng}`;
        }
        return coordenadas;
      }
      
      // Si es un objeto (geometry de PostGIS)
      if (typeof coordenadas === 'object') {
        // Verificar si es un objeto geometry PostGIS
        if (coordenadas.type === 'Point' && Array.isArray(coordenadas.coordinates)) {
          const [lng, lat] = coordenadas.coordinates;
          return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        // Si tiene propiedades lat/lng
        if (coordenadas.lat !== undefined && coordenadas.lng !== undefined) {
          return `${coordenadas.lat}, ${coordenadas.lng}`;
        }
        
        // Si es un objeto con x,y (posiblemente PostGIS)
        if (coordenadas.x !== undefined && coordenadas.y !== undefined) {
          return `${coordenadas.y}, ${coordenadas.x}`;
        }
        
        // Intentar convertir a string y analizar
        const coordsString = String(coordenadas);
        const match = coordsString.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
        if (match) {
          const lng = parseFloat(match[1]).toFixed(6);
          const lat = parseFloat(match[2]).toFixed(6);
          return `${lat}, ${lng}`;
        }
      }
      
      return 'Coordenadas no disponibles';
    } catch (error) {
      console.error('Error en formatearCoordenadas:', error);
      return 'Error al formatear coordenadas';
    }
  }

  // Generar PDF para reporte ACM
static async generarReportePDF(reporteData, imagenes = [], leyes = []) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Generando PDF para reporte:', reporteData.id);
        console.log('Datos del reporte recibidos:', {
          id: reporteData.id,
          tieneCoordenadas: !!reporteData.coordenadas,
          tipoCoordenadas: typeof reporteData.coordenadas
        });

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ================= FUENTE BASE =================
        doc.font('Helvetica');

        // ================= ENCABEZADO =================
        doc.fontSize(20)
          .font('Helvetica-Bold')
          .text('CUERPO DE AGENTES DE CONTROL MUNICIPAL', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(16)
          .text('REPORTE DE ENCARGADO DE CUADRA', { align: 'center' })
          .moveDown(1);

        // ================= INFO REPORTE =================
        doc.fontSize(12)
          .font('Helvetica')
          .text(`Zona: [${reporteData.zona}]`)
          .text(`Distrito: [${reporteData.distrito}]`)
          .text(`Circuito: [${reporteData.circuito}]`)
          .text(`Dirección: [${reporteData.direccion}]`)
          .text(`Horario: [${reporteData.horario_jornada}]`)
          .text(`Hora: [${reporteData.hora_reporte}]`)
          .text(`Fecha: [${reporteData.fecha}]`)
          .moveDown(1);

        // ================= COORDENADAS =================
        const coordenadasTexto = PDFService.formatearCoordenadas(reporteData);
        
        if (coordenadasTexto) {
          doc.font('Helvetica')
            .text(`Coordenadas: ${coordenadasTexto}`)
            .moveDown(1);
        }

        // ================= DESCRIPCIÓN =================
        doc.font('Helvetica-Bold')
          .text(' Descripcion de la novedad:')
          .moveDown(0.5);

        doc.font('Helvetica')
          .text(reporteData.novedad || 'No se proporcionó descripción', {
            width: 500,
            align: 'justify'
          })
          .moveDown(1.5);       

        // ================= REPORTA =================
        doc.font('Helvetica-Bold')
          .text('Reporta:')
          .moveDown(0.5);

        doc.font('Helvetica-Oblique')
          .text(`[ACM ${reporteData.reporta || 'No especificado'}]`)
          .moveDown(1);


// ================= LEYES / NORMAS =================
if (Array.isArray(leyes) && leyes.length > 0) {
  doc.moveDown(1.5);

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('LEYES Y NORMAS APLICABLES:', { underline: true })
    .moveDown(0.8);

  leyes.forEach((ley, index) => {
    const nombreLey =
      ley.ley_norma?.nombre ||
      ley.nombre ||
      ley.ley_nombre ||
      'Ley / Norma';

    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text(`${index + 1}. ${nombreLey}`);

    // Si tiene artículo asociado
    if (ley.articulo || ley.articulo_id || ley.articulo_numero) {
      const articuloNumero =
        ley.articulo?.numero_articulo ||
        ley.articulo_numero ||
        'N/D';

      const articuloContenido =
        ley.articulo?.contenido ||
        ley.articulo?.descripcion_corta ||
        '';

      doc.fontSize(11)
        .font('Helvetica')
        .text(
          `   Artículo ${articuloNumero}: ${articuloContenido}`,
          {
            width: 500,
            align: 'justify'
          }
        );
    }

    doc.moveDown(0.5);
  });
}

                 // ================= IMÁGENES =================
if (Array.isArray(imagenes) && imagenes.length > 0) {
  doc.addPage()
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('IMÁGENES ADJUNTAS:', { underline: true })
    .moveDown(1);

  imagenes.forEach((img, idx) => {
    const nombreArchivo = img.nombre_archivo || img.nombre || 'Imagen';
    const urlImagen = img.url_storage || img.url || 'URL no disponible';
    
    // Asegurar que la URL esté completa
    let urlCompleta = urlImagen;
    if (urlImagen !== 'URL no disponible' && !urlImagen.startsWith('http')) {
      // Si la URL no es completa, construirla
      const reporteId = reporteData.id || '';
      const timestamp = Date.now();
      urlCompleta = `https://laxsftiaxgoiglhazyio.supabase.co/storage/v1/object/public/acm-reportes/reportes/${reporteId}/${timestamp}-${nombreArchivo}`;
    }
    
    doc.fontSize(12)
      .text(`${idx + 1}. ${nombreArchivo}`);
    
    // Dividir URL larga en múltiples líneas si es necesario
doc.font('Helvetica')
  .fillColor('blue')
  .text(urlCompleta, {
    link: urlCompleta,
    underline: true,
    width: 500,
    continued: false
  });

doc.fillColor('black')
  .moveDown(0.5);
    
    doc.fillColor('black')
      .moveDown(0.5);
  });
}

        // ================= FIRMA =================
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('"Lealtad, Valor y Orden"', { align: 'center' })
          .moveDown(2);

        doc.fontSize(12)
          .text('Agente de Control Municipal de Guayaquil', { align: 'center' })
          .moveDown(0.5);

        doc.font('Helvetica')
          .text(reporteData.nombre_completo || 'No especificado', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(11)
          .text(`C.I.: ${reporteData.cedula || 'No especificado'}`, { align: 'center' })
          .moveDown(2);

        // ================= FOOTER =================
        doc.fontSize(10)
          .fillColor('666666')
          .text(`ID del Reporte: ${reporteData.id}`, { align: 'center' })
          .moveDown(0.5)
          .text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' })
          .moveDown(0.5)
          .text('SEGURA EP PRM XVI - Sistema de Reportes ACM', { align: 'center' });

        doc.end();

      } catch (error) {
        console.error('Error generando PDF:', error);
        reject(error);
      }
    });
  }




  // Generar PDF para hoja de vida
  static async generarHojaVidaPDF(hojaVidaData) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Generando PDF para hoja de vida');

      const usuario = hojaVidaData.usuario || {};
      const datos = hojaVidaData.datos_personales || {};
      const formacion = hojaVidaData.formacion_academica || [];
      const experiencia = hojaVidaData.experiencia_laboral || [];
      const cursos = hojaVidaData.cursos_capacitaciones || [];
      const habilidades = hojaVidaData.habilidades || {};
      const referencias = hojaVidaData.referencias || [];
      const infoAdicional = hojaVidaData.informacion_adicional || {};

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      doc.on('error', reject);

      // Título
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('HOJA DE VIDA', { align: 'center' })
         .moveDown(1.5);

      // Información personal
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN PERSONAL')
         .moveDown(0.5);

      // Solo mostrar campos con datos
      const camposPersonales = [
        { label: 'Nombres Completos', value: datos.nombres_completos || usuario.nombre_completo },
        { label: 'Cédula', value: datos.cedula || usuario.cedula },
        { label: 'Fecha de Nacimiento', value: datos.fecha_nacimiento },
        { label: 'Lugar de Nacimiento', value: datos.lugar_nacimiento },
        { label: 'Email', value: datos.email || usuario.email },
        { label: 'Teléfono', value: datos.telefono || usuario.telefono },
        { label: 'Dirección', value: datos.direccion }
      ];

      camposPersonales.forEach(campo => {
        if (campo.value) {
          doc.fontSize(12)
             .font('Helvetica')
             .text(`${campo.label}: ${campo.value}`);
        }
      });
      
      doc.moveDown(1);

      // Formación académica (solo si hay datos)
      if (formacion.length > 0) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('FORMACIÓN ACADÉMICA')
           .moveDown(0.5);

        formacion.forEach(item => {
          // Solo mostrar si hay datos relevantes
          if (item.nivel || item.institucion || item.titulo) {
            const titulo = [];
            if (item.nivel) titulo.push(item.nivel);
            if (item.institucion) titulo.push(item.institucion);
            
            if (titulo.length > 0) {
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .text(titulo.join(' - '))
                 .moveDown(0.2);
            }

            const detalles = [];
            if (item.titulo) detalles.push(`Título: ${item.titulo}`);
            if (item.anio_inicio || item.anio_fin) {
              detalles.push(`Período: ${item.anio_inicio || '?'} - ${item.anio_fin || 'Actualidad'}`);
            }
            if (item.anio_graduacion) detalles.push(`Año de Graduación: ${item.anio_graduacion}`);
            
            if (detalles.length > 0) {
              doc.fontSize(12)
                 .font('Helvetica')
                 .text(detalles.join(' | '))
                 .moveDown(0.5);
            }
          }
        });
      }

      // Experiencia laboral (solo si hay datos)
      if (experiencia.length > 0) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('EXPERIENCIA LABORAL')
           .moveDown(0.5);

        experiencia.forEach(item => {
          // Solo mostrar si hay datos relevantes
          if (item.empresa || item.cargo) {
            const titulo = [];
            if (item.empresa) titulo.push(item.empresa);
            if (item.cargo) titulo.push(`Cargo: ${item.cargo}`);
            
            if (titulo.length > 0) {
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .text(titulo.join(' - '))
                 .moveDown(0.2);
            }

            const detalles = [];
            if (item.fecha_inicio || item.fecha_fin) {
              detalles.push(`Período: ${item.fecha_inicio || '?'} - ${item.fecha_fin || 'Actualidad'}`);
            }
            
            if (detalles.length > 0) {
              doc.fontSize(12)
                 .font('Helvetica')
                 .text(detalles.join(' | '))
                 .moveDown(0.2);
            }

            // Funciones (solo si hay)
            if (item.funciones && item.funciones.length > 0) {
              doc.fontSize(11)
                 .font('Helvetica-Bold')
                 .text('Funciones:')
                 .moveDown(0.2);
              
              item.funciones.forEach(funcion => {
                doc.fontSize(11)
                   .font('Helvetica')
                   .text(`• ${funcion}`, { indent: 20 });
              });
            }
            
            doc.moveDown(0.5);
          }
        });
      }

      // Habilidades (solo si hay datos)
      if ((habilidades.tecnicas && habilidades.tecnicas.length > 0) ||
          (habilidades.blandas && habilidades.blandas.length > 0) ||
          (habilidades.idiomas && habilidades.idiomas.length > 0)) {
        doc.addPage();
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('HABILIDADES')
           .moveDown(0.5);

        if (habilidades.tecnicas && habilidades.tecnicas.length > 0) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Habilidades Técnicas:')
             .moveDown(0.2);

          habilidades.tecnicas.forEach(habilidad => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`• ${habilidad}`, { indent: 20 });
          });
          doc.moveDown(0.5);
        }

        if (habilidades.blandas && habilidades.blandas.length > 0) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Habilidades Blandas:')
             .moveDown(0.2);

          habilidades.blandas.forEach(habilidad => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`• ${habilidad}`, { indent: 20 });
          });
          doc.moveDown(0.5);
        }

        if (habilidades.idiomas && habilidades.idiomas.length > 0) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Idiomas:')
             .moveDown(0.2);

          habilidades.idiomas.forEach(idioma => {
            if (idioma.idioma && idioma.nivel) {
              doc.fontSize(12)
                 .font('Helvetica')
                 .text(`• ${idioma.idioma}: ${idioma.nivel}`, { indent: 20 });
            }
          });
        }
      }

      // Pie de página
      doc.addPage();
      doc.fontSize(10)
         .fillColor('666666')
         .text('Documento generado por el Sistema de Reportes ACM - SEGURA EP PRM XVI', { align: 'center' })
         .moveDown(0.5);

      doc.text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();

    } catch (error) {
      console.error('Error generando PDF de hoja de vida:', error);
      reject(error);
    }
  });
}

  // Generar HTML para impresión
 static async generarHTMLImpresion(reporteData) {
  try {
    console.log('Generando HTML para impresión del reporte:', reporteData.id);

    // Formatear coordenadas
    let coordenadasTexto = null;
    
    if (reporteData.coordenadas) {
      try {
        if (typeof reporteData.coordenadas === 'string') {
          const match = reporteData.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            coordenadasTexto = `${lat}, ${lng}`;
          } else {
            coordenadasTexto = reporteData.coordenadas;
          }
        } else if (reporteData.coordenadas.type === 'Point' && reporteData.coordenadas.coordinates) {
          const [lng, lat] = reporteData.coordenadas.coordinates;
          coordenadasTexto = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        coordenadasTexto = 'No disponibles';
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte ACM - ${reporteData.id}</title>
    <style>
        @media print {
            @page {
                margin: 20mm;
                size: A4;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
                margin: 0;
                padding: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 20mm;
            }
            .header h1 {
                font-size: 16pt;
                font-weight: bold;
                margin: 0;
            }
            .header h2 {
                font-size: 14pt;
                font-weight: bold;
                margin: 5mm 0 0 0;
            }
            .section {
                margin-bottom: 10mm;
            }
            .section-title {
                font-weight: bold;
                font-size: 13pt;
                margin-bottom: 3mm;
                border-bottom: 1px solid #000;
                padding-bottom: 1mm;
            }
            .info-item {
                margin-bottom: 2mm;
            }
            .info-label {
                font-weight: bold;
            }
            .novedad-text {
                text-align: justify;
                line-height: 1.6;
            }
            .firma {
                text-align: center;
                margin-top: 30mm;
            }
            .firma-nombre {
                margin-top: 10mm;
                border-top: 1px solid #000;
                padding-top: 2mm;
                display: inline-block;
                width: 60mm;
            }
            .footer {
                margin-top: 20mm;
                font-size: 10pt;
                color: #666;
                text-align: center;
            }
            .no-print {
                display: none !important;
            }
        }
        @media screen {
            body {
                font-family: Arial, sans-serif;
                max-width: 210mm;
                margin: 0 auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .print-container {
                background: white;
                padding: 20mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .print-actions {
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                background: white;
            }
            button {
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
            }
            button:hover {
                background: #0056b3;
            }
        }
    </style>
</head>
<body>
    <div class="print-actions no-print">
        <button onclick="window.print()">🖨️ Imprimir Reporte</button>
        <button onclick="window.close()">❌ Cerrar</button>
    </div>
    
    <div class="print-container">
        <div class="header">
            <h1>CUERPO DE AGENTES DE CONTROL MUNICIPAL</h1>
            <h2>REPORTE DE ENCARGADO DE CUADRA</h2>
        </div>

        <div class="section">
            <div class="section-title">INFORMACIÓN DEL REPORTE</div>
            <div class="info-item"><span class="info-label">Zona:</span> [${reporteData.zona}]</div>
            <div class="info-item"><span class="info-label">Distrito:</span> [${reporteData.distrito}]</div>
            <div class="info-item"><span class="info-label">Circuito:</span> [${reporteData.circuito}]</div>
            <div class="info-item"><span class="info-label">Dirección:</span> [${reporteData.direccion}]</div>
            <div class="info-item"><span class="info-label">Horario:</span> [${reporteData.horario_jornada}]</div>
            <div class="info-item"><span class="info-label">Hora:</span> [${reporteData.hora_reporte}]</div>
            <div class="info-item"><span class="info-label">Fecha:</span> [${reporteData.fecha}]</div>
        </div>

        <div class="section">
            <div class="section-title">NOVEDAD</div>
            <p class="novedad-text">
                Permiso, Señor Carlos Segovia Álava, Jefe de Control Municipal:<br>
                Muy respetuosamente, me permito informarle que en la presente fecha.
            </p>
        </div>

        <div class="section">
            <div class="section-title">REPORTA</div>
            <p><em>[ACM ${reporteData.reporta || 'No especificado'}]</em></p>
        </div>

        <div class="section">
            <div class="section-title">DESCRIPCIÓN DE LA NOVEDAD</div>
            <p class="novedad-text">${reporteData.novedad || 'No se proporcionó descripción'}</p>
        </div>

        ${coordenadasTexto ? `
        <div class="section">
            <div class="section-title">COORDENADAS</div>
            <p>${coordenadasTexto}</p>
        </div>
        ` : ''}

        <div class="firma">
            <p style="font-weight: bold; font-size: 14pt;">"Lealtad, Valor y Orden"</p>
            
            <div style="margin-top: 30mm;">
                <p style="font-weight: bold;">Agente de Control Municipal de Guayaquil</p>
                <div class="firma-nombre">${reporteData.nombre_completo || 'No especificado'}</div>
                <p>C.I.: ${reporteData.cedula || 'No especificado'}</p>
            </div>
        </div>

        <div class="footer">
            <p>ID del Reporte: ${reporteData.id}</p>
            <p>Generado el: ${new Date().toLocaleString()}</p>
            <p>SEGURA EP PRM XVI - Sistema de Reportes ACM</p>
        </div>
    </div>

    <script>
        // Auto-imprimir al cargar (opcional)
        // window.addEventListener('load', function() {
        //     window.print();
        // });
    </script>
</body>
</html>`;

    return html;

  } catch (error) {
    console.error('Error generando HTML para impresión:', error);
    throw error;
  }
}
}

module.exports = PDFService;