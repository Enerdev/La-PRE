const pool = require('../config/db');

async function crear({ nombre, fecha, tipo, descripcion }) {
  const { rows } = await pool.query(
    `INSERT INTO simulacro (nombre, fecha, tipo, descripcion) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, fecha, tipo, descripcion]
  );
  return rows[0];
}

async function listar() {
  const { rows } = await pool.query(`SELECT * FROM simulacro ORDER BY fecha DESC`);
  return rows;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM simulacro WHERE id_simulacro = $1`, [id]);
  return rows[0] || null;
}

async function marcarCerrado(id) {
  await pool.query(`UPDATE simulacro SET estado = 'cerrado' WHERE id_simulacro = $1`, [id]);
}

module.exports = { crear, listar, obtenerPorId, marcarCerrado };
