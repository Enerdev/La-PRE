const service = require('../services/academico.service');

// POST /api/simulacros   { nombre, fecha, tipo, descripcion }
async function crearSimulacro(req, res) {
  const { nombre, fecha, tipo, descripcion } = req.body;
  const resultado = await service.crearSimulacro({ nombre, fecha, tipo, descripcion });
  if (!resultado.ok) return res.status(400).json({ error: resultado.mensaje });
  res.status(201).json(resultado.simulacro);
}

// GET /api/simulacros
async function listarSimulacros(req, res) {
  const simulacros = await service.listarSimulacros();
  res.json(simulacros);
}

// POST /api/simulacros/:id/resultados   { resultados: [{ estudiante_id, puntaje }, ...] }
async function registrarResultados(req, res) {
  const simulacroId = parseInt(req.params.id, 10);
  const { resultados } = req.body;

  const resultado = await service.registrarResultados({
    simulacroId,
    resultados,
    usuarioId: req.usuario?.id_usuario,
  });

  if (!resultado.ok) return res.status(400).json({ error: resultado.mensaje });
  res.status(201).json(resultado);
}

// POST /api/simulacros/:id/cerrar  -> calcula y publica el ranking (RF-07/RF-08)
async function cerrarYPublicar(req, res) {
  const simulacroId = parseInt(req.params.id, 10);

  const resultado = await service.cerrarYPublicarRanking({
    simulacroId,
    usuarioId: req.usuario?.id_usuario,
  });

  if (!resultado.ok) return res.status(404).json({ error: resultado.mensaje });
  res.json(resultado);
}

// GET /api/simulacros/:id/ranking
async function rankingGeneral(req, res) {
  const simulacroId = parseInt(req.params.id, 10);
  const ranking = await service.obtenerRankingGeneral(simulacroId);
  res.json(ranking);
}

// GET /api/simulacros/:id/ranking/sede/:sedeId
async function rankingPorSede(req, res) {
  const simulacroId = parseInt(req.params.id, 10);
  const sedeId = parseInt(req.params.sedeId, 10);
  const ranking = await service.obtenerRankingPorSede(simulacroId, sedeId);
  res.json(ranking);
}

module.exports = {
  crearSimulacro,
  listarSimulacros,
  registrarResultados,
  cerrarYPublicar,
  rankingGeneral,
  rankingPorSede,
};
