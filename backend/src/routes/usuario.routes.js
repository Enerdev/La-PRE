const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuario.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, permitirRoles('direccion', 'administrador_sede'), controller.listar);
router.post('/', verificarToken, permitirRoles('direccion', 'administrador_sede'), controller.crear);

module.exports = router;
