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

  const estudiantePrincipal = await pool.query(
    `INSERT INTO estudiante (nombres, apellidos, dni, sede_id) VALUES ('José', 'Ramos Quispe', '70123456', $1)
     RETURNING id_estudiante`,
    [sedeId]
  );

  const estudianteCentral = await pool.query(
    `INSERT INTO estudiante (nombres, apellidos, dni, sede_id) VALUES ('Estudiante', 'Central', '70123457', $1)
     RETURNING id_estudiante`,
    [sedeId]
  );

  const passwordHashAsistencia = await bcrypt.hash('asistencia123', 10);
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashDireccion = await bcrypt.hash('direccion123', 10);
  const passwordHashEstudiante = await bcrypt.hash('estudiante123', 10);

  await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id) VALUES
     ('asistencia_central', $1, 'personal_asistencia', $2),
     ('admin_central', $3, 'administrador_sede', $2),
     ('direccion_central', $4, 'direccion', $2)`,
    [passwordHashAsistencia, sedeId, passwordHashAdmin, passwordHashDireccion]
  );

  await pool.query(
    `INSERT INTO usuario (username, password_hash, rol, sede_id, estudiante_id)
     VALUES
     ('jose_ramos', $1, 'estudiante', $2, $3),
     ('estudiante_central', $4, 'estudiante', $2, $5)`,
    [passwordHashEstudiante, sedeId, estudiantePrincipal.rows[0].id_estudiante, passwordHashEstudiante, estudianteCentral.rows[0].id_estudiante]
  );

  console.log('Seed completado:');
  console.log(`  Sede id: ${sedeId}`);
  console.log(`  Estudiante principal id: ${estudiantePrincipal.rows[0].id_estudiante}`);
  console.log(`  Estudiante central id: ${estudianteCentral.rows[0].id_estudiante}`);
  console.log('  Usuarios de prueba:');
  console.log('    asistencia_central / asistencia123 (Personal de asistencia)');
  console.log('    admin_central / admin123 (Administrador de sede)');
  console.log('    direccion_central / direccion123 (Dirección)');
  console.log('    jose_ramos / estudiante123 (Estudiante principal)');
  console.log('    estudiante_central / estudiante123 (Estudiante central)');

  await pool.end();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
