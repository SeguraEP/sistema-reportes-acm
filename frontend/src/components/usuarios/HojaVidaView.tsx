//frontend/src/components/usuarios/HojaVidaView.tsx

'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Language as LanguageIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { HojaVida } from '@/services/usuario.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HojaVidaViewProps {
  hojaVida: HojaVida;
  loading?: boolean;
  error?: string;
  onDownload?: (formato: 'pdf' | 'word') => void;
  onPrint?: () => void;
  onEdit?: () => void;
  allowEdit?: boolean;
  usuarioInfo?: {
    nombre_completo?: string;
    cedula?: string;
    cargo?: string;
    fecha_ingreso?: string;
  };
}

const formatFecha = (fecha: string) => {
  try {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  } catch {
    return fecha;
  }
};

export default function HojaVidaView({
  hojaVida,
  loading = false,
  error,
  onDownload,
  onPrint,
  onEdit,
  allowEdit = true,
  usuarioInfo
}: HojaVidaViewProps) {
  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  const datosPersonales = hojaVida.datos_personales || {};
  const nombreCompleto = datosPersonales.nombres_completos || usuarioInfo?.nombre_completo || 'Usuario';
  const cedula = datosPersonales.cedula || usuarioInfo?.cedula || 'No especificada';

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Hoja de Vida
          </Typography>
          <Typography variant="h6" color="primary">
            {nombreCompleto}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuarioInfo?.cargo || 'Agente de Control Municipal'} | Cédula: {cedula}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onDownload && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onDownload('pdf')}
                size="small"
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onDownload('word')}
                size="small"
              >
                Word
              </Button>
            </>
          )}
          
          {onPrint && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={onPrint}
              size="small"
            >
              Imprimir
            </Button>
          )}
          
          {allowEdit && onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
              size="small"
            >
              Editar
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Información Personal */}
        <Grid size={{ xs:12 }}>

          <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon /> Información Personal
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {datosPersonales.fecha_nacimiento && (
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary">Fecha de Nacimiento</Typography>
                <Typography variant="body1">{formatFecha(datosPersonales.fecha_nacimiento)}</Typography>
              </Grid>
            )}
            {datosPersonales.lugar_nacimiento && (
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary">Lugar de Nacimiento</Typography>
                <Typography variant="body1">{datosPersonales.lugar_nacimiento}</Typography>
              </Grid>
            )}
            {datosPersonales.estado_civil && (
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary">Estado Civil</Typography>
                <Typography variant="body1">{datosPersonales.estado_civil}</Typography>
              </Grid>
            )}
            {datosPersonales.telefono && (
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography variant="body1">
                  <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {datosPersonales.telefono}
                </Typography>
              </Grid>
            )}
            {datosPersonales.email && (
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1">
                  <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {datosPersonales.email}
                </Typography>
              </Grid>
            )}
            {datosPersonales.direccion && (
              <Grid size={{ xs:12 }}>

                <Typography variant="caption" color="text.secondary">Dirección</Typography>
                <Typography variant="body1">{datosPersonales.direccion}</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid size={{ xs:12 }}>

          <Divider />
        </Grid>

        {/* Formación Académica */}
        {hojaVida.formacion_academica && hojaVida.formacion_academica.length > 0 && (
          <>
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon /> Formación Académica
              </Typography>
              <List>
                {hojaVida.formacion_academica.map((formacion, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {formacion.nivel}
                    </Typography>
                    {formacion.institucion && (
                      <Typography variant="body2" color="text.secondary">
                        {formacion.institucion}
                      </Typography>
                    )}
                    {formacion.titulo && (
                      <Typography variant="body2">
                        Título: {formacion.titulo}
                      </Typography>
                    )}
                    {(formacion.anio_inicio || formacion.anio_fin) && (
                      <Typography variant="body2" color="text.secondary">
                        Período: {formacion.anio_inicio || '?'} - {formacion.anio_fin || 'Actualidad'}
                      </Typography>
                    )}
                    {formacion.anio_graduacion && (
                      <Typography variant="body2" color="primary">
                        Graduación: {formacion.anio_graduacion}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs:12 }}>

              <Divider />
            </Grid>
          </>
        )}

        {/* Experiencia Laboral */}
        {hojaVida.experiencia_laboral && hojaVida.experiencia_laboral.length > 0 && (
          <>
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon /> Experiencia Laboral
              </Typography>
              <List>
                {hojaVida.experiencia_laboral.map((exp, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {exp.cargo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exp.empresa}
                    </Typography>
                    {(exp.fecha_inicio || exp.fecha_fin) && (
                      <Typography variant="body2" color="text.secondary">
                        Período: {exp.fecha_inicio || '?'} - {exp.fecha_fin || 'Actualidad'}
                      </Typography>
                    )}
                    {exp.funciones && exp.funciones.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Funciones:</Typography>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {exp.funciones.map((funcion, idx) => (
                            <li key={idx}>
                              <Typography variant="body2">{funcion}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs:12 }}>

              <Divider />
            </Grid>
          </>
        )}

        {/* Habilidades */}
        {hojaVida.habilidades && (
          <>
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
                Habilidades
              </Typography>
              
              {hojaVida.habilidades.tecnicas && hojaVida.habilidades.tecnicas.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Habilidades Técnicas</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {hojaVida.habilidades.tecnicas.map((hab, idx) => (
                      <Chip key={idx} label={hab} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {hojaVida.habilidades.blandas && hojaVida.habilidades.blandas.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Habilidades Blandas</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {hojaVida.habilidades.blandas.map((hab, idx) => (
                      <Chip key={idx} label={hab} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {hojaVida.habilidades.idiomas && hojaVida.habilidades.idiomas.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon fontSize="small" /> Idiomas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {hojaVida.habilidades.idiomas.map((idioma, idx) => (
                      <Chip 
                        key={idx} 
                        label={`${idioma.idioma}: ${idioma.nivel}`} 
                        size="small" 
                        color="info" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </>
        )}
      </Grid>

      {/* Información del Sistema */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Documento generado el {format(new Date(), 'PPpp', { locale: es })}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          SEGURA EP PRM XVI - Sistema de Reportes ACM
        </Typography>
      </Box>
    </Paper>
  );
}