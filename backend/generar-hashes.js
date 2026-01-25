// backend/generar-hashes.js

require('dotenv').config();
const { supabaseAdmin } = require('./config/supabaseAdmin'); // Tu cliente admin
const bcrypt = require('bcrypt');

const usuarios = [
  { email: 'admin@seguraep.gob.ec', password: 'Admin123', nombre_completo: 'ADMINISTRADOR SISTEMA', cedula: '9999999999', rol: 'admin', telefono: '0999999999', fecha_ingreso: null, cargo: 'Administrador del Sistema', anio_graduacion: null },
  { email: 'acm1@seguraep.gob.ec', password: 'Acm12345', nombre_completo: 'Juan Carlos Pérez', cedula: '0912345678', rol: 'acm', telefono: '0991112233', fecha_ingreso: '2019-03-15', cargo: 'Agente de Control Municipal', anio_graduacion: 2018 },
  { email: 'jefe.patrulla@seguraep.gob.ec', password: 'Jefe12345', nombre_completo: 'Luis Alberto Gómez', cedula: '0923456789', rol: 'jefe_patrulla', telefono: '0992223344', fecha_ingreso: '2015-08-01', cargo: 'Jefe de Patrulla', anio_graduacion: 2012 },
  { email: 'supervisor@seguraep.gob.ec', password: 'Super12345', nombre_completo: 'María Fernanda Ruiz', cedula: '0934567890', rol: 'supervisor', telefono: '0993334455', fecha_ingreso: '2013-01-10', cargo: 'Supervisora Operativa', anio_graduacion: 2010 },
  { email: 'admin2@seguraep.gob.ec', password: 'Admin12345', nombre_completo: 'Administrador General', cedula: '0945678901', rol: 'admin', telefono: '0994445566', fecha_ingreso: '2010-05-20', cargo: 'Administrador del Sistema', anio_graduacion: null }
];

async function crearUsuarios() {
  for (const u of usuarios) {
    try {
      console.log(`\n--- Procesando ${u.email} ---`);

      let authUser;

      // 1️⃣ Intentar crear usuario en Auth
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true
      });

      if (createError) {
        // Si ya existe, buscar usuario por email usando listUsers
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          limit: 1,
          filter: `email=eq.${u.email}`
        });
        if (listError) throw listError;
        if (!users || users.length === 0) throw new Error('Usuario no encontrado en Auth');
        authUser = users[0];
        console.log('Usuario ya existe en Auth, usando id existente:', u.email);
      } else {
        authUser = createdUser.user || createdUser.data?.user;
        console.log('Usuario creado en Auth:', u.email);
      }

      // 2️⃣ Insertar o actualizar en tabla "usuarios" con upsert
      const hashPassword = bcrypt.hashSync(u.password, 10);

      const { error: upsertError } = await supabaseAdmin
        .from('usuarios')
        .upsert([{
          id: authUser.id,
          email: u.email,
          password: hashPassword,
          nombre_completo: u.nombre_completo,
          cedula: u.cedula,
          rol: u.rol,
          telefono: u.telefono || null,
          fecha_ingreso: u.fecha_ingreso || null,
          cargo: u.cargo || null,
          anio_graduacion: u.anio_graduacion || null,
          cuenta_activa: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { onConflict: ['id'] });

      if (upsertError) console.error('❌ Error insertando/upsert en tabla usuarios:', upsertError);
      else console.log('✅ Insertado/actualizado en tabla usuarios:', u.email);

    } catch (err) {
      console.error(`❌ Error procesando ${u.email}:`, err.message);
    }
  }

  console.log('\n✅ Proceso terminado.');
}

// Ejecutar
crearUsuarios();
