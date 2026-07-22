jest.mock('../src/repositories/pago.repository');
jest.mock('../src/repositories/estudiante.repository');
jest.mock('../src/services/auditoria.service');

const pagoRepo = require('../src/repositories/pago.repository');
const estudianteRepo = require('../src/repositories/estudiante.repository');
const { registrarPago } = require('../src/services/pago.service');

// UT-04 del informe: "Registrar un pago y actualizar el estado de cuenta"
describe('pago.service - registrarPago', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza montos menores o iguales a 0', async () => {
    const resultado = await registrarPago({ estudianteId: 1, monto: 0, usuarioId: 1 });
    expect(resultado.ok).toBe(false);
    expect(pagoRepo.registrarPago).not.toHaveBeenCalled();
  });

  test('rechaza si el estudiante no existe o está inactivo', async () => {
    estudianteRepo.obtenerPorId.mockResolvedValue(null);

    const resultado = await registrarPago({ estudianteId: 99, monto: 100, usuarioId: 1 });

    expect(resultado.ok).toBe(false);
    expect(pagoRepo.registrarPago).not.toHaveBeenCalled();
  });

  test('registra el pago cuando el estudiante existe y está activo', async () => {
    estudianteRepo.obtenerPorId.mockResolvedValue({ id_estudiante: 1, estado: 'activo' });
    pagoRepo.registrarPago.mockResolvedValue({ id_pago: 10, monto: 150, estado: 'pagado' });

    const resultado = await registrarPago({
      estudianteId: 1,
      monto: 150,
      metodoPago: 'efectivo',
      usuarioId: 2,
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.pago.id_pago).toBe(10);
    expect(pagoRepo.registrarPago).toHaveBeenCalledWith({
      estudianteId: 1,
      monto: 150,
      metodoPago: 'efectivo',
      comprobante: undefined,
    });
  });
});
