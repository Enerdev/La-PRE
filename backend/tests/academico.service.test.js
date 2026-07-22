jest.mock('../src/repositories/simulacro.repository');
jest.mock('../src/repositories/resultado.repository');
jest.mock('../src/services/auditoria.service');

const simulacroRepo = require('../src/repositories/simulacro.repository');
const resultadoRepo = require('../src/repositories/resultado.repository');
const { registrarResultados, cerrarYPublicarRanking } = require('../src/services/academico.service');

// UT-03 del informe: "Calcular ranking con resultados de simulacro"
// (el ordenamiento en sí ocurre en SQL vía RANK(); aquí se valida la lógica de negocio alrededor)
describe('academico.service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rechaza registrar resultados en un simulacro que ya fue cerrado', async () => {
    simulacroRepo.obtenerPorId.mockResolvedValue({ id_simulacro: 1, estado: 'cerrado' });

    const resultado = await registrarResultados({
      simulacroId: 1,
      resultados: [{ estudiante_id: 1, puntaje: 90 }],
      usuarioId: 1,
    });

    expect(resultado.ok).toBe(false);
    expect(resultadoRepo.registrarResultados).not.toHaveBeenCalled();
  });

  test('rechaza si no se envía ningún resultado', async () => {
    simulacroRepo.obtenerPorId.mockResolvedValue({ id_simulacro: 1, estado: 'programado' });

    const resultado = await registrarResultados({ simulacroId: 1, resultados: [], usuarioId: 1 });

    expect(resultado.ok).toBe(false);
  });

  test('cierra el simulacro y delega el cálculo del ranking a la base de datos', async () => {
    simulacroRepo.obtenerPorId.mockResolvedValue({ id_simulacro: 1, estado: 'programado' });
    resultadoRepo.calcularYPublicarRanking.mockResolvedValue({ resultadosActualizados: 2 });

    const resultado = await cerrarYPublicarRanking({ simulacroId: 1, usuarioId: 1 });

    expect(resultado.ok).toBe(true);
    expect(resultado.resultadosActualizados).toBe(2);
    expect(simulacroRepo.marcarCerrado).toHaveBeenCalledWith(1);
  });
});
