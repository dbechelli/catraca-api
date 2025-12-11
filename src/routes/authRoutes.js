const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { validateToken } = require('../middleware/auth');

// Login: sem middlewares (grava o log dentro do controller)
router.post('/login', login);

// Logout: validateToken (apenas para validar token)
router.post('/logout', validateToken, logout);

module.exports = router;
