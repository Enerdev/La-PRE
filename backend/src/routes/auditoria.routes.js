const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditoria.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

// Solo dirección puede ver la bitácora completa (RF-11).
router.get('/', verificarToken, permitirRoles('direccion'), controller.listar);

module.exports = router;
