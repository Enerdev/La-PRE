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

module.exports = { login };
