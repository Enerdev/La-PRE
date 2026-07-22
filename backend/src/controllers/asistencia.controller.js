const asistenciaService = require('../services/asistencia.service');

// GET /api/asistencia/qr/:estudianteId  (el propio estudiante genera su QR)
async function generarQR(req, res) {
  try {
    const estudianteId = parseInt(req.params.estudianteId, 10);
    const data = await asistenciaService.generarCodigoParaEstudiante(estudianteId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo generar el código QR.' });
  }
}

// POST /api/asistencia   { token }  (personal de asistencia escanea el QR del estudiante)
async function marcarAsistencia(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Falta el token del QR escaneado.' });
    }

    const resultado = await asistenciaService.marcarAsistencia({
      token,
      usuarioQueEscanea: req.usuario?.id_usuario,
    });

    if (!resultado.exito) {
      return res.status(409).json(resultado);
    }
    res.status(201).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la asistencia.' });
  }
}

module.exports = { generarQR, marcarAsistencia };
