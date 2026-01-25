// frontend/src/app/(auth)/login/page.tsx
'use client';
import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';

// Esquema de validación para login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email no válido'),
  password: z
    .string()
    .min(1, 'Contraseña es requerida')
    .min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

// Esquema de validación para recuperar contraseña
const recuperarSchema = z.object({
  email: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email no válido'),
  nuevaContrasena: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmarContrasena: z.string()
}).refine((data) => data.nuevaContrasena === data.confirmarContrasena, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContrasena"],
});

type LoginFormData = {
  email: string;
  password: string;
};

type RecuperarFormData = {
  email: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
};

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [recuperarLoading, setRecuperarLoading] = useState(false);
  const [recuperarMessage, setRecuperarMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerRecuperar,
    handleSubmit: handleSubmitRecuperar,
    formState: { errors: errorsRecuperar },
    reset: resetRecuperar
  } = useForm<RecuperarFormData>({
    resolver: zodResolver(recuperarSchema)
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Iniciando sesión:', data.email);

      // Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        console.error('Error en autenticación:', authError.message);
        
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas. Por favor verifica tu email y contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          setError('Error al iniciar sesión. Por favor intenta nuevamente.');
        }
        return;
      }

      console.log('Login exitoso. Redirigiendo al dashboard...');
      
      // Redirigir directamente al dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRecuperarSubmit = async (data: RecuperarFormData) => {
    try {
      setRecuperarLoading(true);
      setRecuperarMessage(null);

      console.log('Recuperando contraseña para:', data.email);

      // Llamar directamente al endpoint de la API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/recuperar-contrasena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          nueva_contrasena: data.nuevaContrasena,
          confirmar_contrasena: data.confirmarContrasena
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRecuperarMessage({
          type: 'success',
          text: '¡Contraseña actualizada exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.'
        });

        // Resetear formulario y cerrar modal después de 3 segundos
        resetRecuperar();
        setTimeout(() => {
          setRecuperarOpen(false);
          setRecuperarMessage(null);
        }, 3000);
      } else {
        throw new Error(result.message || 'Error al recuperar contraseña');
      }

    } catch (error: any) {
      console.error('Error recuperando contraseña:', error);
      
      setRecuperarMessage({
        type: 'error',
        text: error.message || 'Error al recuperar contraseña. Verifica que el email sea correcto.'
      });
    } finally {
      setRecuperarLoading(false);
    }
  };

  const handleCloseRecuperar = () => {
    setRecuperarOpen(false);
    setRecuperarMessage(null);
    resetRecuperar();
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
        <Typography variant="body1">Iniciando sesión...</Typography>
      </Backdrop>

      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.3)',
          p: 4,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Logo */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
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
            Sistema de Reportes ACM
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
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: '0.875rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          {...register('email')}
          label="Email"
          placeholder="tu@email.com"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isLoading}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />

        <TextField
          {...register('password')}
          label="Contraseña"
          placeholder="••••••••"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={isLoading}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
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

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          sx={{
            backgroundColor: '#4f46e5',
            color: 'white',
            fontSize: '1rem',
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#4338ca',
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <Stack direction="column" spacing={1} sx={{ mt: 3, width: '100%' }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            ¿No tienes cuenta?{' '}
            <Box
              component={Link}
              href="/register"
              sx={{
                color: '#4f46e5',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Regístrate aquí
            </Box>
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

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Button
              variant="text"
              color="primary"
              onClick={() => setRecuperarOpen(true)}
              disabled={isLoading}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Box>
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

      {/* Modal de Recuperar Contraseña */}
      <Dialog open={recuperarOpen} onClose={handleCloseRecuperar} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Recuperar Contraseña
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tu email y tu nueva contraseña. La contraseña se cambiará inmediatamente.
          </Typography>
          
          {recuperarMessage && (
            <Alert 
              severity={recuperarMessage.type} 
              sx={{ mb: 2 }}
            >
              {recuperarMessage.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmitRecuperar(onRecuperarSubmit)}>
            <TextField
              {...registerRecuperar('email')}
              label="Email de la cuenta"
              type="email"
              fullWidth
              margin="normal"
              error={!!errorsRecuperar.email}
              helperText={errorsRecuperar.email?.message}
              disabled={recuperarLoading}
              placeholder="ejemplo@email.com"
            />

            <TextField
              {...registerRecuperar('nuevaContrasena')}
              label="Nueva Contraseña"
              type={showNuevaPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errorsRecuperar.nuevaContrasena}
              helperText={errorsRecuperar.nuevaContrasena?.message}
              disabled={recuperarLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                      edge="end"
                    >
                      {showNuevaPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...registerRecuperar('confirmarContrasena')}
              label="Confirmar Nueva Contraseña"
              type={showConfirmarPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errorsRecuperar.confirmarContrasena}
              helperText={errorsRecuperar.confirmarContrasena?.message}
              disabled={recuperarLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                      edge="end"
                    >
                      {showConfirmarPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={handleCloseRecuperar} disabled={recuperarLoading}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={recuperarLoading}
              >
                {recuperarLoading ? 'Procesando...' : 'Cambiar Contraseña'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}