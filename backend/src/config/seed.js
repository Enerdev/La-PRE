// Crea datos mínimos para poder probar el flujo completo: una sede,
// un estudiante y un usuario de personal de asistencia.
// Uso: node src/config/seed.js
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
  const sede = await pool.query(
    `INSERT INTO sede (nombre, direccion, capacidad) VALUES ('Sede Central', 'Av. El Sol s/n, Puno', 200)
     RETURNING id_sede`
  );
  const sedeId = sede.rows[0].id_sede;

  const estudiante = await pool.query(
    `INSERT INTO estudiante (nombres, apellidos, dni, sede_id) VALUES ('José', 'Ramos Quispe', '70123456', $1)
     RETURNING id_estudiante`,
    [sedeId]
  );

  const passwordHash = await bcrypt.hash('asistencia123', 10);
  await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id) VALUES ('asistencia_central', $1, 'personal_asistencia', $2)`,
    [passwordHash, sedeId]
  );

  console.log('Seed completado:');
  console.log(`  Sede id: ${sedeId}`);
  console.log(`  Estudiante id: ${estudiante.rows[0].id_estudiante}`);
  console.log('  Usuario: asistencia_central / asistencia123');

  await pool.end();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
