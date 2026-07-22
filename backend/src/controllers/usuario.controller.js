const service = require('../services/usuario.service');
const auditoria = require('../services/auditoria.service');

// POST /api/usuarios  { username, password, rol, sede_id, estudiante_id }
// Solo dirección o administrador de sede pueden crear cuentas (RF-10).
async function crear(req, res) {
  const { username, password, rol, sede_id, estudiante_id } = req.body;

  // Un administrador_sede solo puede crear cuentas para su propia sede.
  if (req.usuario.rol === 'administrador_sede' && sede_id !== req.usuario.sede_id) {
    return res.status(403).json({ error: 'Solo puedes crear usuarios de tu propia sede.' });
  }

  const resultado = await service.crearUsuario({
    username,
    password,
    rol,
    sedeId: sede_id,
    estudianteId: estudiante_id,
  });

  if (!resultado.ok) {
    return res.status(400).json({ error: resultado.mensaje });
  }

  await auditoria.registrar({
    usuario_id: req.usuario?.id_usuario,
    accion: 'crear_usuario',
    modulo: 'seguridad',
    detalle: `Usuario ${resultado.usuario.id_usuario} (${resultado.usuario.username}, rol ${resultado.usuario.rol}) creado`,
  });

  res.status(201).json(resultado.usuario);
}

async function listar(req, res) {
  const sedeId = req.query.sede_id ? parseInt(req.query.sede_id, 10) : undefined;
  const usuarios = await service.listarUsuarios({ sedeId });
  res.json(usuarios);
}

module.exports = { crear, listar };
