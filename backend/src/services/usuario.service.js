const bcrypt = require('bcrypt');
const repo = require('../repositories/usuario.repository');

const ROLES_VALIDOS = ['direccion', 'administrador_sede', 'personal_asistencia', 'estudiante'];

async function crearUsuario({ username, password, rol, sedeId, estudianteId }) {
  if (!username || !password || !rol) {
    return { ok: false, mensaje: 'username, password y rol son obligatorios.' };
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return { ok: false, mensaje: `Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}.` };
  }
  if (password.length < 8) {
    return { ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const yaExiste = await repo.existeUsername(username);
  if (yaExiste) {
    return { ok: false, mensaje: 'Ese nombre de usuario ya está en uso.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await repo.crear({ username, passwordHash, rol, sedeId, estudianteId });

  return { ok: true, usuario };
}

async function listarUsuarios({ sedeId } = {}) {
  return repo.listar({ sedeId });
}

module.exports = { crearUsuario, listarUsuarios };
