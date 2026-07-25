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

async function registroEstudiante(req, res) {
  try {
    const resultado = await authService.registrarEstudiante(req.body);
    if (!resultado.ok) {
      return res.status(400).json({ error: resultado.mensaje });
    }
    res.status(201).json({ mensaje: resultado.mensaje });
  } catch (err) {
    console.error('Error en registroEstudiante:', err);
    res.status(500).json({ error: 'Error interno al registrar el estudiante.' });
  }
}

module.exports = { login, registroEstudiante };

