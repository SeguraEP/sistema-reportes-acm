//frontend/src/app/(auth)/register/page.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Backdrop,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import api from '@/lib/axios';
import { useEffect } from 'react';
import { UsuarioService } from '@/services/usuario.service';

// Esquema de validación con Zod
const registerSchema = z.object({
  email: z.string()
    .email('Email no válido')
    .min(1, 'Email es requerido'),
  password: z.string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  nombre_completo: z.string()
    .min(1, 'Nombre completo es requerido')
    .max(255, 'Nombre muy largo'),
  cedula: z.string()
    .min(10, 'Cédula debe tener 10 dígitos')
    .max(10, 'Cédula debe tener 10 dígitos')
    .regex(/^\d+$/, 'Cédula debe contener solo números'),
  telefono: z.string()
    .optional()
    .refine(val => !val || /^\d+$/.test(val), 'Teléfono debe contener solo números'),
  fecha_ingreso: z.string().optional(),
  cargo: z.string().optional(),
  anio_graduacion: z.string()
    .optional()
    .refine(val => !val || /^\d{4}$/.test(val), 'Año de graduación debe tener 4 dígitos')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailDisponible, setEmailDisponible] = useState<boolean | null>(null);
  const [cedulaDisponible, setCedulaDisponible] = useState<boolean | null>(null);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [verificandoCedula, setVerificandoCedula] = useState(false);
  
  const router = useRouter();
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
    trigger
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const emailValue = watch('email');
  const cedulaValue = watch('cedula');
  useEffect(() => {
  const verificarEmail = async () => {
    if (emailValue && emailValue.length > 3 && emailValue.includes('@')) {
      setVerificandoEmail(true);
      try {
        const response = await UsuarioService.verificarEmailDisponible(emailValue);
        setEmailDisponible(response.disponible);
      } catch (error) {
        console.error('Error verificando email:', error);
        setEmailDisponible(null);
      } finally {
        setVerificandoEmail(false);
      }
    } else {
      setEmailDisponible(null);
    }
  };

  const timeoutId = setTimeout(() => {
    verificarEmail();
  }, 500);

  return () => clearTimeout(timeoutId);
}, [emailValue]);

useEffect(() => {
  const verificarCedula = async () => {
    if (cedulaValue && cedulaValue.length === 10) {
      setVerificandoCedula(true);
      try {
        const response = await UsuarioService.verificarCedulaDisponible(cedulaValue);
        setCedulaDisponible(response.disponible);
      } catch (error) {
        console.error('Error verificando cédula:', error);
        setCedulaDisponible(null);
      } finally {
        setVerificandoCedula(false);
      }
    } else {
      setCedulaDisponible(null);
    }
  };

  const timeoutId = setTimeout(() => {
    verificarCedula();
  }, 500);

  return () => clearTimeout(timeoutId);
}, [cedulaValue]);

 

const onSubmit = async (data: RegisterFormData) => {
  try {
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validaciones adicionales
    if (emailDisponible === false) {
      setError('El email ya está registrado en el sistema. Por favor use otro email.');
      return;
    }

    if (cedulaDisponible === false) {
      setError('La cédula ya está registrada en el sistema. Por favor verifique su cédula.');
      return;
    }

    // Esperar a que las verificaciones terminen
    if (verificandoEmail || verificandoCedula) {
      setError('Por favor espere a que se completen las verificaciones.');
      return;
    }

    console.log('Registrando usuario:', data.email);

    // Registrar en el backend
    const response = await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      nombre_completo: data.nombre_completo.toUpperCase(),
      cedula: data.cedula,
      telefono: data.telefono || null,
      fecha_ingreso: data.fecha_ingreso || null,
      cargo: data.cargo || null,
      anio_graduacion: data.anio_graduacion ? parseInt(data.anio_graduacion) : null
    });

    if (response.data.success) {
      setSuccess('¡Registro exitoso! Ahora eres administrador del sistema. Redirigiendo al login...');
      
      // Mostrar mensaje por 3 segundos y redirigir
      setTimeout(() => {
        router.push('/login?registered=true&email=' + encodeURIComponent(data.email));
      }, 3000);
    } else {
      // Si hay información específica de qué campo está duplicado
      if (response.data.campo === 'email') {
        setError(`Email duplicado: ${response.data.message}`);
        setEmailDisponible(false);
      } else if (response.data.campo === 'cedula') {
        setError(`Cédula duplicada: ${response.data.message}`);
        setCedulaDisponible(false);
      } else {
        setError(response.data.message || 'Error al registrar usuario');
      }
    }
    
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.campo === 'email') {
        setError(`Error en email: ${errorData.message}`);
        setEmailDisponible(false);
      } else if (errorData.campo === 'cedula') {
        setError(`Error en cédula: ${errorData.message}`);
        setCedulaDisponible(false);
        
        // Mostrar información del usuario existente si está disponible
        if (errorData.usuario_existente) {
          setError(`La cédula ya está registrada a nombre de: ${errorData.usuario_existente.nombre} (${errorData.usuario_existente.email})`);
        }
      } else {
        setError(errorData.message || 'Error al registrar usuario');
      }
    } else if (error.message?.includes('Network Error')) {
      setError('Error de conexión. Verifica que el servidor esté ejecutándose.');
    } else {
      setError('Error al registrar usuario. Por favor intenta nuevamente.');
    }
  } finally {
    setIsLoading(false);
  }
};
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      {/* Overlay de carga */}
      <Backdrop
        open={isLoading}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: '#fff',
          flexDirection: 'column',
          display: 'flex',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Registrando usuario...</Typography>
      </Backdrop>

      <Paper
        elevation={24}
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          p: 4,
          width: '100%',
          maxWidth: 800,
          overflow: 'auto',
          maxHeight: '90vh'
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Image
              src="/images/logo-acm.png"
              alt="SEGURA EP PRM XVI"
              width={180}
              height={80}
              style={{ marginBottom: '1rem' }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#213126',
                fontSize: '1.5rem',
              }}
            >
              SEGURA EP PRM XVI
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#9ba39c',
                mt: 1,
              }}
            >
              Sistema de Reportes ACM - Registro
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 600,
              textAlign: 'center',
              mb: 3,
              color: '#213126',
            }}
          >
            Registro de Usuario
          </Typography>
                        
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem'
                }
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem'
                }
              }}
            >
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Información Personal */}
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" sx={{ mb: 2, color: '#4f46e5', borderBottom: '1px solid #e5e7eb', pb: 1 }}>
                Información Personal
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
              <TextField
                {...register('nombre_completo')}
                label="Nombre Completo *"
                placeholder="JUAN PÉREZ GONZÁLEZ"
                fullWidth
                error={!!errors.nombre_completo}
                helperText={errors.nombre_completo?.message}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
    <TextField
    {...register('cedula')}
    label="Cédula *"
    placeholder="0999999999"
    fullWidth
    error={!!errors.cedula || cedulaDisponible === false}
    helperText={
      verificandoCedula 
        ? 'Verificando cédula...' 
        : errors.cedula?.message || 
          (cedulaDisponible === false ? 'Cédula ya registrada' : '')
    }
    disabled={isLoading}
    sx={{ mb: 2 }}
    InputProps={{
      endAdornment: verificandoCedula ? (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      ) : null,
    }}
    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\D/g, ''); // Solo números
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.substring(0, 10);
      }
    }}
  />
