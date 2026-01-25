//frontend/src/app/(public)/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Divider,
  ListItemButton
} from '@mui/material';

import {
  Description as DescriptionIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassBottom as HourglassBottomIcon
} from '@mui/icons-material';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: 'loading' as 'loading' | 'ok' | 'error',
    database: 'loading' as 'loading' | 'ok' | 'error',
    storage: 'loading' as 'loading' | 'ok' | 'error'
  });

  const navigateWithLoading = (path: string) => {
    setLoading(true);
    router.push(path);
  };

  const checkSystem = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health?ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Backend no responde');
      const data = await res.json();
      setSystemStatus({
        backend: data.backend === 'ok' ? 'ok' : 'error',
        database: data.database === 'ok' ? 'ok' : 'error',
        storage: data.storage === 'ok' ? 'ok' : 'error'
      });
    } catch {
      setSystemStatus({ backend: 'error', database: 'error', storage: 'error' });
    }
  };

  useEffect(() => {
    checkSystem();
    const interval = setInterval(checkSystem, 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSystem();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', position: 'relative', overflow: 'hidden' }}>
      {/* Fondo institucional */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          backgroundImage: "url('/images/3.jpg')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* HEADER */}
      <Container sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mt: 8 }}>
        <Image src="/images/5.jpg" alt="Municipio de Guayaquil" width={520} height={160} style={{ margin: '0 auto' }} priority />
        <Typography variant="h4" fontWeight={800} mt={4}>
          SEGURA EP – PRM XVI
        </Typography>
        <Typography color="text.secondary" mt={1}>
          Sistema de Reportes del Cuerpo de Agentes de Control Municipal
        </Typography>
      </Container>

      {/* SECCION INICIAR SESIÓN */}
      <Container sx={{ mt: 6, position: 'relative', zIndex: 1 }}>
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">
            Inicia sesión para acceder a todas las funcionalidades
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigateWithLoading('/login')}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={() => navigateWithLoading('/register')}
            >
              Registrarse
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* INFO CARDS */}
      <Container sx={{ mt: 8, mb: 6, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          <InfoCardMui icon={<DescriptionIcon />} title="Reportes Operativos" />
          <InfoCardMui icon={<SearchIcon />} title="Búsqueda de Reportes" />
          <InfoCardMui icon={<PersonIcon />} title="Hoja de Vida Digital" />
          <InfoCardMui icon={<GavelIcon />} title="Leyes y Normativas" />
        </Grid>
      </Container>

      {/* SECCION USO PUBLICO */}
      <Container sx={{ mt: 6, position: 'relative', zIndex: 1 }}>
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">
            Funcionalidades disponibles sin iniciar sesión
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs:12, sm:6}}>
              <ListItemButton onClick={() => navigateWithLoading('/crear-reporte')} sx={{ borderRadius: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#4f46e5' }}>
                    <AddIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Reporte Rápido"
                  secondary="Crear reporte básico"
                />
              </ListItemButton>
            </Grid>
            <Grid size={{ xs:12, sm:6}}>
              <ListItemButton onClick={() => navigateWithLoading('/buscar-reportes')} sx={{ borderRadius: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#0284c7' }}>
                    <SearchIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Buscar Reportes"
                  secondary="Consulta pública de reportes"
                />
              </ListItemButton>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* ESTADO DEL SISTEMA */}
      <Container sx={{ mb: 8, position: 'relative', zIndex: 1 }}>
        <Paper elevation={4} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
          <Typography variant="h6" fontWeight={600} mb={2} align="center">
            Estado del Sistema
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2} align="center">
            El sistema puede tardar entre 2 y 10 minutos en iniciar correctamente
          </Typography>

          <List>
            <SystemStatusMui label="Conexión con Backend" state={systemStatus.backend} />
            <SystemStatusMui label="Base de Datos" state={systemStatus.database} />
            <SystemStatusMui label="Storage de Archivos" state={systemStatus.storage} />
          </List>
        </Paper>
      </Container>

   {/* IMAGEN FINAL - FOOTER */}
      <Box
        sx={{
          mt: 8,
          mb: 4,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            width: { xs: '90%', sm: '70%', md: '50%' },
            height: 'auto',
            backgroundImage: "url('/images/4.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            aspectRatio: '16/9' // mantiene proporción responsive
          }}
        />
      </Box>

      {/* LOADING */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <CircularProgress size={80} />
        </Box>
      )}
    </Box>
  );
}

/* ===================== COMPONENTES ===================== */
function InfoCardMui({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Grid size={{ xs:12, sm:6, md:3}}>
      <Card
        elevation={3}
        sx={{
          height: '100%',
          textAlign: 'center',
          transition: '0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}
      >
        <CardContent>
          <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Typography fontWeight={600}>{title}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

function SystemStatusMui({ label, state }: { label: string; state?: 'loading' | 'ok' | 'error' }) {
  const config = {
    loading: { label: 'Verificando', color: 'warning' as const, icon: <HourglassBottomIcon /> },
    ok: { label: 'Operativo', color: 'success' as const, icon: <CheckCircleIcon /> },
    error: { label: 'Sin conexión', color: 'error' as const, icon: <ErrorIcon /> }
  };

  const safeState: 'loading' | 'ok' | 'error' = state && config[state] ? state : 'loading';

  return (
    <ListItem
      secondaryAction={
        <Chip icon={config[safeState].icon} label={config[safeState].label} color={config[safeState].color} size="small" />
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${config[safeState].color}.light` }}>{config[safeState].icon}</Avatar>
      </ListItemAvatar>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14 }} />
    </ListItem>
  );
}
