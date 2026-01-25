//backend/modelos/UsuarioModel.js

const { supabase } = require('../config/conexion');
const bcrypt = require('bcrypt');
const { supabaseAdmin } = require('../config/supabaseAdmin');
class UsuarioModel {
  
  // Crear usuario
  static async crear(usuarioData) {
    try {
      // Ahora esta función solo inserta si ya tenemos el ID
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .insert([usuarioData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.crear:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  static async obtenerPorId(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.obtenerPorId:', error);
      throw error;
    }
  }

  // Obtener usuario por email
   static async obtenerPorEmail(email) {
  try {
    const { supabaseAdmin } = require('../config/supabaseAdmin');
    
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase().trim()) // Normalizar email
      .maybeSingle();

    if (error) {
      console.error('Error en UsuarioModel.obtenerPorEmail:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en UsuarioModel.obtenerPorEmail:', error);
    return null;
  }
}

  // Actualizar usuario
  static async actualizar(id, updates) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.actualizar:', error);
      throw error;
    }
  }

  // Verificar credenciales
  static async verificarCredenciales(email, password) {
    try {
      // Obtener usuario por email
      const usuario = await this.obtenerPorEmail(email);
      if (!usuario) return null;

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, usuario.password);
      if (!passwordMatch) return null;

      return usuario;
    } catch (error) {
      console.error('Error en UsuarioModel.verificarCredenciales:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios (admin)
  static async obtenerTodos() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en UsuarioModel.obtenerTodos:', error);
      throw error;
    }
  }

  // Actualizar contraseña
  static async actualizarPassword(id, nuevaPassword) {
    try {
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
      
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.actualizarPassword:', error);
      throw error;
    }
  }

  // Desactivar cuenta
  static async desactivarCuenta(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          cuenta_activa: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.desactivarCuenta:', error);
      throw error;
    }
  }

  // Reactivar cuenta
  static async reactivarCuenta(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          cuenta_activa: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en UsuarioModel.reactivarCuenta:', error);
      throw error;
    }
  }

  // Buscar usuarios por criterios
  static async buscar(criterios = {}) {
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (criterios.rol) {
        query = query.eq('rol', criterios.rol);
      }
      if (criterios.cuenta_activa !== undefined) {
        query = query.eq('cuenta_activa', criterios.cuenta_activa);
      }
      if (criterios.nombre) {
        query = query.ilike('nombre_completo', `%${criterios.nombre}%`);
      }
      if (criterios.cedula) {
        query = query.eq('cedula', criterios.cedula);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en UsuarioModel.buscar:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios
  static async obtenerEstadisticas() {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol, cuenta_activa');

      if (error) throw error;

      const estadisticas = {
        total: 0,
        por_rol: {},
        activos: 0,
        inactivos: 0
      };

      if (data) {
        estadisticas.total = data.length;
        
        data.forEach(usuario => {
          // Contar por rol
          estadisticas.por_rol[usuario.rol] = (estadisticas.por_rol[usuario.rol] || 0) + 1;
          
          // Contar activos/inactivos
          if (usuario.cuenta_activa) {
            estadisticas.activos++;
          } else {
            estadisticas.inactivos++;
          }
        });
      }

      return estadisticas;
    } catch (error) {
      console.error('Error en UsuarioModel.obtenerEstadisticas:', error);
      throw error;
    }
  }
}

module.exports = UsuarioModel;