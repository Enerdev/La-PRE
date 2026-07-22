const repo = require('../repositories/reporte.repository');
const sedeRepo = require('../repositories/sede.repository');
const { generarPdfReporteSede, generarExcelReporteSede } = require('../services/exportacion.service');

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

// GET /api/reportes/sede/:sedeId/exportar/pdf
async function exportarPdf(req, res) {
  const sedeId = parseInt(req.params.sedeId, 10);
  const [reporte, sede] = await Promise.all([
    repo.consolidadoPorSede(sedeId),
    sedeRepo.obtenerPorId(sedeId),
  ]);

  if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

  const buffer = await generarPdfReporteSede(reporte, sede.nombre);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-sede-${sedeId}.pdf"`);
  res.send(buffer);
}

// GET /api/reportes/sede/:sedeId/exportar/excel
async function exportarExcel(req, res) {
  const sedeId = parseInt(req.params.sedeId, 10);
  const [reporte, sede] = await Promise.all([
    repo.consolidadoPorSede(sedeId),
    sedeRepo.obtenerPorId(sedeId),
  ]);

  if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

  const buffer = await generarExcelReporteSede(reporte, sede.nombre);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-sede-${sedeId}.xlsx"`);
  res.send(buffer);
}

module.exports = { porSede, general, exportarPdf, exportarExcel };
