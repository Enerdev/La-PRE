const service = require('../services/pago.service');

// POST /api/pagos   { estudiante_id, monto, metodo_pago, comprobante }
async function registrarPago(req, res) {
  const { estudiante_id, monto, metodo_pago, comprobante } = req.body;
  if (!estudiante_id || monto === undefined) {
    return res.status(400).json({ error: 'estudiante_id y monto son obligatorios.' });
  }

  const resultado = await service.registrarPago({
    estudianteId: estudiante_id,
    monto,
    metodoPago: metodo_pago,
    comprobante,
    usuarioId: req.usuario?.id_usuario,
  });

  if (!resultado.ok) {
    return res.status(400).json({ error: resultado.mensaje });
  }
  res.status(201).json(resultado.pago);
}

// GET /api/pagos/estudiante/:id  -> el propio estudiante o personal autorizado de su sede
async function estadoDeCuenta(req, res) {
  const estudianteId = parseInt(req.params.id, 10);

  const esElMismoEstudiante = req.usuario.rol === 'estudiante' && req.usuario.estudiante_id === estudianteId;
  const esPersonalAutorizado = ['administrador_sede', 'direccion'].includes(req.usuario.rol);

  if (!esElMismoEstudiante && !esPersonalAutorizado) {
    return res.status(403).json({ error: 'No tienes permiso para ver esta información.' });
  }

  const data = await service.obtenerEstadoDeCuenta(estudianteId);
  res.json(data);
}

// GET /api/pagos/sede/:sedeId  -> administrador_sede o dirección
async function pagosPorSede(req, res) {
  const sedeId = parseInt(req.params.sedeId, 10);
  const pagos = await service.obtenerPagosPorSede(sedeId);
  res.json(pagos);
}

module.exports = { registrarPago, estadoDeCuenta, pagosPorSede };
