//frontend/src/components/usuarios/TopMenu.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Avatar, Chip, Tooltip } from '@mui/material';
import { Logout as LogoutIcon, Add as AddIcon, Refresh as RefreshIcon, Person as PersonIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { UsuarioService, type Usuario } from '@/services/usuario.service';

export default function TopMenu() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Cargar usuario al iniciar
  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const perfil = await UsuarioService.obtenerMiPerfil();
        setUsuario(perfil);
      } catch {
        // fallback básico
        const { data: { user } } = await supabase.auth.getUser();
        setUsuario({
          id: user?.id || '',
          email: user?.email || 'N/A',
          nombre_completo: user?.user_metadata?.nombre_completo || 'Usuario',
          cedula: user?.user_metadata?.cedula || 'N/A',
          rol: user?.user_metadata?.rol || 'ACM',
          cuenta_activa: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    };

    cargarUsuario();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNuevoReporte = () => {
    router.push('/dashboard/crear-reporte');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white', zIndex: 1000 }}>
      
      {/* Información del Usuario */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#4f46e5', width: 48, height: 48 }}>
          {usuario?.nombre_completo?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Rol: ${usuario?.rol?.toUpperCase() || 'ACM'}`} color="primary" size="small" />
            <Chip label={`Cédula: ${usuario?.cedula || 'N/A'}`} size="small" variant="outlined" />
            <Chip label={`Email: ${usuario?.email || 'N/A'}`} size="small" variant="outlined" />
          </Box>
        </Box>
      </Box>

      {/* Botones */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        
        <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleCerrarSesion}>
          Cerrar Sesión
        </Button>
      </Box>
    </Box>
  );
}
