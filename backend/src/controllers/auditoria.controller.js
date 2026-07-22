const repo = require('../repositories/auditoria.repository');

// GET /api/auditoria?modulo=asistencia&limite=50   (solo dirección, RF-11)
async function listar(req, res) {
  const modulo = req.query.modulo;
  const limite = req.query.limite ? parseInt(req.query.limite, 10) : 100;
  const registros = await repo.listar({ modulo, limite });
  res.json(registros);
}

module.exports = { listar };
