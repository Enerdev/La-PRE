const pool = require('../config/db');

// Consolida pagos y asistencia de una sede en una sola respuesta (RF-09).
async function consolidadoPorSede(sedeId) {
  const pagos = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) AS total_recaudado, COUNT(*) AS cantidad_pagos
     FROM pago p JOIN estudiante e ON e.id_estudiante = p.estudiante_id
     WHERE e.sede_id = $1 AND p.estado = 'pagado'`,
    [sedeId]
  );

  const asistencias = await pool.query(
    `SELECT COUNT(*) AS total_marcados, COUNT(DISTINCT a.estudiante_id) AS estudiantes_distintos
     FROM asistencia a JOIN estudiante e ON e.id_estudiante = a.estudiante_id
     WHERE e.sede_id = $1 AND a.estado = 'asistio'`,
    [sedeId]
  );

  const estudiantes = await pool.query(
    `SELECT COUNT(*) AS total_estudiantes FROM estudiante WHERE sede_id = $1 AND estado = 'activo'`,
    [sedeId]
  );

  return {
    sede_id: sedeId,
    estudiantes: estudiantes.rows[0],
    pagos: pagos.rows[0],
    asistencia: asistencias.rows[0],
  };
}

// Mismo consolidado pero a nivel de toda la institución, agrupado por sede.
async function consolidadoGeneral() {
  const { rows } = await pool.query(
    `SELECT
       s.id_sede,
       s.nombre AS sede,
       COUNT(DISTINCT e.id_estudiante) AS total_estudiantes,
       COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'pagado'), 0) AS total_recaudado,
       COUNT(DISTINCT a.id_asistencia) FILTER (WHERE a.estado = 'asistio') AS total_marcados
     FROM sede s
     LEFT JOIN estudiante e ON e.sede_id = s.id_sede AND e.estado = 'activo'
     LEFT JOIN pago p ON p.estudiante_id = e.id_estudiante
     LEFT JOIN asistencia a ON a.estudiante_id = e.id_estudiante
     WHERE s.estado = 'activo'
     GROUP BY s.id_sede, s.nombre
     ORDER BY s.nombre`
  );
  return rows;
}

module.exports = { consolidadoPorSede, consolidadoGeneral };
