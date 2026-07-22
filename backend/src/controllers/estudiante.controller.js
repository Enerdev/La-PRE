const repo = require('../repositories/estudiante.repository');
const auditoria = require('../services/auditoria.service');

async function listar(req, res) {
  const sedeId = req.query.sede_id ? parseInt(req.query.sede_id, 10) : undefined;
  const estudiantes = await repo.listar({ sedeId });
  res.json(estudiantes);
}

async function obtener(req, res) {
  const estudiante = await repo.obtenerPorId(parseInt(req.params.id, 10));
  if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });
  res.json(estudiante);
}

async function crear(req, res) {
  const { nombres, apellidos, dni, fecha_nacimiento, sede_id } = req.body;
  if (!nombres || !apellidos || !sede_id) {
    return res.status(400).json({ error: 'nombres, apellidos y sede_id son obligatorios.' });
  }

  const estudiante = await repo.crear({
    nombres,
    apellidos,
    dni,
    fechaNacimiento: fecha_nacimiento,
    sedeId: sede_id,
  });

  await auditoria.registrar({
    usuario_id: req.usuario?.id_usuario,
    accion: 'crear_estudiante',
    modulo: 'estudiantes',
    detalle: `Estudiante ${estudiante.id_estudiante} registrado en sede ${sede_id}`,
  });

  res.status(201).json(estudiante);
}

async function inactivar(req, res) {
  const estudiante = await repo.inactivar(parseInt(req.params.id, 10));
  if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

  await auditoria.registrar({
    usuario_id: req.usuario?.id_usuario,
    accion: 'inactivar_estudiante',
    modulo: 'estudiantes',
    detalle: `Estudiante ${estudiante.id_estudiante} inactivado`,
  });

  res.json(estudiante);
}

module.exports = { listar, obtener, crear, inactivar };
