const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const estudianteRoutes = require('./routes/estudiante.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const pagoRoutes = require('./routes/pago.routes');
const academicoRoutes = require('./routes/academico.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/simulacros', academicoRoutes);

// Manejador de errores no capturados (última red de seguridad)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
