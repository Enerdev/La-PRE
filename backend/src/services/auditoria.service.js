const pool = require('../config/db');

// Registra toda acción crítica del sistema (marcado de asistencia, pagos, cambios de datos).
// Se llama desde los demás servicios; nunca debe bloquear la operación principal si falla.
async function registrar({ usuario_id = null, accion, modulo, detalle = '' }) {
  try {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, accion, modulo, detalle) VALUES ($1, $2, $3, $4)`,
      [usuario_id, accion, modulo, detalle]
    );
  } catch (err) {
    console.error('No se pudo registrar en la bitácora de auditoría:', err.message);
  }
}

module.exports = { registrar };
