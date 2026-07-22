const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { limitadorLogin } = require('../middlewares/rateLimit.middleware');

router.post('/login', limitadorLogin, controller.login);

module.exports = router;
