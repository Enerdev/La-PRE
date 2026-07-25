const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(username, password) {
  const { rows } = await pool.query(
    `SELECT id_usuario, username, password_hash, rol, sede_id, estudiante_id, estado
     FROM usuario WHERE username = $1`,
    [username]
  );

  // Mensaje genérico: nunca revelar si falló el usuario o la contraseña (PS-01)
  const genericError = { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };

  if (rows.length === 0) return genericError;

  const usuario = rows[0];
  if (usuario.estado !== 'activo') return genericError;

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) return genericError;

  const token = jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      rol: usuario.rol,
      sede_id: usuario.sede_id,
      estudiante_id: usuario.estudiante_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return { ok: true, token, rol: usuario.rol };
}

async function registrarEstudiante({ dni, nombres, apellidos, email, username, password, sedeId }) {
  if (!dni || !nombres || !apellidos || !username || !password) {
    return { ok: false, mensaje: 'DNI, Nombres, Apellidos, Usuario y Contraseña son obligatorios.' };
  }

  if (password.length < 8) {
    return { ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  // Verificar si el username ya está en uso
  const userCheck = await pool.query('SELECT id_usuario FROM usuario WHERE username = $1', [username]);
  if (userCheck.rows.length > 0) {
    return { ok: false, mensaje: 'El nombre de usuario ya está registrado por otro usuario.' };
  }

  // Verificar si el estudiante existe por DNI
  let estudianteId;
  const estudianteCheck = await pool.query('SELECT id_estudiante, sede_id FROM estudiante WHERE dni = $1', [dni]);

  if (estudianteCheck.rows.length > 0) {
    estudianteId = estudianteCheck.rows[0].id_estudiante;
    const usuarioEstudianteCheck = await pool.query('SELECT id_usuario FROM usuario WHERE estudiante_id = $1', [estudianteId]);
    if (usuarioEstudianteCheck.rows.length > 0) {
      return { ok: false, mensaje: 'Ya existe una cuenta asociada a este DNI. Por favor inicia sesión.' };
    }
  } else {
    // Si no existe, crear el registro del estudiante
    const defaultSede = sedeId || 1;
    const resEst = await pool.query(
      `INSERT INTO estudiante (nombres, apellidos, dni, email, sede_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_estudiante`,
      [nombres, apellidos, dni, email || null, defaultSede]
    );
    estudianteId = resEst.rows[0].id_estudiante;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const estData = await pool.query('SELECT sede_id FROM estudiante WHERE id_estudiante = $1', [estudianteId]);
  const userSedeId = estData.rows[0]?.sede_id || 1;

  await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id, estudiante_id)
     VALUES ($1, $2, 'estudiante', $3, $4)`,
    [username, passwordHash, userSedeId, estudianteId]
  );

  return { ok: true, mensaje: '¡Cuenta de estudiante registrada con éxito! Ya puedes iniciar sesión.' };
}

module.exports = { login, registrarEstudiante };

