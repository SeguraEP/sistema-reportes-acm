//frontend/src/services/usuario.service.ts

import api from '@/lib/axios';

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  cedula: string;
  rol: string;
  telefono?: string;
  fecha_ingreso?: string;
  cargo?: string;
  anio_graduacion?: number;
  cuenta_activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface HojaVida {
  id: string;
  usuario_id: string;
  datos_personales: {
    nombres_completos: string;
    cedula: string;
    fecha_nacimiento?: string;
    lugar_nacimiento?: string;
    nacionalidad?: string;
    estado_civil?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  formacion_academica: Array<{
    nivel: string;
    institucion?: string;
    titulo?: string;
    anio_inicio?: string;
    anio_fin?: string;
    finalizado: boolean;
    anio_graduacion?: string;
  }>;
  experiencia_laboral: Array<{
    empresa: string;
    cargo: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    funciones: string[];
    logros: string[];
  }>;
  cursos_capacitaciones: Array<{
    nombre: string;
    institucion?: string;
    duracion?: string;
    año?: string;
  }>;
  habilidades: {
    tecnicas: string[];
    blandas: string[];
    idiomas: Array<{
      idioma: string;
      nivel: string;
    }>;
  };
  referencias: Array<{
    nombre: string;
    relacion: string;
    telefono?: string;
    email?: string;
  }>;
  informacion_adicional: {
    disponibilidad_viajar: boolean;
    licencia_conducir: string;
    tipo_licencia: string;
    discapacidad: boolean;
    tipo_discapacidad: string;
  };
  created_at: string;
  updated_at: string;
  usuario?: Usuario;
}

export const UsuarioService = {
  // Obtener perfil del usuario actual
  async obtenerMiPerfil(): Promise<Usuario> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  // Actualizar perfil
  async actualizarPerfil(data: Partial<Usuario>): Promise<Usuario> {
    const response = await api.put('/auth/profile', data);
    return response.data.data;
  },

  // Cambiar contraseña
  async cambiarContrasena(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
  },

  // Obtener todos los usuarios (admin)
  async obtenerUsuarios(): Promise<Usuario[]> {
    const response = await api.get('/usuarios');
    return response.data.data;
  },

  // Obtener usuario por ID
  async obtenerUsuario(id: string): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}`);
    return response.data.data.usuario;
  },

  // Buscar usuarios (admin)
  async buscarUsuarios(filtros: any): Promise<Usuario[]> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await api.get(`/usuarios/buscar?${params.toString()}`);
    return response.data.data;
  },

  // Guardar hoja de vida
  async guardarHojaVida(data: Partial<HojaVida>): Promise<HojaVida> {
    const response = await api.post('/hojas-vida', data);
    return response.data.data;
  },

  // Obtener mi hoja de vida
  async obtenerMiHojaVida(): Promise<{
    hoja_vida: HojaVida | null;
    estructura_inicial?: any;
    usuario_info?: Usuario;
  }> {
    const response = await api.get('/hojas-vida/mi-hoja-vida');
    return response.data.data;
  },

  // Obtener hoja de vida de usuario (admin)
  async obtenerHojaVidaUsuario(usuarioId: string): Promise<HojaVida> {
    const response = await api.get(`/hojas-vida/usuario/${usuarioId}`);
    return response.data.data;
  },

  // Descargar hoja de vida como PDF
  async descargarHojaVidaPDF(usuarioId: string): Promise<Blob> {
    const response = await api.get(`/hojas-vida/usuario/${usuarioId}/descargar-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Descargar hoja de vida como Word
  async descargarHojaVidaWord(usuarioId: string): Promise<Blob> {
    const response = await api.get(`/hojas-vida/usuario/${usuarioId}/descargar-word`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Exportar hoja de vida en múltiples formatos
  async exportarHojaVida(usuarioId: string, formatos: string[]): Promise<any> {
    const response = await api.post(`/hojas-vida/usuario/${usuarioId}/exportar`, {
      formatos
    });
    return response.data.data;
  },

  // Generar plantilla de hoja de vida
  async generarPlantillaHojaVida(): Promise<any> {
    const response = await api.get('/hojas-vida/generar-plantilla');
    return response.data.data;
  },

  // Verificar disponibilidad de email
  async verificarEmailDisponible(email: string): Promise<{ disponible: boolean }> {
    const response = await api.get(`/usuarios/verificar-email?email=${encodeURIComponent(email)}`);
    return response.data.data;
  },

  // Verificar disponibilidad de cédula
  async verificarCedulaDisponible(cedula: string): Promise<{ disponible: boolean }> {
    const response = await api.get(`/usuarios/verificar-cedula?cedula=${encodeURIComponent(cedula)}`);
    return response.data.data;
  },

  // Solicitar reactivación de cuenta
  async solicitarReactivacion(email: string): Promise<void> {
    await api.post('/auth/solicitar-reactivacion', { email });
  },

  // Recuperar contraseña
  async recuperarContrasena(email: string, nuevaContrasena: string, confirmarContrasena: string): Promise<void> {
    await api.post('/auth/recuperar-contrasena', {
      email,
      nueva_contrasena: nuevaContrasena,
      confirmar_contrasena: confirmarContrasena
    });
  },
};