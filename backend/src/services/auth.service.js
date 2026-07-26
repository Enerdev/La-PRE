const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(username, password) {
  const input = username?.trim();

  const genericError = { ok: false, mensaje: 'Usuario o contraseña incorrectos.' };

  const { rows } = await pool.query(
    `SELECT u.id_usuario, u.username, u.password_hash, u.rol, u.sede_id, u.estudiante_id, u.estado
     FROM usuario u
     LEFT JOIN estudiante e ON e.id_estudiante = u.estudiante_id
     WHERE u.username = $1 OR e.dni = $1
     ORDER BY (u.username = $1) DESC
     LIMIT 1`,
    [input]
  );

  const usuario = rows[0];
  if (!usuario) return genericError;
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

async function registrarEstudiante({ dni, username, password }) {
  const dniTrim = dni?.trim();
  const usernameTrim = username?.trim();

  if (!dniTrim || !usernameTrim || !password) {
    return { ok: false, mensaje: 'DNI, Usuario y Contraseña son obligatorios para activar la cuenta.' };
  }

  if (password.length < 8) {
    return { ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const userCheck = await pool.query('SELECT id_usuario FROM usuario WHERE username = $1', [usernameTrim]);
  if (userCheck.rows.length > 0) {
    return { ok: false, mensaje: 'El nombre de usuario ya está registrado por otro usuario.' };
  }

  const estudianteCheck = await pool.query(
    'SELECT id_estudiante, sede_id FROM estudiante WHERE dni = $1',
    [dniTrim]
  );

  if (estudianteCheck.rows.length === 0) {
    return {
      ok: false,
      mensaje:
        'No existe un estudiante registrado con ese DNI. Pide a personal de sede que registre tu matrícula primero.',
    };
  }

  const estudianteId = estudianteCheck.rows[0].id_estudiante;
  const usuarioEstudianteCheck = await pool.query(
    'SELECT id_usuario FROM usuario WHERE estudiante_id = $1',
    [estudianteId]
  );
  if (usuarioEstudianteCheck.rows.length > 0) {
    return { ok: false, mensaje: 'Ya existe una cuenta asociada a este DNI. Por favor inicia sesión.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userSedeId = estudianteCheck.rows[0].sede_id || 1;

  await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id, estudiante_id)
     VALUES ($1, $2, 'estudiante', $3, $4)`,
    [usernameTrim, passwordHash, userSedeId, estudianteId]
  );

  return { ok: true, mensaje: '¡Cuenta de estudiante activada con éxito! Ya puedes iniciar sesión.' };
}

module.exports = { login, registrarEstudiante };

