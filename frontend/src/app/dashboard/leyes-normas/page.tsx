//frontend/src/app/dashboard/leyes-normas/page.tsx
'use client';
import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Alert,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Fab,
  Tooltip,
  Backdrop,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  LibraryBooks as LibraryBooksIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { LeyNormaService, type LeyNorma, type Articulo } from '@/services/leyNorma.service';
import Image from 'next/image';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leyes-normas-tabpanel-${index}`}
      aria-labelledby={`leyes-normas-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Categorías predefinidas de leyes/normas
const categoriasLeyes = [
  'Penal',
  'Municipal',
  'Seguridad',
  'Transporte',
  'Constitucional',
  'Ambiental',
  'Laboral',
  'Administrativo',
  'Tránsito',
  'Urbanístico'
];

export default function LeyesNormasPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [leyesNormas, setLeyesNormas] = useState<LeyNorma[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [leySeleccionada, setLeySeleccionada] = useState<LeyNorma | null>(null);
  const [articulosLey, setArticulosLey] = useState<Articulo[]>([]);
  const [leyesFavoritas, setLeyesFavoritas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogDetallesOpen, setDialogDetallesOpen] = useState(false);
  const [dialogAgregarArticuloOpen, setDialogAgregarArticuloOpen] = useState(false);
  const [dialogEditarLeyOpen, setDialogEditarLeyOpen] = useState(false);
  const [dialogEliminarArticuloOpen, setDialogEliminarArticuloOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [leyesFiltradas, setLeyesFiltradas] = useState<LeyNorma[]>([]);
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'categoria'>('nombre');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para administración
  const [leyParaAgregarArticulo, setLeyParaAgregarArticulo] = useState<string | null>(null);
  const [nuevoArticulo, setNuevoArticulo] = useState<Partial<Articulo>>({
    numero_articulo: '',
    contenido: '',
    descripcion_corta: ''
  });
  const [articuloAEliminar, setArticuloAEliminar] = useState<Articulo | null>(null);
  const [leyEditando, setLeyEditando] = useState<Partial<LeyNorma>>({
    nombre: '',
    categoria: '',
    descripcion: ''
  });
const [isAdmin, setIsAdmin] = useState(false);
const checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    router.push('/login');
    return;
  }

  const { data: userData } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (userData) {
    setUser(userData);
    setIsAdmin(userData.rol === 'admin');
  }
};
  // Cargar datos al iniciar
  useEffect(() => {
    

    checkSession();
    cargarLeyesNormas();
    cargarFavoritos();
  }, []);

  // Filtrar leyes cuando cambian los criterios
  useEffect(() => {
    filtrarLeyes();
  }, [busqueda, categoriaFiltro, leyesNormas, ordenarPor]);

  const cargarLeyesNormas = async () => {
    try {
      setLoading(true);
      setError('');

      const [leyes, categoriasData] = await Promise.all([
        LeyNormaService.obtenerLeyesNormas(),
        LeyNormaService.obtenerCategorias()
      ]);

      setLeyesNormas(leyes);
      setCategorias(categoriasData);
      setLeyesFiltradas(leyes);

    } catch (error: any) {
      console.error('Error cargando leyes/normas:', error);
      setError('Error al cargar las leyes y normas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarFavoritos = () => {
    const favoritos = JSON.parse(localStorage.getItem('leyes_favoritas') || '[]');
    setLeyesFavoritas(favoritos);
  };

  const filtrarLeyes = () => {
    let filtradas = [...leyesNormas];

    // Aplicar búsqueda por texto
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtradas = filtradas.filter(ley =>
        ley.nombre.toLowerCase().includes(termino) ||
        ley.descripcion?.toLowerCase().includes(termino) ||
        ley.categoria.toLowerCase().includes(termino)
      );
    }

    // Aplicar filtro por categoría
    if (categoriaFiltro) {
      filtradas = filtradas.filter(ley => ley.categoria === categoriaFiltro);
    }

    // Ordenar
    filtradas.sort((a, b) => {
      if (ordenarPor === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      } else {
        return a.categoria.localeCompare(b.categoria);
      }
    });

    setLeyesFiltradas(filtradas);
    setPage(0);
  };

  const cargarDetallesLey = async (leyId: string) => {
    try {
      setLoadingDetalles(true);
      const [ley, articulos] = await Promise.all([
        LeyNormaService.obtenerPorId(leyId),
        LeyNormaService.obtenerArticulos(leyId)
      ]);
      
      setLeySeleccionada(ley);
      setArticulosLey(articulos);
      setDialogDetallesOpen(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setError('Error al cargar los detalles de la ley/norma.');
    } finally {
      setLoadingDetalles(false);
    }
  };

  const toggleFavorito = (leyId: string) => {
    const nuevosFavoritos = leyesFavoritas.includes(leyId)
      ? leyesFavoritas.filter(id => id !== leyId)
      : [...leyesFavoritas, leyId];
    
    setLeyesFavoritas(nuevosFavoritos);
    localStorage.setItem('leyes_favoritas', JSON.stringify(nuevosFavoritos));
  };

  // Funciones de administración
  const handleEditarLey = (leyId: string) => {
    const ley = leyesNormas.find(l => l.id === leyId);
    if (ley) {
      setLeyEditando({
        id: ley.id,
        nombre: ley.nombre,
        categoria: ley.categoria,
        descripcion: ley.descripcion || ''
      });
      setDialogEditarLeyOpen(true);
    }
  };

  const handleAgregarArticulo = (leyId: string) => {
    setLeyParaAgregarArticulo(leyId);
    setNuevoArticulo({
      numero_articulo: '',
      contenido: '',
      descripcion_corta: ''
    });
    setDialogAgregarArticuloOpen(true);
  };

  const handleEliminarLey = async (leyId: string) => {
    if (confirm('¿Estás seguro de eliminar esta ley/norma? Esta acción no se puede deshacer.')) {
      try {
        await LeyNormaService.eliminarLeyNorma(leyId);
        setSuccess('Ley/norma eliminada exitosamente');
        cargarLeyesNormas();
        setDialogDetallesOpen(false);
      } catch (error) {
        setError('Error al eliminar la ley/norma');
      }
    }
  };

  const handleGuardarArticulo = async () => {
    if (!leyParaAgregarArticulo || !nuevoArticulo.numero_articulo || !nuevoArticulo.contenido) {
      setError('Número y contenido del artículo son obligatorios');
      return;
    }

    try {
      await LeyNormaService.agregarArticulo(leyParaAgregarArticulo, nuevoArticulo);
      setSuccess('Artículo agregado exitosamente');
      setDialogAgregarArticuloOpen(false);
      
      // Recargar detalles si estamos viendo esa ley
      if (leySeleccionada?.id === leyParaAgregarArticulo) {
        cargarDetallesLey(leyParaAgregarArticulo);
      }
      
      // Recargar lista
      cargarLeyesNormas();
    } catch (error) {
      setError('Error al agregar artículo');
    }
  };
const handleGuardarLey = async () => {
  if (!leyEditando.nombre || !leyEditando.categoria) {
    setError('Nombre y categoría son obligatorios');
    return;
  }

  try {
    if (leyEditando.id) {
      // Actualizar ley existente
      await LeyNormaService.actualizarLeyNorma(leyEditando.id, leyEditando);
      setSuccess('Ley/norma actualizada exitosamente');
    } else {
      // Crear nueva ley/norma
      const nuevaLey = await LeyNormaService.crearLeyNorma(leyEditando);
      setSuccess('Ley/norma creada exitosamente');
      // Actualizar la lista de leyes inmediatamente
      setLeyesNormas([...leyesNormas, nuevaLey]);
    }
    
    setDialogEditarLeyOpen(false);
    cargarLeyesNormas(); // Recargar la lista completa
    
  } catch (error: any) {
    console.error('Error al guardar ley/norma:', error);
    
    // Mostrar mensaje de error específico
    if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else {
      setError('Error al guardar la ley/norma. Verifica los datos e intenta nuevamente.');
    }
  }
};
  const handleEliminarArticulo = (articulo: Articulo) => {
    setArticuloAEliminar(articulo);
    setDialogEliminarArticuloOpen(true);
  };

  const handleConfirmarEliminarArticulo = async () => {
    if (!articuloAEliminar) return;

    try {
      await LeyNormaService.eliminarArticulo(articuloAEliminar.id);
      setSuccess('Artículo eliminado exitosamente');
      setDialogEliminarArticuloOpen(false);
      
      // Recargar detalles si estamos viendo esa ley
      if (leySeleccionada) {
        cargarDetallesLey(leySeleccionada.id);
      }
    } catch (error) {
      setError('Error al eliminar el artículo');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setCategoriaFiltro('');
    setOrdenarPor('nombre');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderColorCategoria = (categoria: string) => {
    const colores: Record<string, string> = {
      'Penal': '#ef4444',
      'Municipal': '#3b82f6',
      'Seguridad': '#10b981',
      'Transporte': '#f59e0b',
      'Constitucional': '#8b5cf6',
      'Ambiental': '#06b6d4',
      'Laboral': '#ec4899',
      'Administrativo': '#6366f1',
      'Tránsito': '#84cc16',
      'Urbanístico': '#f97316'
    };
    return colores[categoria] || '#6b7280';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Backdrop open={loadingDetalles} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

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
              Leyes y Normas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de Reportes ACM - Legislación Aplicable
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Barra de herramientas */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Buscar leyes/normas"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: busqueda && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setBusqueda('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                placeholder="Buscar por nombre, descripción o categoría..."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoriaFiltro}
                  label="Categoría"
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <MenuItem value="">Todas las categorías</MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Ordenar">
                  <Select
                    value={ordenarPor}
                    onChange={(e) => setOrdenarPor(e.target.value as 'nombre' | 'categoria')}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="nombre">Por nombre</MenuItem>
                    <MenuItem value="categoria">Por categoría</MenuItem>
                  </Select>
                </Tooltip>
                <Tooltip title="Refrescar">
                  <IconButton onClick={cargarLeyesNormas}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Limpiar filtros">
                  <IconButton onClick={handleLimpiarFiltros}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {leyesNormas.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Leyes/Normas
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
              {categorias.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categorías
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
              {leyesFavoritas.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Favoritos
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
              {leyesFiltradas.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resultados
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Contenido principal */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Todas (${leyesFiltradas.length})`} />
            <Tab label={`Favoritos (${leyesFavoritas.length})`} />
            <Tab label="Por Categorías" />
          </Tabs>
        </Box>

        {/* Tab 1: Todas las leyes */}
        <TabPanel value={tabValue} index={0}>
          {leyesFiltradas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <LibraryBooksIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No se encontraron leyes/normas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {busqueda || categoriaFiltro 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'No hay leyes/normas cargadas en el sistema'}
              </Typography>
              {(busqueda || categoriaFiltro) && (
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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ley/Norma</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leyesFiltradas
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((ley) => (
                        <TableRow key={ley.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {ley.nombre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ley.categoria}
                              size="small"
                              sx={{
                                bgcolor: renderColorCategoria(ley.categoria),
                                color: 'white',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {ley.descripcion || 'Sin descripción'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="Ver detalles">
                                <IconButton
                                  size="small"
                                  onClick={() => cargarDetallesLey(ley.id)}
                                  color="primary"
                                >
                                  <ArticleIcon />
                                </IconButton>
                              </Tooltip>
                              {user?.rol === 'admin' && (
                                <>
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditarLey(ley.id)}
                                      color="info"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Agregar artículo">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleAgregarArticulo(ley.id)}
                                      color="success"
                                    >
                                      <AddIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip title={leyesFavoritas.includes(ley.id) ? "Quitar de favoritos" : "Agregar a favoritos"}>
                                <IconButton
                                  size="small"
                                  onClick={() => toggleFavorito(ley.id)}
                                  color={leyesFavoritas.includes(ley.id) ? "warning" : "default"}
                                >
                                  {leyesFavoritas.includes(ley.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
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
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={leyesFiltradas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
              />
            </>
          )}
        </TabPanel>

        {/* Tab 2: Favoritos */}
        <TabPanel value={tabValue} index={1}>
          {leyesFavoritas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <BookmarkBorderIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No tienes leyes/normas favoritas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Agrega leyes a tus favoritos para acceder rápidamente a ellas
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {leyesNormas
                .filter(ley => leyesFavoritas.includes(ley.id))
                .map((ley) => (
                  <Grid size={{ xs: 12 }} key={ley.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {ley.nombre}
                            </Typography>
                            <Chip
                              label={ley.categoria}
                              size="small"
                              sx={{
                                bgcolor: renderColorCategoria(ley.categoria),
                                color: 'white',
                                mb: 1
                              }}
                            />
                            {ley.descripcion && (
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {ley.descripcion}
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <IconButton
                              onClick={() => toggleFavorito(ley.id)}
                              color="warning"
                            >
                              <BookmarkIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<ArticleIcon />}
                          onClick={() => cargarDetallesLey(ley.id)}
                        >
                          Ver Detalles
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Por Categorías */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {categorias.map((categoria) => {
              const leyesCategoria = leyesNormas.filter(ley => ley.categoria === categoria);
              
              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={categoria}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: renderColorCategoria(categoria) }}>
                          <CategoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{categoria}</Typography>

                        </Box>
                      </Box>
                      
                      <List dense>
                        {leyesCategoria.slice(0, 3).map((ley) => (
                          <ListItem key={ley.id}>
                            <ListItemText
                              primary={ley.nombre}
                              secondary={ley.descripcion?.substring(0, 60) + '...' || 'Sin descripción'}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => cargarDetallesLey(ley.id)}
                              >
                                <ArticleIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      
                      {leyesCategoria.length > 3 && (
                        <Button
                          size="small"
                          fullWidth
                          onClick={() => {
                            setCategoriaFiltro(categoria);
                            setTabValue(0);
                          }}
                          sx={{ mt: 1 }}
                        >
                          Ver todas ({leyesCategoria.length})
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Diálogo de Detalles de Ley/Norma */}
      <Dialog 
        open={dialogDetallesOpen} 
        onClose={() => setDialogDetallesOpen(false)} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        {leySeleccionada ? (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {leySeleccionada.nombre}
                  </Typography>
                  <Chip
                    label={leySeleccionada.categoria}
                    size="small"
                    sx={{
                      bgcolor: renderColorCategoria(leySeleccionada.categoria),
                      color: 'white',
                      mt: 1
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => toggleFavorito(leySeleccionada.id)}
                    color={leyesFavoritas.includes(leySeleccionada.id) ? "warning" : "default"}
                  >
                    {leyesFavoritas.includes(leySeleccionada.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {leySeleccionada.descripcion && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Descripción
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {leySeleccionada.descripcion}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Artículos ({articulosLey.length})
                </Typography>
                {user?.rol === 'admin' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAgregarArticulo(leySeleccionada.id)}
                  >
                    Agregar Artículo
                  </Button>
                )}
              </Box>

              {articulosLey.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Esta ley/norma no tiene artículos registrados
                </Typography>
              ) : (
                <List>
                  {articulosLey.map((articulo) => (
                    <Card key={articulo.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4f46e5' }}>
                              Artículo {articulo.numero_articulo}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {articulo.contenido}
                            </Typography>
                            {articulo.descripcion_corta && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                {articulo.descripcion_corta}
                              </Typography>
                            )}
                          </Box>
                          {user?.rol === 'admin' && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleEliminarArticulo(articulo)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogDetallesOpen(false)}>
                Cerrar
              </Button>
               <Button
        variant="outlined"
        color="error"
        onClick={() => handleEliminarLey(leySeleccionada.id)}
        startIcon={<DeleteIcon />}
        sx={{ minWidth: 120 }}
      >
        Eliminar
      </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Diálogo para agregar/editar artículo */}
      <Dialog open={dialogAgregarArticuloOpen} onClose={() => setDialogAgregarArticuloOpen(false)}>
        <DialogTitle>
          Agregar Nuevo Artículo
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Número de Artículo"
            margin="normal"
            value={nuevoArticulo.numero_articulo}
            onChange={(e) => setNuevoArticulo({...nuevoArticulo, numero_articulo: e.target.value})}
            required
          />
          <TextField
            fullWidth
            label="Contenido"
            margin="normal"
            multiline
            rows={4}
            value={nuevoArticulo.contenido}
            onChange={(e) => setNuevoArticulo({...nuevoArticulo, contenido: e.target.value})}
            required
          />
          <TextField
            fullWidth
            label="Descripción Corta"
            margin="normal"
            value={nuevoArticulo.descripcion_corta}
            onChange={(e) => setNuevoArticulo({...nuevoArticulo, descripcion_corta: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAgregarArticuloOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarArticulo}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar ley/norma */}
      <Dialog open={dialogEditarLeyOpen} onClose={() => setDialogEditarLeyOpen(false)}>
        <DialogTitle>
          {leyEditando.id ? 'Editar Ley/Norma' : 'Crear Nueva Ley/Norma'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            margin="normal"
            value={leyEditando.nombre}
            onChange={(e) => setLeyEditando({...leyEditando, nombre: e.target.value})}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Categoría *</InputLabel>
            <Select
              value={leyEditando.categoria}
              label="Categoría *"
              onChange={(e) => setLeyEditando({...leyEditando, categoria: e.target.value})}
              required
            >
              {categoriasLeyes.map((categoria) => (
                <MenuItem key={categoria} value={categoria}>
                  {categoria}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Descripción"
            margin="normal"
            multiline
            rows={3}
            value={leyEditando.descripcion}
            onChange={(e) => setLeyEditando({...leyEditando, descripcion: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEditarLeyOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarLey}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para eliminar artículo */}
      <Dialog open={dialogEliminarArticuloOpen} onClose={() => setDialogEliminarArticuloOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el artículo "{articuloAEliminar?.numero_articulo}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEliminarArticuloOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmarEliminarArticulo}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botón flotante para crear nueva ley (solo admin) */}
      {isAdmin && (
    <Tooltip title="Crear nueva ley/norma">
    <Fab
      color="primary"
      aria-label="add"
      onClick={() => {
        // Resetear el estado de leyEditando completamente
        setLeyEditando({
          id: undefined, // Asegurar que no tenga ID para que se cree nueva
          nombre: '',
          categoria: '',
          descripcion: ''
        });
        setDialogEditarLeyOpen(true);
      }}
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        bgcolor: '#4f46e5',
        '&:hover': {
          bgcolor: '#4338ca',
          transform: 'scale(1.1)'
        },
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
        transition: 'all 0.3s ease'
      }}
    >
      <AddIcon />
    </Fab>
  </Tooltip>
)}
    </Container>
  );
}