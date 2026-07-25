const express = require('express');
const router = express.Router();
const controller = require('../controllers/sede.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

// La lista de sedes se puede consultar sin estar autenticado para soportar
// el registro de estudiantes desde la pantalla de login.
router.get('/', controller.listar);
router.post('/', verificarToken, permitirRoles('direccion'), controller.crear);

module.exports = router;
