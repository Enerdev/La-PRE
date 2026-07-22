const jwt = require('jsonwebtoken');

// Verifica que exista un JWT válido en el header Authorization: Bearer <token>
function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
    req.usuario = payload; // { id_usuario, rol, sede_id, estudiante_id }
    next();
  });
}

// Middleware factory: restringe el acceso a los roles indicados (RF-10 / RBAC)
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' });
    }
    next();
  };
}

module.exports = { verificarToken, permitirRoles };
