const qrService = require('./qr.service');
const asistenciaRepo = require('../repositories/asistencia.repository');
const auditoria = require('./auditoria.service');

async function generarCodigoParaEstudiante(estudianteId) {
  return qrService.generarQR(estudianteId);
}

// Flujo completo del marcado de asistencia (RF-03/RF-04/RF-05):
// 1. Verifica firma y vigencia del QR.
// 2. Verifica que el estudiante exista y esté activo.
// 3. Verifica que el código no haya sido usado antes.
// 4. Registra la asistencia (la unicidad en BD es la garantía final contra duplicados).
// 5. Registra el intento (éxito o fallo) en la bitácora de auditoría, siempre.
async function marcarAsistencia({ token, usuarioQueEscanea }) {
  const verificacion = qrService.verificarQR(token);

  if (!verificacion.valido) {
    await auditoria.registrar({
      usuario_id: usuarioQueEscanea,
      accion: 'marcado_rechazado',
      modulo: 'asistencia',
      detalle: `QR inválido o expirado: ${verificacion.motivo}`,
    });
    return { exito: false, mensaje: 'Código QR inválido o expirado.' };
  }

  const { estudianteId } = verificacion;

  const activo = await asistenciaRepo.existeEstudianteActivo(estudianteId);
  if (!activo) {
    await auditoria.registrar({
      usuario_id: usuarioQueEscanea,
      accion: 'marcado_rechazado',
      modulo: 'asistencia',
      detalle: `Estudiante inexistente o inactivo: ${estudianteId}`,
    });
    return { exito: false, mensaje: 'Estudiante no encontrado o inactivo.' };
  }

  const yaUsado = await asistenciaRepo.codigoYaUsado(token);
  if (yaUsado) {
    await auditoria.registrar({
      usuario_id: usuarioQueEscanea,
      accion: 'marcado_rechazado_duplicado',
      modulo: 'asistencia',
      detalle: `Intento de reutilización de QR por estudiante ${estudianteId}`,
    });
    return { exito: false, mensaje: 'Este código ya fue utilizado.' };
  }

  try {
    const registro = await asistenciaRepo.registrarAsistencia({
      estudianteId,
      codigoQrUsado: token,
    });

    await auditoria.registrar({
      usuario_id: usuarioQueEscanea,
      accion: 'marcado_exitoso',
      modulo: 'asistencia',
      detalle: `Asistencia registrada para estudiante ${estudianteId}`,
    });

    return { exito: true, mensaje: 'Asistencia registrada.', registro };
  } catch (err) {
    // Si la restricción UNIQUE de la BD rechaza el insert (carrera entre dos escaneos simultáneos)
    if (err.code === '23505') {
      await auditoria.registrar({
        usuario_id: usuarioQueEscanea,
        accion: 'marcado_rechazado_duplicado',
        modulo: 'asistencia',
        detalle: `Carrera detectada en BD para estudiante ${estudianteId}`,
      });
      return { exito: false, mensaje: 'Este código ya fue utilizado.' };
    }
    throw err;
  }
}

module.exports = { generarCodigoParaEstudiante, marcarAsistencia };