</Grid>

<Grid size={{ xs: 12, md: 6 }}>
  <TextField
    {...register('telefono')}
    label="Teléfono"
    placeholder="0999999999"
    fullWidth
    error={!!errors.telefono}
    helperText={errors.telefono?.message}
    disabled={isLoading}
    sx={{ mb: 2 }}
    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    }}
  />
</Grid>



            {/* Información Profesional */}
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" sx={{ mb: 2, color: '#4f46e5', borderBottom: '1px solid #e5e7eb', pb: 1, mt: 2 }}>
                Información Profesional
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
              <TextField
                {...register('cargo')}
                label="Cargo"
                placeholder="Agente de Control Municipal"
                fullWidth
                error={!!errors.cargo}
                helperText={errors.cargo?.message}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
              <TextField
                {...register('fecha_ingreso')}
                label="Fecha de Ingreso"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!errors.fecha_ingreso}
                helperText={errors.fecha_ingreso?.message}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
            </Grid>

<Grid size={{ xs: 12, md: 6 }}>
  <TextField
    {...register('anio_graduacion')}
    label="Año de Graduación"
    placeholder="2020"
    fullWidth
    error={!!errors.anio_graduacion}
    helperText={errors.anio_graduacion?.message}
    disabled={isLoading}
    sx={{ mb: 2 }}
    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    }}
  />
</Grid>

            {/* Credenciales de Acceso */}
            <Grid size={{ xs:12 }}>

              <Typography variant="h6" sx={{ mb: 2, color: '#4f46e5', borderBottom: '1px solid #e5e7eb', pb: 1, mt: 2 }}>
                Credenciales de Acceso
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
  <TextField
    {...register('email')}
    label="Email *"
    placeholder="tu@email.com"
    type="email"
    fullWidth
    error={!!errors.email || emailDisponible === false}
    helperText={
      verificandoEmail 
        ? 'Verificando email...' 
        : errors.email?.message || 
          (emailDisponible === false ? 'Email ya registrado' : '')
    }
    disabled={isLoading}
    sx={{ mb: 2 }}
    InputProps={{
      endAdornment: verificandoEmail ? (
        <InputAdornment position="end">
          <CircularProgress size={20} />
        </InputAdornment>
      ) : null,
    }}
  />
            </Grid>

            <Grid size={{ xs: 12, md: 6}}></Grid> {/* Espacio vacío para alineación */}

            <Grid size={{ xs: 12, md: 6}}>
              <TextField
                {...register('password')}
                label="Contraseña *"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: '#68756b' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6}}>
              <TextField
                {...register('confirmPassword')}
                label="Confirmar Contraseña *"
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={isLoading}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmPassword}
                        edge="end"
                        sx={{ color: '#68756b' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Requisitos de contraseña */}
            <Grid size={{ xs:12 }}>

              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  La contraseña debe cumplir con:
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  • Al menos 6 caracteres<br/>
                  • Al menos una letra mayúscula<br/>
                  • Al menos un número
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading || emailDisponible === false || cedulaDisponible === false}
            sx={{
              backgroundColor: '#4f46e5',
              color: 'white',
              fontSize: '1rem',
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              mt: 2,
              '&:hover': {
                backgroundColor: '#4338ca',
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </Button>

          <Stack direction="column" spacing={1} sx={{ mt: 3, width: '100%' }}>
            <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                style={{
                  color: '#4f46e5',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Inicia sesión aquí
              </Link>
              <Box
              component={Link}
              href="/"
              sx={{
                color: '#000000',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Home
              </Box>
            </Typography>
          </Stack>

          <Box sx={{ mt: 4, textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem' }}>
            <Typography variant="body2">
              © {new Date().getFullYear()} SEGURA EP PRM XVI
            </Typography>
            <Typography variant="caption">
              Todos los derechos reservados
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}