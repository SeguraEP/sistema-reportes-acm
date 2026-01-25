//frontend/src/app/dashboard/buscar-reportes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Fab,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,

  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  Photo as PhotoIcon,
  Gavel as GavelIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { ReporteService, type Reporte, type ImagenReporte, type LeyNormaReporte } from '@/services/reporte.service';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Definición de tipos para filtros
interface FiltrosBusqueda {
  fecha_desde?: string;
  fecha_hasta?: string;
  zona?: string;
  distrito?: string;
  circuito?: string;
  usuario_id?: string;
  estado?: string; 
}

// Columnas de la tabla
interface Column {
  id: keyof Reporte | 'acciones';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
}

const columns: Column[] = [
  { id: 'id', label: 'ID Reporte', minWidth: 150 },
  { id: 'fecha', label: 'Fecha', minWidth: 100, format: (value: string) => format(new Date(value), 'dd/MM/yyyy') },
  { id: 'zona', label: 'Zona', minWidth: 100 },
  { id: 'distrito', label: 'Distrito', minWidth: 120 },
  { id: 'circuito', label: 'Circuito', minWidth: 80 },
  { id: 'hora_reporte', label: 'Hora', minWidth: 80 },
  { id: 'estado', label: 'Estado', minWidth: 100 },
  { id: 'created_at', label: 'Creado', minWidth: 120, format: (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm') },
  { id: 'acciones', label: 'Acciones', minWidth: 150, align: 'center' }
];

// Zonas de Guayaquil
const zonasGuayaquil = ['Norte', 'Sur', 'Centro', 'Oeste', 'Este'];

// Estados de reporte
const estadosReporte = ['pendiente', 'completado', 'revisado', 'archivado'];

export default function BuscarReportesPage() {
   const [user, setUser] = useState<any>(null); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<string>('');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);
  const [imagenesReporte, setImagenesReporte] = useState<ImagenReporte[]>([]);
  const [leyesReporte, setLeyesReporte] = useState<LeyNormaReporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({});
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReportes, setTotalReportes] = useState(0);
  const [ordenarPor, setOrdenarPor] = useState<string>('created_at');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc');
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Verificar si hay parámetro de reporte específico
  useEffect(() => {

    const reporteId = searchParams.get('detalle');
    if (reporteId) {
      cargarDetallesReporte(reporteId);
    }
    const checkSessionAndRole = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('No hay sesión activa');
    return;
  }

  setUser(session.user);
  
  // Obtener el usuario completo de la tabla usuarios
  const { data: userData, error } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error obteniendo datos del usuario:', error);
    setUserRole('acm'); // Rol por defecto
  } else {
    console.log('Rol desde base de datos:', userData?.rol);
    setUserRole(userData?.rol || 'acm');
  }
};
  }, [searchParams]);

  // Cargar reportes al iniciar
  useEffect(() => {
     const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Puedes redirigir al login si es necesario
        return;
      }

      setUser(session.user);
    };

    checkSession();
    cargarReportes();
  }, []);
