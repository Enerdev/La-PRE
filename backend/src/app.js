const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const estudianteRoutes = require('./routes/estudiante.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const pagoRoutes = require('./routes/pago.routes');
const academicoRoutes = require('./routes/academico.routes');
const sedeRoutes = require('./routes/sede.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');
const reporteRoutes = require('./routes/reporte.routes');

const app = express();

// Corrige VULN-005 de tu reporte OWASP ZAP: "Cabeceras de seguridad ausentes
// (X-Frame-Options, CSP, etc.)". helmet() las agrega todas con valores sensatos por defecto.
app.use(helmet());

// En producción, restringe a la URL real de tu frontend en vez de "*".
// Ejemplo: CORS_ORIGIN=https://la-pre.vercel.app en tu .env de producción.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/simulacros', academicoRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/reportes', reporteRoutes);

// Manejador de errores no capturados (última red de seguridad)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
