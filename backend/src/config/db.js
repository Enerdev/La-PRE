const { Pool } = require('pg');
require('dotenv').config();

// Pool centralizado de conexiones a PostgreSQL.
// Toda la capa de "repositories" usa este pool en vez de abrir conexiones propias.
// max: cuántas conexiones simultáneas a la BD se permiten. El valor por defecto de
// la librería 'pg' es 10; en picos de tráfico alto (matrícula de verano) vale la
// pena subirlo si tu plan de PostgreSQL lo soporta.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
