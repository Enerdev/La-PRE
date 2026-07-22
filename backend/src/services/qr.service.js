const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// El QR "dinámico" es en realidad un JWT de corta duración firmado por el servidor,
// que contiene el id del estudiante. Esto evita que alguien fabrique un QR válido
// sin conocer el JWT_SECRET, y hace que caduque solo (RNF de seguridad).
const QR_EXPIRACION_SEG = parseInt(process.env.QR_EXPIRACION_SEG || '120', 10);

async function generarQR(estudianteId) {
  const token = jwt.sign(
    { estudiante_id: estudianteId, tipo: 'asistencia_qr' },
    process.env.JWT_SECRET,
    { expiresIn: QR_EXPIRACION_SEG }
  );

  const qrImageDataUrl = await QRCode.toDataURL(token);
  return { token, qrImageDataUrl, expiraEnSegundos: QR_EXPIRACION_SEG };
}

// Valida la firma y vigencia del código. NO valida aquí si ya fue usado:
// eso se verifica en la base de datos (unicidad de codigo_qr_usado), en asistencia.service.js,
// porque la validación de "ya usado" siempre debe ocurrir en el servidor, nunca solo en el cliente.
function verificarQR(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'asistencia_qr') {
      throw new Error('Token no corresponde a un QR de asistencia.');
    }
    return { valido: true, estudianteId: payload.estudiante_id };
  } catch (err) {
    return { valido: false, motivo: err.message };
  }
}

module.exports = { generarQR, verificarQR };
