const express = require('express');
const router = express.Router();
const controller = require('../controllers/asistencia.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

// El estudiante ve/genera su propio QR
router.get('/qr/:estudianteId', verificarToken, controller.generarQR);

// Solo personal de asistencia o administrador de sede pueden marcar
router.post('/', verificarToken, permitirRoles('personal_asistencia', 'administrador_sede'), controller.marcarAsistencia);

module.exports = router;
