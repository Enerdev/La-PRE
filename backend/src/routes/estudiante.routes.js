const express = require('express');
const router = express.Router();
const controller = require('../controllers/estudiante.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, controller.listar);
router.get('/:id', verificarToken, controller.obtener);
router.post('/', verificarToken, permitirRoles('administrador_sede', 'direccion'), controller.crear);
router.patch('/:id/inactivar', verificarToken, permitirRoles('administrador_sede', 'direccion'), controller.inactivar);

module.exports = router;
