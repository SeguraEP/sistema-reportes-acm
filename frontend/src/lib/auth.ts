//frontend/src/lib/auth.ts
import { supabase } from './supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre_completo: string;
  cedula: string;
  rol: string;
  telefono?: string;
  fecha_ingreso?: string;
  cargo?: string;
  anio_graduacion?: number;
}

export const authService = {
  // Login
  async login(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) throw error;
    return data;
  },

  // Registro
  async register(userData: RegisterData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nombre_completo: userData.nombre_completo,
          cedula: userData.cedula,
          rol: userData.rol
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener sesión actual
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Refrescar sesión
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  },

  // Verificar si el usuario está autenticado
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  },

  // Cambiar contraseña
  async changePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  // Recuperar contraseña
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return data;
  }
};