// Genera datos de prueba para las métricas PR-01/PR-02 de tu informe:
// 500 estudiantes en la Sede 1, un simulacro nuevo, y 500 resultados
// registrados y publicados usando el mismo camino que usa la aplicación real
// (el mismo service que usa el endpoint /cerrar), para que el tiempo medido
// sea el tiempo real, no uno artificial.
//
// Uso: node scripts/seed-carga.js
require('dotenv').config();
const pool = require('../src/config/db');
const simulacroRepo = require('../src/repositories/simulacro.repository');
const academicoService = require('../src/services/academico.service');

const CANTIDAD = 500;
const SEDE_ID = 1;

async function crearEstudiantes() {
  console.log(`Insertando ${CANTIDAD} estudiantes de prueba en la sede ${SEDE_ID}...`);
  const client = await pool.connect();
  const ids = [];
  try {
    await client.query('BEGIN');
    for (let i = 0; i < CANTIDAD; i++) {
      const dni = `9${String(i).padStart(8, '0')}`; // DNIs sintéticos que no chocan con datos reales
      const { rows } = await client.query(
        `INSERT INTO estudiante (nombres, apellidos, dni, sede_id)
         VALUES ($1, $2, $3, $4) RETURNING id_estudiante`,
        [`EstudianteCarga${i}`, `ApellidoCarga${i}`, dni, SEDE_ID]
      );
      ids.push(rows[0].id_estudiante);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  console.log(`${ids.length} estudiantes creados.`);
  return ids;
}

async function main() {
  const idsEstudiantes = await crearEstudiantes();

  const simulacro = await simulacroRepo.crear({
    nombre: 'Simulacro de Carga (prueba PR-01/PR-02)',
    fecha: new Date(),
    tipo: 'carga',
    descripcion: 'Generado por scripts/seed-carga.js — no es un simulacro real.',
  });
  console.log(`Simulacro creado: id ${simulacro.id_simulacro}`);

  const resultados = idsEstudiantes.map((estudiante_id) => ({
    estudiante_id,
    puntaje: Number((Math.random() * 100).toFixed(2)),
  }));

  console.log(`Registrando ${resultados.length} resultados (mismo camino que usa la API)...`);
  let t0 = Date.now();
  await academicoService.registrarResultados({
    simulacroId: simulacro.id_simulacro,
    resultados,
    usuarioId: null,
  });
  console.log(`Resultados registrados en ${Date.now() - t0} ms`);

  console.log('Cerrando y publicando el ranking (RF-07: debe ser < 5000 ms)...');
  t0 = Date.now();
  const r = await academicoService.cerrarYPublicarRanking({
    simulacroId: simulacro.id_simulacro,
    usuarioId: null,
  });
  console.log(`Ranking calculado: ${r.resultadosActualizados} filas en ${r.duracionMs} ms (medido internamente)`);
  console.log(`Tiempo total del cierre visto desde este script: ${Date.now() - t0} ms`);

  console.log('\n─────────────────────────────────────────────');
  console.log(`Usa este ID de simulacro para scripts/prueba-carga.js:  ${simulacro.id_simulacro}`);
  console.log('─────────────────────────────────────────────');

  await pool.end();
}

main().catch((err) => {
  console.error('Error en seed-carga:', err);
  process.exit(1);
});
