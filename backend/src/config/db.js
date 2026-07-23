const { Pool } = require('pg');
require('dotenv').config();

// Pool centralizado de conexiones a PostgreSQL.
// Toda la capa de "repositories" usa este pool en vez de abrir conexiones propias.
// En local usamos host/usuario/contraseña por separado (ver .env.example).
// En Railway (y la mayoría de hosts en la nube), la base de datos se entrega como
// una sola URL de conexión en DATABASE_URL — si existe, se usa esa directamente.
const opcionesConexion = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool({
  ...opcionesConexion,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
