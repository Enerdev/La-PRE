const repo = require('../repositories/sede.repository');
const auditoria = require('../services/auditoria.service');

// POST /api/sedes  { nombre, direccion, capacidad }
// RF-12: permite abrir una sede nueva sin afectar la operación de las existentes
// (es solo un INSERT más en la tabla `sede`; ninguna sede activa se toca).
async function crear(req, res) {
  const { nombre, direccion, capacidad } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'nombre es obligatorio.' });
  }

  const sede = await repo.crear({ nombre, direccion, capacidad });

  await auditoria.registrar({
    usuario_id: req.usuario?.id_usuario,
    accion: 'crear_sede',
    modulo: 'administracion',
    detalle: `Sede ${sede.id_sede} (${sede.nombre}) registrada`,
  });

  res.status(201).json(sede);
}

async function listar(req, res) {
  const sedes = await repo.listar();
  res.json(sedes);
}

module.exports = { crear, listar };
