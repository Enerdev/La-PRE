const authService = require('../services/auth.service');

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
  }

  const resultado = await authService.login(username, password);
  if (!resultado.ok) {
    return res.status(401).json({ error: resultado.mensaje });
  }

  res.json({ token: resultado.token, rol: resultado.rol });
}

module.exports = { login };
