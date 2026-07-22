// Ejecuta todos los archivos .sql de /migrations en orden alfabético.
// Uso: npm run migrate
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Aplicando migración: ${file}`);
    await pool.query(sql);
  }

  console.log('Migraciones completadas.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Error al migrar:', err);
  process.exit(1);
});
