const express = require('express');
const router = express.Router();
const controller = require('../controllers/academico.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

// Cualquier usuario autenticado puede ver simulacros y rankings ya publicados.
router.get('/', verificarToken, controller.listarSimulacros);
router.get('/:id/ranking', verificarToken, controller.rankingGeneral);
router.get('/:id/ranking/sede/:sedeId', verificarToken, controller.rankingPorSede);

// Solo dirección/administración puede crear simulacros, cargar resultados y cerrar/publicar.
router.post('/', verificarToken, permitirRoles('direccion', 'administrador_sede'), controller.crearSimulacro);
router.post('/:id/resultados', verificarToken, permitirRoles('direccion', 'administrador_sede'), controller.registrarResultados);
router.post('/:id/cerrar', verificarToken, permitirRoles('direccion', 'administrador_sede'), controller.cerrarYPublicar);

module.exports = router;
