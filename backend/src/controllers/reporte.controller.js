const repo = require('../repositories/reporte.repository');

// GET /api/reportes/sede/:sedeId
async function porSede(req, res) {
  const sedeId = parseInt(req.params.sedeId, 10);
  const reporte = await repo.consolidadoPorSede(sedeId);
  res.json(reporte);
}

// GET /api/reportes/general
async function general(req, res) {
  const reporte = await repo.consolidadoGeneral();
  res.json(reporte);
}

module.exports = { porSede, general };
