const repo = require('../repositories/pago.repository');
const estudianteRepo = require('../repositories/estudiante.repository');
const auditoria = require('../services/auditoria.service');
const notificaciones = require('./notificacion.service');

async function registrarPago({ estudianteId, monto, metodoPago, comprobante, usuarioId }) {
  if (monto <= 0) {
    return { ok: false, mensaje: 'El monto debe ser mayor a 0.' };
  }

  const estudiante = await estudianteRepo.obtenerPorId(estudianteId);
  if (!estudiante || estudiante.estado !== 'activo') {
    return { ok: false, mensaje: 'Estudiante no encontrado o inactivo.' };
  }

  const pago = await repo.registrarPago({ estudianteId, monto, metodoPago, comprobante });

  await auditoria.registrar({
    usuario_id: usuarioId,
    accion: 'registrar_pago',
    modulo: 'pagos',
    detalle: `Pago de ${monto} registrado para estudiante ${estudianteId}`,
  });

  // No bloquea la respuesta al usuario si el correo tarda o falla:
  // notificacion.service ya atrapa sus propios errores internamente.
  notificaciones.enviarConfirmacionPago({
    correoEstudiante: estudiante.email,
    nombreEstudiante: `${estudiante.nombres} ${estudiante.apellidos}`,
    monto,
    fecha: pago.fecha,
  });

  return { ok: true, pago };
}

async function obtenerEstadoDeCuenta(estudianteId) {
  return repo.estadoDeCuenta(estudianteId);
}

async function obtenerPagosPorSede(sedeId) {
  return repo.listarPorSede(sedeId);
}

module.exports = { registrarPago, obtenerEstadoDeCuenta, obtenerPagosPorSede };
