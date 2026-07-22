const simulacroRepo = require('../repositories/simulacro.repository');
const resultadoRepo = require('../repositories/resultado.repository');
const auditoria = require('./auditoria.service');

async function crearSimulacro({ nombre, fecha, tipo, descripcion }) {
  if (!nombre || !fecha) {
    return { ok: false, mensaje: 'nombre y fecha son obligatorios.' };
  }
  const simulacro = await simulacroRepo.crear({ nombre, fecha, tipo, descripcion });
  return { ok: true, simulacro };
}

async function listarSimulacros() {
  return simulacroRepo.listar();
}

async function registrarResultados({ simulacroId, resultados, usuarioId }) {
  const simulacro = await simulacroRepo.obtenerPorId(simulacroId);
  if (!simulacro) {
    return { ok: false, mensaje: 'Simulacro no encontrado.' };
  }
  if (simulacro.estado === 'cerrado') {
    return { ok: false, mensaje: 'El simulacro ya fue cerrado; no se pueden registrar más resultados.' };
  }
  if (!Array.isArray(resultados) || resultados.length === 0) {
    return { ok: false, mensaje: 'Debe enviar al menos un resultado.' };
  }

  const { cantidadProcesada } = await resultadoRepo.registrarResultados(simulacroId, resultados);

  await auditoria.registrar({
    usuario_id: usuarioId,
    accion: 'registrar_resultados',
    modulo: 'academico',
    detalle: `${cantidadProcesada} resultados registrados en simulacro ${simulacroId}`,
  });

  return { ok: true, cantidadProcesada };
}

// RF-07/RF-08: cierra el simulacro, calcula el ranking (RANK() en una sola consulta) y lo publica de inmediato.
async function cerrarYPublicarRanking({ simulacroId, usuarioId }) {
  const simulacro = await simulacroRepo.obtenerPorId(simulacroId);
  if (!simulacro) {
    return { ok: false, mensaje: 'Simulacro no encontrado.' };
  }

  const inicio = Date.now();
  const { resultadosActualizados } = await resultadoRepo.calcularYPublicarRanking(simulacroId);
  await simulacroRepo.marcarCerrado(simulacroId);
  const duracionMs = Date.now() - inicio;

  await auditoria.registrar({
    usuario_id: usuarioId,
    accion: 'publicar_ranking',
    modulo: 'academico',
    detalle: `Ranking de simulacro ${simulacroId} calculado y publicado (${resultadosActualizados} resultados, ${duracionMs} ms)`,
  });

  return { ok: true, resultadosActualizados, duracionMs };
}

async function obtenerRankingGeneral(simulacroId) {
  return resultadoRepo.obtenerRankingGeneral(simulacroId);
}

async function obtenerRankingPorSede(simulacroId, sedeId) {
  return resultadoRepo.obtenerRankingPorSede(simulacroId, sedeId);
}

module.exports = {
  crearSimulacro,
  listarSimulacros,
  registrarResultados,
  cerrarYPublicarRanking,
  obtenerRankingGeneral,
  obtenerRankingPorSede,
};
