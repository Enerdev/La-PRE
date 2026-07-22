const pool = require('../config/db');

async function existeEstudianteActivo(estudianteId) {
  const { rows } = await pool.query(
    `SELECT id_estudiante FROM estudiante WHERE id_estudiante = $1 AND estado = 'activo'`,
    [estudianteId]
  );
  return rows.length > 0;
}

// La restricción UNIQUE(codigo_qr_usado) en la tabla es la verdadera barrera antifraude:
// si dos marcados intentan usar el mismo token, el segundo INSERT falla en la base de datos,
// incluso si dos peticiones llegan al mismo tiempo desde sedes distintas.
async function registrarAsistencia({ estudianteId, codigoQrUsado }) {
  const { rows } = await pool.query(
    `INSERT INTO asistencia (estudiante_id, codigo_qr_usado, estado)
     VALUES ($1, $2, 'asistio')
     RETURNING id_asistencia, fecha, hora`,
    [estudianteId, codigoQrUsado]
  );
  return rows[0];
}

async function codigoYaUsado(codigoQrUsado) {
  const { rows } = await pool.query(
    `SELECT id_asistencia FROM asistencia WHERE codigo_qr_usado = $1`,
    [codigoQrUsado]
  );
  return rows.length > 0;
}

module.exports = { existeEstudianteActivo, registrarAsistencia, codigoYaUsado };
