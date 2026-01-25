//backend/controladores/authController.js

const { supabase } = require('../config/conexion');
const UsuarioModel = require('../modelos/UsuarioModel');
const bcrypt = require('bcrypt');
const { supabaseAdmin } = require('../config/supabaseAdmin');
class AuthController {
  
  // Login de usuario
static async login(req, res) {
  try {
    const { email, password } = req.body;

    console.log('Procesando login para:', email);

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // 1. Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.error('Error de autenticación:', authError.message);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('Autenticación exitosa, usuario ID:', authData.user.id);

    // 2. Obtener información adicional de nuestra tabla
    const usuario = await UsuarioModel.obtenerPorId(authData.user.id);
    
    if (!usuario) {
      console.error('Usuario no encontrado en tabla local:', authData.user.id);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en el sistema'
      });
    }

    // 3. Verificar si cuenta está activa
    if (!usuario.cuenta_activa) {
      console.log('Cuenta inactiva:', email);
      return res.status(401).json({
        success: false,
        message: 'Cuenta inactiva. Contacte al administrador.'
      });
    }

    // 4. Generar token JWT manualmente (opcional)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        cedula: usuario.cedula,
        rol: usuario.rol
      },
      process.env.JWT_SECRET || 'tu_secreto_seguro',
      { expiresIn: '24h',algorithm: 'HS256' }
    );

    console.log('Login exitoso para:', usuario.email);

    // 5. Preparar respuesta
    const responseData = {
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre_completo: usuario.nombre_completo,
          cedula: usuario.cedula,
          rol: usuario.rol,
          cargo: usuario.cargo,
          telefono: usuario.telefono,
          fecha_ingreso: usuario.fecha_ingreso,
          anio_graduacion: usuario.anio_graduacion,
          cuenta_activa: usuario.cuenta_activa
        },
        session: authData.session, // Incluir sesión de Supabase
        token: token, // Token JWT adicional
        expires_at: authData.session.expires_at
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error en login:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
} 
static async register(req, res) {
  try {
    const {
      email,
      password,
      nombre_completo,
      cedula,
      telefono,
      fecha_ingreso,
      cargo,
      anio_graduacion
    } = req.body;

    console.log('Procesando registro para:', email);

    // Validar campos obligatorios
    if (!email || !password || !nombre_completo || !cedula) {
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios faltantes'
      });
    }

    // TODOS los nuevos registros serán admin por defecto
    const rol = 'admin'; // Fuerza el rol admin para todos

    // ==================== VALIDACIÓN DE CÉDULA Y EMAIL ====================
    
    // 1. Verificar si email ya existe en nuestra base de datos
    const emailExistente = await UsuarioModel.obtenerPorEmail(email);
    if (emailExistente) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado en el sistema. Por favor use otro email.',
        campo: 'email'
      });
    }

    // 2. Verificar si cédula ya existe en nuestra base de datos
    const { data: cedulaExistente, error: cedulaError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre_completo')
      .eq('cedula', cedula)
      .maybeSingle();

    if (cedulaError && cedulaError.code !== 'PGRST116') {
      throw cedulaError;
    }

    if (cedulaExistente) {
      return res.status(409).json({
        success: false,
        message: `La cédula ${cedula} ya está registrada a nombre de ${cedulaExistente.nombre_completo}. Por favor verifique su cédula.`,
        campo: 'cedula',
        usuario_existente: {
          nombre: cedulaExistente.nombre_completo,
          email: cedulaExistente.email
        }
      });
    }

    console.log('Verificaciones de cédula y email completadas. Creando usuario...');

    // ==================== CREAR USUARIO EN SUPABASE AUTH ====================

    console.log('Creando usuario en Supabase Auth...');
    let authUser = null;

    // 1️⃣ Crear usuario en Supabase Authentication
    const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre_completo: nombre_completo,
        cedula: cedula,
        rol: rol // Siempre admin
      }
    });

    if (authError) {
      console.error('Error creando usuario en Auth:', authError);
      
      // Si el usuario ya existe en Auth, intentar obtenerlo
      if (authError.message.includes('already registered')) {
        console.log('Usuario ya existe en Auth, buscando...');
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          filter: `email=eq.${email}`
        });
        
        if (listError || !users || users.length === 0) {
          throw new Error('Usuario ya existe pero no se pudo recuperar');
        }
        
        authUser = users[0];
      } else {
        throw authError;
      }
    } else {
      authUser = createdUser.user;
      console.log('Usuario creado en Auth:', authUser.id);
    }

    // Validar que authUser esté definido
    if (!authUser) {
      throw new Error('No se pudo obtener el usuario de Auth');
    }

    // ==================== CREAR USUARIO EN NUESTRA TABLA ====================

    // 2️⃣ Hash de contraseña para nuestra tabla
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Preparar datos del usuario para nuestra tabla
    const usuarioData = {
      id: authUser.id,
      email: email,
      password: hashedPassword,
      nombre_completo: nombre_completo.toUpperCase(),
      cedula: cedula,
      rol: rol, // Siempre admin
      telefono: telefono || null,
      fecha_ingreso: fecha_ingreso || null,
      cargo: cargo || null,
      anio_graduacion: anio_graduacion || null,
      cuenta_activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4️⃣ Guardar en nuestra tabla usuarios
    console.log('Guardando usuario en tabla local...');
    const { data: usuarioTabla, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert([usuarioData])
      .select()
      .single();

    if (dbError) {
      console.error('Error insertando en tabla usuarios:', dbError);
      
      // Si falla, intentar limpiar el usuario de Auth
      if (authUser && authUser.id) {
        console.log('Limpiando usuario de Auth debido a error en DB...');
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        } catch (deleteError) {
          console.error('Error al limpiar usuario de Auth:', deleteError);
        }
      }
      
      throw dbError;
    }

    console.log('Usuario creado exitosamente:', usuarioTabla.id);

    // ==================== RESPUESTA EXITOSA ====================

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente como administrador. Por favor inicie sesión.',
      data: {
        user: {
          id: usuarioTabla.id,
          email: usuarioTabla.email,
          nombre_completo: usuarioTabla.nombre_completo,
          cedula: usuarioTabla.cedula,
          rol: usuarioTabla.rol
        }
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    let errorMessage = 'Error al registrar usuario';
    let statusCode = 500;
    
    if (error.message.includes('already registered')) {
      errorMessage = 'El email ya está registrado en el sistema';
      statusCode = 409;
    } else if (error.message.includes('cedula')) {
      errorMessage = 'La cédula ya está registrada en el sistema';
      statusCode = 409;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
}
 // Obtener perfil de usuario
static async getProfile(req, res) {
  try {
    // Verificar si hay usuario autenticado
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const usuarioId = req.usuario.id;

    const usuario = await UsuarioModel.obtenerPorId(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Omitir información sensible
    const { password, ...usuarioSeguro } = usuario;

    res.json({
      success: true,
      data: usuarioSeguro
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
}

  // Actualizar perfil
  static async updateProfile(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const updates = req.body;

      // Campos que no se pueden actualizar
      const camposProhibidos = ['id', 'email', 'cedula', 'rol', 'password', 'cuenta_activa'];
      camposProhibidos.forEach(campo => delete updates[campo]);

      const usuarioActualizado = await UsuarioModel.actualizar(usuarioId, updates);

      const { password, ...usuarioSeguro } = usuarioActualizado;

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: usuarioSeguro
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validar campos
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario actual
      const usuario = await UsuarioModel.obtenerPorId(usuarioId);

      // Verificar contraseña actual con Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: currentPassword
      });

      if (authError) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña en Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Actualizar contraseña en nuestra tabla
      await UsuarioModel.actualizarPassword(usuarioId, newPassword);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña'
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token es requerido'
        });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        console.error('Error refrescando token:', error);
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada, por favor inicia sesión nuevamente'
        });
      }

      console.log('Token refrescado exitosamente');

      res.json({
        success: true,
        message: 'Token refrescado',
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });

    } catch (error) {
      console.error('Error en refreshToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar sesión
static async verifySession(req, res) {
  try {
    // authenticateToken ya agregó req.usuario
    const usuario = req.usuario;
    
    if (!usuario.cuenta_activa) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // Omitir password
    const { password, ...usuarioSeguro } = usuario;

    res.json({
      success: true,
      data: {
        user: usuarioSeguro
      }
    });
  } catch (error) {
    console.error('Error verificando sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}


  // Recuperar cuenta inactiva
  static async solicitarReactivacion(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      // Verificar si usuario existe
      const usuario = await UsuarioModel.obtenerPorEmail(email);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró cuenta con este email'
        });
      }

      // Verificar si cuenta ya está activa
      if (usuario.cuenta_activa) {
        return res.status(400).json({
          success: false,
          message: 'La cuenta ya está activa'
        });
      }

      // Generar token de reactivación
      const tokenReactivacion = require('crypto').randomBytes(32).toString('hex');
      
      // Guardar token en base de datos (expira en 24 horas)
      await supabase
        .from('tokens_reactivacion')
        .insert([{
          usuario_id: usuario.id,
          token: tokenReactivacion,
          expira_en: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }]);

      // Enviar email de reactivación (simulado)
      console.log(`Enlace de reactivación para ${email}: http://localhost:3000/reactivar-cuenta?token=${tokenReactivacion}`);

      res.json({
        success: true,
        message: 'Se ha enviado un enlace de reactivación a tu email'
      });

    } catch (error) {
      console.error('Error solicitando reactivación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al solicitar reactivación'
      });
    }
  }

  // Reactivar cuenta con token
  static async reactivarCuenta(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token es requerido'
        });
      }

      // Buscar token válido
      const { data: tokenData, error } = await supabase
        .from('tokens_reactivacion')
        .select('*')
        .eq('token', token)
        .gt('expira_en', new Date().toISOString())
        .single();

      if (error || !tokenData) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      // Reactivar cuenta
      await UsuarioModel.reactivarCuenta(tokenData.usuario_id);

      // Eliminar token usado
      await supabase
        .from('tokens_reactivacion')
        .delete()
        .eq('id', tokenData.id);

      res.json({
        success: true,
        message: 'Cuenta reactivada exitosamente'
      });

    } catch (error) {
      console.error('Error reactivando cuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reactivar cuenta'
      });
    }
  }

  // Recuperar contraseña
    static async recuperarContrasena(req, res) {
    try {
      const { email, nueva_contrasena, confirmar_contrasena } = req.body;

      console.log('Recuperando contraseña para:', email);

      // Validar campos
      if (!email || !nueva_contrasena || !confirmar_contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      if (nueva_contrasena !== confirmar_contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden'
        });
      }

      if (nueva_contrasena.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // 1. Verificar si usuario existe en nuestra tabla
      const usuario = await UsuarioModel.obtenerPorEmail(email);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró cuenta con este email'
        });
      }

      // 2. Verificar si cuenta está activa
      if (!usuario.cuenta_activa) {
        return res.status(400).json({
          success: false,
          message: 'Cuenta inactiva. Contacte al administrador.'
        });
      }

      console.log('Usuario encontrado:', usuario.id);

      // 3. Obtener sesión temporal para poder actualizar contraseña
      // Primero intentamos iniciar sesión con la contraseña actual si existe
      let authUser = null;
      
      // Intentar obtener usuario de Supabase Auth por email
      const { data: authData, error: authListError } = await supabase.auth.admin.listUsers();
      
      if (!authListError && authData) {
        // Buscar usuario por email
        const userInAuth = authData.users.find(u => u.email === email);
        if (userInAuth) {
          authUser = userInAuth;
        }
      }

      // Si no encontramos al usuario en Auth, lo creamos
      if (!authUser) {
        console.log('Usuario no encontrado en Auth, intentando crear...');
        
        // Intentar obtener o crear usuario en Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: usuario.email,
          password: nueva_contrasena,
          email_confirm: true
        });

        if (signUpError) {
          console.error('Error creando usuario en Auth:', signUpError);
          // Si el usuario ya existe, intentamos actualizar la contraseña
          if (signUpError.message.includes('already registered')) {
            // Usamos el admin API para actualizar la contraseña
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              usuario.id,
              { password: nueva_contrasena }
            );

            if (updateError) {
              console.error('Error actualizando contraseña:', updateError);
              throw updateError;
            }
          } else {
            throw signUpError;
          }
        } else {
          authUser = signUpData.user;
        }
      } else {
        // Usuario existe en Auth, actualizamos la contraseña
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { password: nueva_contrasena }
        );

        if (updateError) {
          console.error('Error actualizando contraseña en Auth:', updateError);
          throw updateError;
        }
      }

      // 4. Actualizar contraseña en nuestra tabla
      await UsuarioModel.actualizarPassword(usuario.id, nueva_contrasena);

      console.log('Contraseña actualizada exitosamente para:', email);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
      });

    } catch (error) {
      console.error('Error recuperando contraseña:', error);
      
      let errorMessage = 'Error al recuperar contraseña';
      if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }
}

module.exports = AuthController;