const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'clave-de-prueba-para-tests';
process.env.QR_EXPIRACION_SEG = '120';

const { generarQR, verificarQR } = require('../src/services/qr.service');

describe('qr.service', () => {
  // UT-01 del informe: "Generar QR con identificador y timestamp"
  test('genera un QR único con vigencia corta', async () => {
    const { token, qrImageDataUrl, expiraEnSegundos } = await generarQR(1);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // un JWT válido tiene 3 partes
    expect(qrImageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(expiraEnSegundos).toBe(120);
  });

  test('el QR generado codifica correctamente el id del estudiante', async () => {
    const { token } = await generarQR(42);
    const resultado = verificarQR(token);
    expect(resultado.valido).toBe(true);
    expect(resultado.estudianteId).toBe(42);
  });

  test('rechaza un token con firma inválida (no generado por este servidor)', () => {
    const resultado = verificarQR('esto.no.es_un_jwt_valido');
    expect(resultado.valido).toBe(false);
  });

  // UT-02 del informe: "Escanear QR ya utilizado" — la parte de vigencia de esa validación
  test('rechaza un QR expirado', async () => {
    const tokenExpirado = jwt.sign(
      { estudiante_id: 5, tipo: 'asistencia_qr' },
      process.env.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    const resultado = verificarQR(tokenExpirado);
    expect(resultado.valido).toBe(false);
  });

  test('rechaza un token que no es de tipo asistencia_qr', () => {
    const tokenDeOtroTipo = jwt.sign({ estudiante_id: 5, tipo: 'otra_cosa' }, process.env.JWT_SECRET);
    const resultado = verificarQR(tokenDeOtroTipo);
    expect(resultado.valido).toBe(false);
  });
});
