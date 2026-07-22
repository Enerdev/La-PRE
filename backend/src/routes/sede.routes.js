const express = require('express');
const router = express.Router();
const controller = require('../controllers/sede.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, controller.listar);
router.post('/', verificarToken, permitirRoles('direccion'), controller.crear);

module.exports = router;
