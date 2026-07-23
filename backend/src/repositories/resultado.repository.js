const pool = require('../config/db');

// Inserta o actualiza (si ya existía) el puntaje de varios estudiantes en un solo viaje a la BD.
// resultados: [{ estudiante_id, puntaje }, ...]
async function registrarResultados(simulacroId, resultados) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of resultados) {
      await client.query(
        `INSERT INTO resultado (estudiante_id, simulacro_id, puntaje)
         VALUES ($1, $2, $3)
         ON CONFLICT (estudiante_id, simulacro_id)
         DO UPDATE SET puntaje = EXCLUDED.puntaje`,
        [r.estudiante_id, simulacroId, r.puntaje]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { cantidadProcesada: resultados.length };
}

// Calcula el puesto de TODOS los resultados de un simulacro en una sola sentencia SQL
// (usando la función de ventana RANK), en vez de calcularlo fila por fila desde el backend.
// Esto es lo que permite cumplir el requisito de "menos de 5 segundos" con 500 estudiantes (RF-07).
async function calcularYPublicarRanking(simulacroId) {
  const { rowCount } = await pool.query(
    `UPDATE resultado r
     SET puesto = sub.puesto,
         fecha_publicacion = NOW()
     FROM (
       SELECT id_resultado, RANK() OVER (ORDER BY puntaje DESC) AS puesto
       FROM resultado
       WHERE simulacro_id = $1
     ) sub
     WHERE r.id_resultado = sub.id_resultado`,
    [simulacroId]
  );
  return { resultadosActualizados: rowCount };
}

async function obtenerRankingGeneral(simulacroId) {
  const { rows } = await pool.query(
    `SELECT r.id_resultado, r.puntaje, r.puesto, r.fecha_publicacion,
            e.id_estudiante, e.nombres, e.apellidos, e.sede_id, e.email
     FROM resultado r
     JOIN estudiante e ON e.id_estudiante = r.estudiante_id
     WHERE r.simulacro_id = $1
     ORDER BY r.puesto ASC NULLS LAST`,
    [simulacroId]
  );
  return rows;
}

// Ranking calculado "al vuelo" acotado a una sede, sin tocar el puesto general almacenado.
async function obtenerRankingPorSede(simulacroId, sedeId) {
  const { rows } = await pool.query(
    `SELECT e.id_estudiante, e.nombres, e.apellidos, r.puntaje,
            RANK() OVER (ORDER BY r.puntaje DESC) AS puesto_sede
     FROM resultado r
     JOIN estudiante e ON e.id_estudiante = r.estudiante_id
     WHERE r.simulacro_id = $1 AND e.sede_id = $2
     ORDER BY puesto_sede ASC`,
    [simulacroId, sedeId]
  );
  return rows;
}

module.exports = {
  registrarResultados,
  calcularYPublicarRanking,
  obtenerRankingGeneral,
  obtenerRankingPorSede,
};
