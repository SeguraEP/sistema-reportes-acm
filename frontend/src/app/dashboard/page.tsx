// frontend/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  Tooltip,CircularProgress,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Photo as PhotoIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase'; // Usa Supabase directamente
import Image from 'next/image';
import { ReporteService, type Reporte } from '@/services/reporte.service';
import { UsuarioService, type Usuario } from '@/services/usuario.service';
import Link from 'next/link';
import ListItemButton from '@mui/material/ListItemButton';
import { Logout as LogoutIcon } from '@mui/icons-material'; 
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
const recargarEstadisticas = async () => {
  try {
    setLoading(true);
    const stats = await ReporteService.obtenerEstadisticas();
    setEstadisticas(stats);
  } catch (error) {
    console.error('Error recargando estadísticas:', error);
  } finally {
    setLoading(false);
  }
};

  const [user, setUser] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [reportesRecientes, setReportesRecientes] = useState<Reporte[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Función para cerrar sesión
 
  useEffect(() => {
    // Verificar sesión con Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      cargarDatosDashboard();
      
    };

    checkSession();
  }, [router]);
const navigateWithLoading = (path: string) => {
  setLoading(true);
  router.push(path);
};

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener datos del usuario desde Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Cargar datos en paralelo
      const [usuarioData, reportesData, statsData] = await Promise.allSettled([
        UsuarioService.obtenerMiPerfil(),
        ReporteService.obtenerMisReportes(),
        ReporteService.obtenerEstadisticas()
      ]);

      // Procesar datos del usuario
      if (usuarioData.status === 'fulfilled') {
        setUsuario(usuarioData.value);
      } else {
        // Usar datos básicos de la sesión
        setUsuario({
          id: user.id,
          email: user.email || '',
          nombre_completo: user.user_metadata?.nombre_completo || 'Usuario',
          cedula: user.user_metadata?.cedula || '',
          rol: user.user_metadata?.rol || 'acm',
          cuenta_activa: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Procesar reportes
      if (reportesData.status === 'fulfilled') {
        setReportesRecientes(reportesData.value.slice(0, 5));
      }

      // Procesar estadísticas
     await recargarEstadisticas();


    } catch (error: any) {
      console.error('Error cargando dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleCrearReporte = () => {
      setLoading(true);

    router.push('/dashboard/crear-reporte');
  };

  const handleBuscarReportes = () => {
      setLoading(true);

    router.push('/dashboard/buscar-reportes');
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs:12 }}>

            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs:12, md:8}}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs:12, md:4}}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Image
                src="/images/logo-acm.png"
                alt="SEGURA EP PRM XVI"
                width={80}
                height={40}
              />
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#213126' }}>
                  Panel de Control
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sistema de Reportes ACM - SEGURA EP PRM XVI
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Información del Usuario */}
    


      {/* Estadísticas y Reportes */}
      <Grid container spacing={3}>
        <Grid size={{ xs:12, md:8}}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Reportes Recientes" />
                <Tab label="Estadísticas" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {reportesRecientes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay reportes recientes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Crea tu primer reporte para comenzar
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCrearReporte}
                  >
                    Crear Primer Reporte
                  </Button>
                </Box>
              ) : (
                <List sx={{ width: '100%' }}>
                  {reportesRecientes.map((reporte, index) => (
                    <Box key={reporte.id}>
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            
                            
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#4f46e5' }}>
                            <DescriptionIcon />
                          </Avatar>
                        </ListItemAvatar>
<ListItemText disableTypography>
  <Box>
    <Typography
      variant="subtitle1"
      component="div"
      sx={{ fontWeight: 600 }}
    >
      Reporte {reporte.id}
    </Typography>

    <Typography
      variant="body2"
      color="text.primary"
      component="div"
    >
      {reporte.zona} - {reporte.distrito} - {reporte.circuito}
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
      component="div"
    >
      {reporte.novedad.substring(0, 100)}...
    </Typography>

    <Typography
      variant="caption"
      color="text.secondary"
      component="div"
    >
      {formatFecha(reporte.created_at)}
    </Typography>
  </Box>
</ListItemText>


                      </ListItem>
                      {index < reportesRecientes.length - 1 && <Divider variant="inset" component="li" />}
                    </Box>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {estadisticas ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6}}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h3" align="center" sx={{ fontWeight: 600 }}>
                        {estadisticas.total || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Total de Reportes
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6}}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h3" align="center" sx={{ fontWeight: 600 }}>
                        {Object.keys(estadisticas.por_zona || {}).length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Zonas Cubiertas
                      </Typography>
                    </Card>
                  </Grid>
                  {estadisticas.por_zona && (
                    <Grid size={{ xs:12 }}>

                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Reportes por Zona
                      </Typography>
                      {Object.entries(estadisticas.por_zona).map(([zona, cantidad]: [string, any]) => (
                        <Box key={zona} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{zona}</Typography>
                            <Typography variant="body2">{cantidad}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(cantidad / estadisticas.total) * 100} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography color="text.secondary">No hay estadísticas disponibles</Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actividad Reciente
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#10b981' }}>
                      <AddIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Primer inicio de sesión"
                    secondary={`Hoy, ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#f59e0b' }}>
                      <NotificationsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Bienvenido al sistema"
                    secondary="Sistema de Reportes ACM activado"
                  />
                </ListItem>
              </List>
            </TabPanel>
          </Paper>
        </Grid>

<Grid size={{ xs: 12, md: 4 }}>
  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
      Acciones Rápidas
    </Typography>

    <List>
      <ListItemButton
        onClick={() => navigateWithLoading('/dashboard/crear-reporte?tipo=rapido')}
        sx={{ borderRadius: 1, mb: 1 }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: '#4f46e5', width: 32, height: 32 }}>
            <AddIcon fontSize="small" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Reporte Rápido"
          secondary="Crear reporte básico"
        />
      </ListItemButton>

      <ListItemButton
        onClick={handleBuscarReportes}
        sx={{ borderRadius: 1, mb: 1 }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}>
            <SearchIcon fontSize="small" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Buscar reportes"
          secondary="Filtros detallados"
        />
      </ListItemButton>

      <ListItemButton
        onClick={() => navigateWithLoading('/dashboard/leyes-normas')}
        sx={{ borderRadius: 1, mb: 1 }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: '#f59e0b', width: 32, height: 32 }}>
            <GavelIcon fontSize="small" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Consultar Leyes"
          secondary="Legislación aplicable"
        />
      </ListItemButton>

      <ListItemButton
        onClick={() => navigateWithLoading('/dashboard/hoja-vida')}
        sx={{ borderRadius: 1 }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
            <DescriptionIcon fontSize="small" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Mi Hoja de Vida"
          secondary="Actualizar perfil"
        />
      </ListItemButton>
    </List>


            <Divider sx={{ my: 3 }} />

           
          </Paper>
        </Grid>
      </Grid>
{loading && (
  <Box
    sx={{
      position: 'fixed',
      inset: 0,
      bgcolor: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}
  >
    <Paper
      elevation={6}
      sx={{
        p: 4,
        borderRadius: 2,
        textAlign: 'center'
      }}
    >
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography fontWeight={600}>
        Cargando módulo…
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Por favor espere
      </Typography>
    </Paper>
  </Box>
)}

    </Container>
  );
}