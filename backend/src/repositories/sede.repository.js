const pool = require('../config/db');

async function crear({ nombre, direccion, capacidad }) {
  const { rows } = await pool.query(
    `INSERT INTO sede (nombre, direccion, capacidad) VALUES ($1, $2, $3) RETURNING *`,
    [nombre, direccion, capacidad]
  );
  return rows[0];
}

async function listar() {
  const { rows } = await pool.query(`SELECT * FROM sede WHERE estado = 'activo' ORDER BY nombre`);
  return rows;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM sede WHERE id_sede = $1`, [id]);
  return rows[0] || null;
}

module.exports = { crear, listar, obtenerPorId };
