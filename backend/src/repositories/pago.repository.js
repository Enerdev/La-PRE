const pool = require('../config/db');

async function listarPorEstudiante(estudianteId) {
  const { rows } = await pool.query(
    `SELECT * FROM pago WHERE estudiante_id = $1 ORDER BY fecha DESC`,
    [estudianteId]
  );
  return rows;
}

async function listarPorSede(sedeId) {
  const { rows } = await pool.query(
    `SELECT p.*, e.nombres, e.apellidos
     FROM pago p
     JOIN estudiante e ON e.id_estudiante = p.estudiante_id
     WHERE e.sede_id = $1
     ORDER BY p.fecha DESC`,
    [sedeId]
  );
  return rows;
}

async function registrarPago({ estudianteId, monto, metodoPago, comprobante }) {
  const { rows } = await pool.query(
    `INSERT INTO pago (estudiante_id, monto, metodo_pago, comprobante, estado)
     VALUES ($1, $2, $3, $4, 'pagado')
     RETURNING *`,
    [estudianteId, monto, metodoPago, comprobante]
  );
  return rows[0];
}

// Estado de cuenta: total pagado vs. lista de pagos, para el panel del estudiante/administrador.
async function estadoDeCuenta(estudianteId) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(monto) FILTER (WHERE estado = 'pagado'), 0) AS total_pagado,
       COUNT(*) FILTER (WHERE estado = 'pagado') AS cantidad_pagos
     FROM pago WHERE estudiante_id = $1`,
    [estudianteId]
  );
  const historial = await listarPorEstudiante(estudianteId);
  return { resumen: rows[0], historial };
}

module.exports = { listarPorEstudiante, listarPorSede, registrarPago, estadoDeCuenta };
