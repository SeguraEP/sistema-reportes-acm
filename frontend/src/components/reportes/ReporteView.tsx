//frontend/src/components/reportes/ReporteView.tsx

'use client';

import React from 'react';
import {
  Tooltip,
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Photo as PhotoIcon,
  Gavel as GavelIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Reporte, ImagenReporte, LeyNormaReporte } from '@/services/reporte.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Props del componente
interface ReporteViewProps {
  reporte: Reporte;
  imagenes?: ImagenReporte[];
  leyesAplicables?: LeyNormaReporte[];
  loading?: boolean;
  error?: string;
  onDownload?: (formato: 'pdf' | 'word') => void;
  onPrint?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
  showConfirmDelete?: boolean;
  onConfirmDelete?: (confirm: boolean) => void;
}

// Función para formatear fecha completa
const formatFechaCompleta = (fecha: string) => {
  return format(new Date(fecha), "PPpp", { locale: es });
};

// Función para renderizar el estado
const renderEstadoChip = (estado: string) => {
  const colores: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    pendiente: 'warning',
    completado: 'success',
    revisado: 'info',
    archivado: 'default'
  };

  const etiquetas: Record<string, string> = {
    pendiente: 'Pendiente',
    completado: 'Completado',
    revisado: 'Revisado',
    archivado: 'Archivado'
  };

  return (
    <Chip
      label={etiquetas[estado] || estado}
      color={colores[estado] || 'default'}
      size="medium"
      sx={{ fontWeight: 600 }}
    />
  );
};

export default function ReporteView({
  reporte,
  imagenes = [],
  leyesAplicables = [],
  loading = false,
  error,
  onDownload,
  onPrint,
  onEdit,
  onDelete,
  allowEdit = true,
  allowDelete = false,
  showConfirmDelete = false,
  onConfirmDelete
}: ReporteViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDeleteClick = () => {
    if (onDelete) {
      if (showConfirmDelete && onConfirmDelete) {
        setDeleteDialogOpen(true);
      } else {
        onDelete();
      }
    }
  };

  const handleConfirmDelete = (confirm: boolean) => {
    if (onConfirmDelete) {
      onConfirmDelete(confirm);
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Encabezado con acciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Reporte: {reporte.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {renderEstadoChip(reporte.estado)}
              <Typography variant="body2" color="text.secondary">
                Creado: {formatFechaCompleta(reporte.created_at)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onDownload && (
              <Tooltip title="Descargar PDF">
                <IconButton
                  onClick={() => onDownload('pdf')}
                  color="primary"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {onPrint && (
              <Tooltip title="Imprimir">
                <IconButton onClick={onPrint}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {allowEdit && onEdit && (
              <Tooltip title="Editar">
                <IconButton
                  onClick={onEdit}
                  color="info"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {allowDelete && onDelete && (
              <Tooltip title="Eliminar">
                <IconButton
                  onClick={handleDeleteClick}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Información del Reporte */}
          <Grid size={{ xs:12 }}>

            <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
              Información del Reporte
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <Typography variant="caption" color="text.secondary" display="block">
                  Fecha del Reporte
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatFechaCompleta(reporte.fecha)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <Typography variant="caption" color="text.secondary" display="block">
                  Zona
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.zona}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <Typography variant="caption" color="text.secondary" display="block">
                  Distrito
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.distrito}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <Typography variant="caption" color="text.secondary" display="block">
                  Circuito
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.circuito}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Dirección
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.direccion}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Horario
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.horario_jornada} - Reporte: {reporte.hora_reporte}
                </Typography>
              </Grid>
              {reporte.coordenadas && (
                <Grid size={{ xs:12 }}>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Coordenadas
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    <LocationIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {reporte.coordenadas}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid size={{ xs:12 }}>

            <Divider />
          </Grid>

          {/* Descripción de la Novedad */}
          <Grid size={{ xs:12 }}>

            <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
              Descripción de la Novedad
            </Typography>
            <Paper sx={{ p: 3, bgcolor: '#f9fafb', borderRadius: 1 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {reporte.novedad}
              </Typography>
              {reporte.reporta && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Reporta: {reporte.reporta}
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs:12 }}>

            <Divider />
          </Grid>

          {/* Información del Agente */}
          <Grid size={{ xs:12 }}>

            <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
              Información del Agente
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Agente
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {reporte.nombre_completo}
                </Typography>
              </Grid>
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Cédula
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reporte.cedula}
                </Typography>
              </Grid>
              <Grid size={{ xs:12, sm:6, md:4}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tipo de Reporte
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {reporte.tipo_reporte?.replace('_', ' ').toUpperCase() || 'ENCARGADO DE CUADRA'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Leyes y Normas Aplicables */}
          {leyesAplicables.length > 0 && (
            <>
              <Grid size={{ xs:12 }}>

                <Divider />
              </Grid>
              <Grid size={{ xs:12 }}>

                <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
                  Leyes y Normas Aplicables
                </Typography>
                <List>
                  {leyesAplicables.map((ley, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#f59e0b' }}>
                          <GavelIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={ley.ley_norma?.nombre}
                        secondary={
                          ley.articulo ? 
                          `Artículo ${ley.articulo.numero_articulo}: ${ley.articulo.descripcion_corta || ley.articulo.contenido.substring(0, 100)}...` :
                          'Ley completa aplicable'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </>
          )}

          {/* Imágenes Adjuntas */}
          {imagenes.length > 0 && (
            <>
              <Grid size={{ xs:12 }}>

                <Divider />
              </Grid>
              <Grid size={{ xs:12 }}>

                <Typography variant="h6" gutterBottom sx={{ color: '#4f46e5' }}>
                  Imágenes Adjuntas ({imagenes.length})
                </Typography>
                <Grid container spacing={2}>
                  {imagenes.map((imagen) => (
                    <Grid size={{ xs:6, sm: 4, md: 3 }}
 key={imagen.id}>
                      <Card>
                        <CardContent sx={{ p: 1, textAlign: 'center' }}>
                          <PhotoIcon sx={{ fontSize: 40, color: '#9ca3af', mb: 1 }} />
                          <Typography variant="caption" noWrap display="block">
                            {imagen.nombre_archivo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Orden: {imagen.orden}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                          <Button
                            size="small"
                            href={imagen.url_storage}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver Imagen
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </>
          )}

          {/* Información del Sistema */}
          <Grid size={{ xs:12 }}>

            <Divider />
          </Grid>
          <Grid size={{ xs:12 }}>

            <Typography variant="body2" color="text.secondary" align="center">
              ID del Reporte: {reporte.id} | Generado: {formatFechaCompleta(reporte.created_at)} | 
              Última actualización: {formatFechaCompleta(reporte.updated_at)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de eliminar el reporte <strong>{reporte.id}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Se eliminarán también todas las imágenes asociadas y registros relacionados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleConfirmDelete(true)} 
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}