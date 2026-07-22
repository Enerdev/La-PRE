const pool = require('../config/db');

async function listar({ modulo, limite = 100 } = {}) {
  if (modulo) {
    const { rows } = await pool.query(
      `SELECT a.*, u.username
       FROM auditoria a
       LEFT JOIN usuario u ON u.id_usuario = a.usuario_id
       WHERE a.modulo = $1
       ORDER BY a.fecha DESC
       LIMIT $2`,
      [modulo, limite]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT a.*, u.username
     FROM auditoria a
     LEFT JOIN usuario u ON u.id_usuario = a.usuario_id
     ORDER BY a.fecha DESC
     LIMIT $1`,
    [limite]
  );
  return rows;
}

module.exports = { listar };
