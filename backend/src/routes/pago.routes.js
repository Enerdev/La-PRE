const express = require('express');
const router = express.Router();
const controller = require('../controllers/pago.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.post('/', verificarToken, permitirRoles('administrador_sede', 'direccion'), controller.registrarPago);
router.get('/estudiante/:id', verificarToken, controller.estadoDeCuenta);
router.get('/sede/:sedeId', verificarToken, permitirRoles('administrador_sede', 'direccion'), controller.pagosPorSede);

module.exports = router;
