const pool = require('../config/db');

async function crear({ username, passwordHash, rol, sedeId, estudianteId }) {
  const { rows } = await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id, estudiante_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_usuario, username, rol, sede_id, estudiante_id, estado, fecha_creacion`,
    [username, passwordHash, rol, sedeId || null, estudianteId || null]
  );
  return rows[0];
}

async function existeUsername(username) {
  const { rows } = await pool.query(`SELECT id_usuario FROM usuario WHERE username = $1`, [username]);
  return rows.length > 0;
}

async function listar({ sedeId } = {}) {
  if (sedeId) {
    const { rows } = await pool.query(
      `SELECT id_usuario, username, rol, sede_id, estudiante_id, estado, fecha_creacion
       FROM usuario WHERE sede_id = $1 ORDER BY username`,
      [sedeId]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT id_usuario, username, rol, sede_id, estudiante_id, estado, fecha_creacion
     FROM usuario ORDER BY username`
  );
  return rows;
}

module.exports = { crear, existeUsername, listar };
