//backend/servicios/WordService.js
const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType } = require('docx');
const crypto = require('crypto');

class WordService {
  
  // Generar documento Word para reporte ACM
static async generarReporteWord(reporteData, imagenes = [], leyes = []) {
  try {
    console.log('Generando documento Word para reporte:', reporteData.id);
    console.log('Coordenadas recibidas:', reporteData.coordenadas);

    // Formatear coordenadas si existen
    let coordenadasFormateadas = null;
    
    if (reporteData.coordenadas) {
      try {
        // Si es un string que contiene POINT
        if (typeof reporteData.coordenadas === 'string') {
          const match = reporteData.coordenadas.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            const lng = parseFloat(match[1]).toFixed(6);
            const lat = parseFloat(match[2]).toFixed(6);
            coordenadasFormateadas = `Lat: ${lat}, Lng: ${lng}`;
          } else {
            coordenadasFormateadas = reporteData.coordenadas;
          }
        }
        // Si es un objeto geometry de PostGIS
        else if (reporteData.coordenadas.type === 'Point' && reporteData.coordenadas.coordinates) {
          const [lng, lat] = reporteData.coordenadas.coordinates;
          coordenadasFormateadas = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        }
        // Si es un objeto con propiedades lat/lng
        else if (typeof reporteData.coordenadas === 'object') {
          if (reporteData.coordenadas.lat !== undefined && reporteData.coordenadas.lng !== undefined) {
            coordenadasFormateadas = `Lat: ${reporteData.coordenadas.lat}, Lng: ${reporteData.coordenadas.lng}`;
          }
        }
      } catch (error) {
        console.error('Error formateando coordenadas:', error);
        coordenadasFormateadas = 'Coordenadas no disponibles';
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [

          // ================= ENCABEZADO =================
          new Paragraph({
            children: [
              new TextRun({
                text: 'CUERPO DE AGENTES DE CONTROL MUNICIPAL',
                bold: true,
                size: 28,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'REPORTE DE ENCARGADO DE CUADRA',
                bold: true,
                size: 24,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),

          // ================= DATOS GENERALES =================
          ...[
            ['Zona', reporteData.zona],
            ['Distrito', reporteData.distrito],
            ['Circuito', reporteData.circuito],
            ['Dirección', reporteData.direccion],
            ['Horario', reporteData.horario_jornada],
            ['Hora', reporteData.hora_reporte],
            ['Fecha', reporteData.fecha]
          ].map(([label, value]) =>
            value ? new Paragraph({
              children: [
                new TextRun({
                  text: `${label}: [${value}]`,
                  size: 22,
                  font: 'Arial'
                })
              ],
              spacing: { after: 100 }
            }) : null
          ).filter(Boolean),
          // ================= COORDENADAS =================
          coordenadasFormateadas ? new Paragraph({
            children: [
              new TextRun({
                text: `Coordenadas: ${coordenadasFormateadas}`,
                size: 18,
                font: 'Arial'
              })
            ],
            spacing: { before: 200 }
          }) : null,
          // ================= NOVEDAD =================
          new Paragraph({
            children: [
              new TextRun({
                text: 'Novedad:',
                bold: true,
                size: 22,
                font: 'Arial'
              })
            ],
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: reporteData.novedad || 'No se proporcionó descripción',
                size: 20,
                font: 'Arial'
              })
            ],
            spacing: { after: 200 }
          }),

          // ================= LEYES / NORMAS =================
...(Array.isArray(leyes) && leyes.length > 0 ? [
  new Paragraph({
    children: [
      new TextRun({
        text: 'LEYES Y NORMAS APLICABLES:',
        bold: true,
        size: 22,
        font: 'Arial'
      })
    ],
    spacing: { before: 200, after: 100 }
  }),
  ...leyes.map((ley, idx) =>
    new Paragraph({
      children: [
        new TextRun({
          text: `${idx + 1}. ${ley.ley_norma?.nombre || ley.nombre || 'Ley/Norma'}`,
          size: 20,
          font: 'Arial'
        }),
        ley.articulo ? new TextRun({
          text: ` - Artículo ${ley.articulo.numero_articulo || ley.articulo}: ${ley.articulo.contenido || ley.articulo.descripcion_corta || ''}`,
          size: 18,
          font: 'Arial'
        }) : null
      ].filter(Boolean),
      spacing: { after: 50 }
    })
  )
] : []),

          // ================= IMÁGENES =================
          ...(imagenes.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'IMÁGENES ADJUNTAS:',
                  bold: true,
                  size: 22,
                  font: 'Arial'
                })
              ],
              spacing: { before: 300, after: 100 }
            }),
            ...imagenes.map((img, idx) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${idx + 1}. ${img.nombre || 'Imagen'}: `,
                    bold: true
                  }),
                  new TextRun({
                    text: img.url || img.url_storage,
                    color: '0000FF'
                  })
                ],
                spacing: { after: 50 }
              })
            )
          ] : []),



          // ================= FIRMA =================
          new Paragraph({
            children: [
              new TextRun({
                text: '"Lealtad, Valor y Orden"',
                bold: true,
                size: 22,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: reporteData.nombre_completo || 'No especificado',
                size: 20,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `C.I.: ${reporteData.cedula || 'No especificado'}`,
                size: 18,
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          // ================= METADATA =================
          new Paragraph({
            children: [
              new TextRun({
                text: `ID del Reporte: ${reporteData.id}`,
                size: 14,
                color: '666666'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 300 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generado el: ${new Date().toLocaleString()}`,
                size: 14,
                color: '666666'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ].filter(Boolean)
      }]
    });

    return await Packer.toBuffer(doc);

  } catch (error) {
    console.error('Error generando reporte Word:', error);
    throw error;
  }
}

  // Generar documento Word para hoja de vida (versión optimizada)
  static async generarHojaVidaWord(hojaVidaData) {
    try {
      console.log('Generando documento Word para hoja de vida');

      const usuario = hojaVidaData.usuario || {};
      const datos = hojaVidaData.datos_personales || {};
      const formacion = hojaVidaData.formacion_academica || [];
      const experiencia = hojaVidaData.experiencia_laboral || [];
      const cursos = hojaVidaData.cursos_capacitaciones || [];
      const habilidades = hojaVidaData.habilidades || {};
      const referencias = hojaVidaData.referencias || [];
      const infoAdicional = hojaVidaData.informacion_adicional || {};

      const children = [];

      // Título
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'HOJA DE VIDA',
              bold: true,
              size: 36,
              font: 'Arial'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );

      // Información personal (solo mostrar campos con datos)
      const camposPersonales = [
        { label: 'Nombres Completos', value: datos.nombres_completos || usuario.nombre_completo },
        { label: 'Cédula', value: datos.cedula || usuario.cedula },
        { label: 'Fecha de Nacimiento', value: datos.fecha_nacimiento },
        { label: 'Lugar de Nacimiento', value: datos.lugar_nacimiento },
        { label: 'Email', value: datos.email || usuario.email },
        { label: 'Teléfono', value: datos.telefono || usuario.telefono },
        { label: 'Dirección', value: datos.direccion }
      ].filter(campo => campo.value && campo.value.trim() !== '');

      if (camposPersonales.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'INFORMACIÓN PERSONAL',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { after: 200 }
          })
        );

        // Tabla de información personal solo con campos que tienen datos
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: camposPersonales.map(campo => 
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(`${campo.label}:`)],
                    width: { size: 40, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph(campo.value)],
                    width: { size: 60, type: WidthType.PERCENTAGE }
                  })
                ]
              })
            )
          })
        );
      }

      // Formación académica (solo si hay datos)
      const formacionFiltrada = formacion.filter(item => 
        (item.nivel && item.nivel.trim() !== '') || 
        (item.institucion && item.institucion.trim() !== '') || 
        (item.titulo && item.titulo.trim() !== '')
      );

      if (formacionFiltrada.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'FORMACIÓN ACADÉMICA',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        formacionFiltrada.forEach(item => {
          const contenido = [];
          
          // Agregar nivel e institución si existen
          if (item.nivel && item.institucion) {
            contenido.push(
              new TextRun({
                text: `${item.nivel}: ${item.institucion}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.nivel) {
            contenido.push(
              new TextRun({
                text: `${item.nivel}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.institucion) {
            contenido.push(
              new TextRun({
                text: `${item.institucion}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          }

          // Agregar título si existe
          if (item.titulo) {
            contenido.push(
              new TextRun({
                text: `\nTítulo: ${item.titulo}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar período si existe
          if (item.anio_inicio || item.anio_fin) {
            contenido.push(
              new TextRun({
                text: `\nPeríodo: ${item.anio_inicio || '?'} - ${item.anio_fin || 'Actualidad'}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar año de graduación si existe
          if (item.anio_graduacion) {
            contenido.push(
              new TextRun({
                text: `\nAño de Graduación: ${item.anio_graduacion}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          if (contenido.length > 0) {
            children.push(
              new Paragraph({
                children: contenido,
                spacing: { after: 150 }
              })
            );
          }
        });
      }

      // Experiencia laboral (solo si hay datos)
      const experienciaFiltrada = experiencia.filter(item => 
        (item.empresa && item.empresa.trim() !== '') || 
        (item.cargo && item.cargo.trim() !== '')
      );

      if (experienciaFiltrada.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'EXPERIENCIA LABORAL',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        experienciaFiltrada.forEach(item => {
          const contenido = [];
          
          // Agregar empresa y cargo si existen
          if (item.empresa && item.cargo) {
            contenido.push(
              new TextRun({
                text: `${item.empresa} - ${item.cargo}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.empresa) {
            contenido.push(
              new TextRun({
                text: `${item.empresa}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.cargo) {
            contenido.push(
              new TextRun({
                text: `${item.cargo}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          }

          // Agregar período si existe
          if (item.fecha_inicio || item.fecha_fin) {
            contenido.push(
              new TextRun({
                text: `\nPeríodo: ${item.fecha_inicio || '?'} - ${item.fecha_fin || 'Actualidad'}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar funciones si existen
          if (item.funciones && item.funciones.length > 0 && item.funciones.some(f => f.trim() !== '')) {
            const funcionesFiltradas = item.funciones.filter(f => f && f.trim() !== '');
            if (funcionesFiltradas.length > 0) {
              contenido.push(
                new TextRun({
                  text: `\nFunciones:\n${funcionesFiltradas.map(f => `• ${f}`).join('\n')}`,
                  size: 16,
                  font: 'Arial'
                })
              );
            }
          }

          // Agregar logros si existen
          if (item.logros && item.logros.length > 0 && item.logros.some(l => l.trim() !== '')) {
            const logrosFiltrados = item.logros.filter(l => l && l.trim() !== '');
            if (logrosFiltrados.length > 0) {
              contenido.push(
                new TextRun({
                  text: `\nLogros:\n${logrosFiltrados.map(l => `• ${l}`).join('\n')}`,
                  size: 16,
                  font: 'Arial'
                })
              );
            }
          }

          if (contenido.length > 0) {
            children.push(
              new Paragraph({
                children: contenido,
                spacing: { after: 150 }
              })
            );
          }
        });
      }

      // Cursos y capacitaciones (solo si hay datos)
      const cursosFiltrados = cursos.filter(item => 
        item.nombre && item.nombre.trim() !== ''
      );

      if (cursosFiltrados.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'CURSOS Y CAPACITACIONES',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        cursosFiltrados.forEach(item => {
          const contenido = [];
          
          // Agregar nombre del curso
          contenido.push(
            new TextRun({
              text: item.nombre,
              bold: true,
              size: 20,
              font: 'Arial'
            })
          );

          // Agregar institución si existe
          if (item.institucion) {
            contenido.push(
              new TextRun({
                text: `\nInstitución: ${item.institucion}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar duración si existe
          if (item.duracion) {
            contenido.push(
              new TextRun({
                text: `\nDuración: ${item.duracion}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar año si existe
          if (item.año) {
            contenido.push(
              new TextRun({
                text: `\nAño: ${item.año}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          if (contenido.length > 0) {
            children.push(
              new Paragraph({
                children: contenido,
                spacing: { after: 150 }
              })
            );
          }
        });
      }

      // Habilidades (solo si hay datos)
      const tieneHabilidades = 
        (habilidades.tecnicas && habilidades.tecnicas.length > 0 && habilidades.tecnicas.some(h => h && h.trim() !== '')) ||
        (habilidades.blandas && habilidades.blandas.length > 0 && habilidades.blandas.some(h => h && h.trim() !== '')) ||
        (habilidades.idiomas && habilidades.idiomas.length > 0 && habilidades.idiomas.some(i => i.idioma && i.idioma.trim() !== '' && i.nivel && i.nivel.trim() !== ''));

      if (tieneHabilidades) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'HABILIDADES',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        // Habilidades técnicas
        if (habilidades.tecnicas && habilidades.tecnicas.length > 0) {
          const tecnicasFiltradas = habilidades.tecnicas.filter(h => h && h.trim() !== '');
          if (tecnicasFiltradas.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Habilidades Técnicas:',
                    bold: true,
                    size: 20,
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: `\n${tecnicasFiltradas.map(h => `• ${h}`).join('\n')}`,
                    size: 18,
                    font: 'Arial'
                  })
                ],
                spacing: { after: 150 }
              })
            );
          }
        }

        // Habilidades blandas
        if (habilidades.blandas && habilidades.blandas.length > 0) {
          const blandasFiltradas = habilidades.blandas.filter(h => h && h.trim() !== '');
          if (blandasFiltradas.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Habilidades Blandas:',
                    bold: true,
                    size: 20,
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: `\n${blandasFiltradas.map(h => `• ${h}`).join('\n')}`,
                    size: 18,
                    font: 'Arial'
                  })
                ],
                spacing: { after: 150 }
              })
            );
          }
        }

        // Idiomas
        if (habilidades.idiomas && habilidades.idiomas.length > 0) {
          const idiomasFiltrados = habilidades.idiomas.filter(i => 
            i.idioma && i.idioma.trim() !== '' && 
            i.nivel && i.nivel.trim() !== ''
          );
          if (idiomasFiltrados.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Idiomas:',
                    bold: true,
                    size: 20,
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: `\n${idiomasFiltrados.map(i => `• ${i.idioma}: ${i.nivel}`).join('\n')}`,
                    size: 18,
                    font: 'Arial'
                  })
                ],
                spacing: { after: 150 }
              })
            );
          }
        }
      }

      // Referencias (solo si hay datos)
      const referenciasFiltradas = referencias.filter(item => 
        (item.nombre && item.nombre.trim() !== '') || 
        (item.relacion && item.relacion.trim() !== '')
      );

      if (referenciasFiltradas.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'REFERENCIAS',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        referenciasFiltradas.forEach(item => {
          const contenido = [];
          
          // Agregar nombre y relación si existen
          if (item.nombre && item.relacion) {
            contenido.push(
              new TextRun({
                text: `${item.nombre} - ${item.relacion}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.nombre) {
            contenido.push(
              new TextRun({
                text: `${item.nombre}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          } else if (item.relacion) {
            contenido.push(
              new TextRun({
                text: `${item.relacion}`,
                bold: true,
                size: 20,
                font: 'Arial'
              })
            );
          }

          // Agregar teléfono si existe
          if (item.telefono) {
            contenido.push(
              new TextRun({
                text: `\nTeléfono: ${item.telefono}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          // Agregar email si existe
          if (item.email) {
            contenido.push(
              new TextRun({
                text: `\nEmail: ${item.email}`,
                size: 18,
                font: 'Arial'
              })
            );
          }

          if (contenido.length > 0) {
            children.push(
              new Paragraph({
                children: contenido,
                spacing: { after: 150 }
              })
            );
          }
        });
      }

      // Información adicional (solo si hay datos)
      const tieneInfoAdicional = 
        (infoAdicional.licencia_conducir && infoAdicional.licencia_conducir.trim() !== '') ||
        (infoAdicional.tipo_licencia && infoAdicional.tipo_licencia.trim() !== '') ||
        (infoAdicional.tipo_discapacidad && infoAdicional.tipo_discapacidad.trim() !== '') ||
        infoAdicional.disponibilidad_viajar !== undefined ||
        infoAdicional.discapacidad !== undefined;

      if (tieneInfoAdicional) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'INFORMACIÓN ADICIONAL',
                bold: true,
                size: 24,
                font: 'Arial',
                underline: true
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        if (infoAdicional.licencia_conducir && infoAdicional.licencia_conducir.trim() !== '') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Licencia de Conducir: ${infoAdicional.licencia_conducir}`,
                  size: 18,
                  font: 'Arial'
                })
              ],
              spacing: { after: 100 }
            })
          );
        }

        if (infoAdicional.tipo_licencia && infoAdicional.tipo_licencia.trim() !== '') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tipo de Licencia: ${infoAdicional.tipo_licencia}`,
                  size: 18,
                  font: 'Arial'
                })
              ],
              spacing: { after: 100 }
            })
          );
        }

        if (infoAdicional.disponibilidad_viajar !== undefined) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Disponibilidad para Viajar: ${infoAdicional.disponibilidad_viajar ? 'Sí' : 'No'}`,
                  size: 18,
                  font: 'Arial'
                })
              ],
              spacing: { after: 100 }
            })
          );
        }

        if (infoAdicional.discapacidad !== undefined && infoAdicional.discapacidad) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tiene discapacidad: Sí`,
                  size: 18,
                  font: 'Arial'
                })
              ],
              spacing: { after: 100 }
            })
          );

          if (infoAdicional.tipo_discapacidad && infoAdicional.tipo_discapacidad.trim() !== '') {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Tipo de discapacidad: ${infoAdicional.tipo_discapacidad}`,
                    size: 18,
                    font: 'Arial'
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }
        }
      }

      // Información del sistema
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Documento generado por el Sistema de Reportes ACM - SEGURA EP PRM XVI',
              size: 12,
              color: '666666',
              font: 'Arial'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generado el: ${new Date().toLocaleString()}`,
              size: 12,
              color: '666666',
              font: 'Arial'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        })
      );

      // Crear documento con los children filtrados
      const doc = new Document({
        sections: [{
          properties: {},
          children: children.filter(child => child !== null)
        }]
      });

      return await Packer.toBuffer(doc);

    } catch (error) {
      console.error('Error generando hoja de vida Word:', error);
      throw error;
    }
  }

  // Generar hash para documento
  static generarHashDocumento(buffer, metadatos = {}) {
    try {
      const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
      return crypto.createHash('sha256').update(contenido).digest('hex');
    } catch (error) {
      console.error('Error generando hash del documento:', error);
      throw error;
    }
  }
}

module.exports = WordService;