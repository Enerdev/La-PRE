const pool = require('../config/db');

async function listar({ sedeId } = {}) {
  if (sedeId) {
    const { rows } = await pool.query(
      `SELECT * FROM estudiante WHERE sede_id = $1 AND estado = 'activo' ORDER BY apellidos`,
      [sedeId]
    );
    return rows;
  }
  const { rows } = await pool.query(`SELECT * FROM estudiante WHERE estado = 'activo' ORDER BY apellidos`);
  return rows;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM estudiante WHERE id_estudiante = $1`, [id]);
  return rows[0] || null;
}

async function crear({ nombres, apellidos, dni, fechaNacimiento, sedeId, email }) {
  const { rows } = await pool.query(
    `INSERT INTO estudiante (nombres, apellidos, dni, fecha_nacimiento, sede_id, email)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nombres, apellidos, dni, fechaNacimiento, sedeId, email || null]
  );
  return rows[0];
}

// RF-01/diseño: nunca se elimina un estudiante con datos asociados, solo se inactiva.
async function inactivar(id) {
  const { rows } = await pool.query(
    `UPDATE estudiante SET estado = 'inactivo' WHERE id_estudiante = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { listar, obtenerPorId, crear, inactivar };