useEffect(() => {
  const interval = setInterval(() => {
    cargarEstadisticas();
  }, 10000); // 10 segundos

  return () => clearInterval(interval); // limpiar al desmontar
}, []);

  // Cargar reportes cuando cambian filtros o paginación
  useEffect(() => {
    cargarReportes();
  }, [filtros, page, rowsPerPage, ordenarPor, ordenDireccion]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError('');

      const datosFiltros = {
        ...filtros,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ordenar_por: ordenarPor,
        orden_direccion: ordenDireccion
      };

      const reportesData = await ReporteService.buscarReportes(datosFiltros);
      setReportes(reportesData);
      setTotalReportes(reportesData.length); // En una implementación real, esto vendría del backend

    } catch (error: any) {
      console.error('Error cargando reportes:', error);
      setError('Error al cargar los reportes. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

const cargarEstadisticas = async () => {
  try {
    const stats = await ReporteService.obtenerEstadisticas();
    setEstadisticas(stats);
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    setEstadisticas({
      total: 0,
      por_zona: {},
      completados: 0,
      pendientes: 0
    });
  }
};

  const cargarDetallesReporte = async (reporteId: string) => {
    try {
      setLoadingDetalles(true);
      const detalles = await ReporteService.obtenerReporte(reporteId);
      setReporteSeleccionado(detalles.reporte);
      setImagenesReporte(detalles.imagenes);
      setLeyesReporte(detalles.leyes_aplicables);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setError('Error al cargar los detalles del reporte.');
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOrdenar = (columnaId: string) => {
    if (ordenarPor === columnaId) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenarPor(columnaId);
      setOrdenDireccion('asc');
    }
  };

  const handleFiltrar = (campo: keyof FiltrosBusqueda, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor || undefined
    }));
    setPage(0); // Resetear a primera página al filtrar
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    setFiltrosAvanzados(false);
    setPage(0);
  };

  const handleExportar = async (formato: 'pdf' | 'word' | 'csv') => {
    try {
      // En una implementación real, llamarías a la API para exportar
      alert(`Exportando en formato ${formato.toUpperCase()}...`);
    } catch (error) {
      console.error('Error exportando:', error);
      setError('Error al exportar los reportes.');
    }
  };

  const handleDescargarReporte = async (reporteId: string, formato: 'pdf' | 'word') => {
    try {
      if (formato === 'pdf') {
        const blob = await ReporteService.descargarReportePDF(reporteId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${reporteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const blob = await ReporteService.descargarReporteWord(reporteId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${reporteId}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error descargando reporte:', error);
      setError('Error al descargar el reporte.');
    }
  };

  const handleEliminarReporte = async (reporteId: string) => {
    if (confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) {
      try {
        await ReporteService.eliminarReporte(reporteId);
        cargarReportes(); // Recargar la lista
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        setError('Error al eliminar el reporte.');
      }
    }
  };

  const handleImprimirReporte = async (reporteId: string) => {
    try {
      const html = await ReporteService.obtenerHTMLImpresion(reporteId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error imprimiendo reporte:', error);
      setError('Error al generar la vista de impresión.');
    }
  };

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
        size="small"
      />
    );
  };

  const formatFechaCompleta = (fecha: string) => {
    return format(new Date(fecha), "PPpp", { locale: es });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.back()}
                  sx={{ mb: 2 }}
                >
                  Volver
                </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Image
            src="/images/logo-acm.png"
            alt="SEGURA EP PRM XVI"
            width={60}
            height={30}
          />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#213126' }}>
              Buscar Reportes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consulta y gestiona los reportes del sistema
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
     <TextField
                label="Fecha desde"
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => handleFiltrar('fecha_desde', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>

              <TextField
                label="Fecha hasta"
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => handleFiltrar('fecha_hasta', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>

              <FormControl fullWidth size="small">
                <InputLabel>Zona</InputLabel>
                <Select
                  value={filtros.zona || ''}
                  label="Zona"
                  onChange={(e) => handleFiltrar('zona', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {zonasGuayaquil.map((zona) => (
                    <MenuItem key={zona} value={zona}>{zona}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>

              <Button
                variant={filtrosAvanzados ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                onClick={() => setFiltrosAvanzados(!filtrosAvanzados)}
                fullWidth
                size="small"
              >
                {filtrosAvanzados ? 'Ocultar' : 'Más filtros'}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>

              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleLimpiarFiltros}
                fullWidth
                size="small"
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>

          {filtrosAvanzados && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <TextField
                  label="Distrito"
                  value={filtros.distrito || ''}
                  onChange={(e) => handleFiltrar('distrito', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <TextField
                  label="Circuito"
                  value={filtros.circuito || ''}
                  onChange={(e) => handleFiltrar('circuito', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={cargarReportes}
                  fullWidth
                  size="small"
                >
                  Buscar
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs:6, md: 3 }}>

            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {estadisticas.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reportes
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs:6, md: 3 }}>

            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {Object.keys(estadisticas.por_zona || {}).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Zonas Activas
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Contenido Principal */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Barra de herramientas */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Reportes ({totalReportes})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refrescar">
              <IconButton onClick={cargarReportes}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Box>
        ) : reportes.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No se encontraron reportes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {Object.keys(filtros).length > 0 
                ? 'Intenta con otros filtros de búsqueda' 
                : 'Aún no hay reportes en el sistema'}
            </Typography>
            {Object.keys(filtros).length > 0 && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleLimpiarFiltros}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth, fontWeight: 600 }}
                      >
                        {column.id !== 'acciones' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                               onClick={() => column.id !== 'acciones' && handleOrdenar(column.id)}>
                            {column.label}
                            {ordenarPor === column.id && (
                              <SortIcon sx={{ 
                                ml: 0.5,
                                transform: ordenDireccion === 'desc' ? 'rotate(180deg)' : 'none',
                                fontSize: 16 
                              }} />
                            )}
                          </Box>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportes.map((reporte) => (
                    <TableRow hover key={reporte.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {reporte.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reporte.fecha), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{reporte.zona}</TableCell>
                      <TableCell>{reporte.distrito}</TableCell>
                      <TableCell>{reporte.circuito}</TableCell>
                      <TableCell>{reporte.hora_reporte}</TableCell>
                      <TableCell>
                        {renderEstadoChip(reporte.estado)}
                      </TableCell>
                      <TableCell>
                        {formatFechaCompleta(reporte.created_at)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                         
                          
                          <Tooltip title="Descargar PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDescargarReporte(reporte.id, 'pdf')}
                              color="secondary"
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar Word">
  <IconButton
    size="small"
    onClick={() => handleDescargarReporte(reporte.id, 'word')}
    color="primary"
  >
    <DownloadIcon />
  </IconButton>
</Tooltip>
                          
                          
    <Tooltip title="Eliminar">
      <IconButton
        size="small"
        onClick={() => handleEliminarReporte(reporte.id)}
        color="error"
      >
        <DeleteIcon />
      </IconButton>
    </Tooltip>


                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalReportes}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Diálogo de Detalles del Reporte */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        {loadingDetalles ? (
          <DialogContent>
            <LinearProgress />
          </DialogContent>
        ) : reporteSeleccionado ? (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Detalles del Reporte: {reporteSeleccionado.id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleDescargarReporte(reporteSeleccionado.id, 'pdf')}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleImprimirReporte(reporteSeleccionado.id)}
                  >
                    <PrintIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Información Básica */}
                <Grid size={{ xs:12 }}>

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mb: 2 }}>
                    Información del Reporte
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                      <Typography variant="caption" color="text.secondary">
                        Fecha
                      </Typography>
                      <Typography variant="body2">
                        {formatFechaCompleta(reporteSeleccionado.fecha)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                      <Typography variant="caption" color="text.secondary">
                        Zona
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.zona}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                      <Typography variant="caption" color="text.secondary">
                        Distrito
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.distrito}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>

                      <Typography variant="caption" color="text.secondary">
                        Circuito
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.circuito}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Dirección
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.direccion}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Horario
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.horario_jornada} - Reporte: {reporteSeleccionado.hora_reporte}
                      </Typography>
                    </Grid>
                    {reporteSeleccionado.coordenadas && (
                      <Grid size={{ xs:12 }}>

                        <Typography variant="caption" color="text.secondary">
                          Coordenadas
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {reporteSeleccionado.coordenadas}
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

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mb: 2 }}>
                    Descripción de la Novedad
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {reporteSeleccionado.novedad}
                    </Typography>
                  </Paper>
                  {reporteSeleccionado.reporta && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Reporta: {reporteSeleccionado.reporta}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs:12 }}>

                  <Divider />
                </Grid>

                {/* Información del Usuario */}
                <Grid size={{ xs:12 }}>

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mb: 2 }}>
                    Información del Agente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Agente
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.nombre_completo}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Cédula
                      </Typography>
                      <Typography variant="body2">
                        {reporteSeleccionado.cedula}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body2">
                        {formatFechaCompleta(reporteSeleccionado.created_at)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6}}>
                      <Typography variant="caption" color="text.secondary">
                        Estado
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {renderEstadoChip(reporteSeleccionado.estado)}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Leyes Aplicables */}
                {leyesReporte.length > 0 && (
                  <>
                    <Grid size={{ xs:12 }}>

                      <Divider />
                    </Grid>
                    <Grid size={{ xs:12 }}>

                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mb: 2 }}>
                        Leyes y Normas Aplicables
                      </Typography>
                      <List dense>
                        {leyesReporte.map((ley, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#f59e0b', width: 32, height: 32 }}>
                                <GavelIcon fontSize="small" />
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

                {/* Imágenes */}
                {imagenesReporte.length > 0 && (
                  <>
                    <Grid size={{ xs:12 }}>

                      <Divider />
                    </Grid>
                    <Grid size={{ xs:12 }}>

                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mb: 2 }}>
                        Imágenes Adjuntas ({imagenesReporte.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {imagenesReporte.map((imagen, index) => (
                          <Grid size={{ xs:6, sm: 4, md: 3 }} key={imagen.id}>
                            <Card>
                              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                <PhotoIcon sx={{ fontSize: 40, color: '#9ca3af', mb: 1 }} />
                                <Typography variant="caption" noWrap display="block">
                                  {imagen.nombre_archivo}
                                </Typography>
                              </CardContent>
                              <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                                <Button
                                  size="small"
                                  href={imagen.url_storage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Ver
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
              {user?.rol === 'admin' && (
                <Button
                  color="error"
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar este reporte?')) {
                      handleEliminarReporte(reporteSeleccionado.id);
                      setDialogOpen(false);
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      
    </Container>
  );
}