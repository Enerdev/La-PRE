const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporte.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.get('/sede/:sedeId', verificarToken, permitirRoles('administrador_sede', 'direccion'), controller.porSede);
router.get('/general', verificarToken, permitirRoles('direccion'), controller.general);

module.exports = router;
