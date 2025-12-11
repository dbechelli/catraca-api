// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { validateToken, requireRole } = require('../middleware/auth');
const accessLogger = require('../middleware/accessLogger');

// Middleware para proteger todas as rotas admin - somente superadmin
router.use(validateToken);
router.use(accessLogger());
router.use(requireRole('superadmin'));

// GET - Listar todos os usuários
router.get('/users', listUsers);

// POST - Criar novo usuário
router.post('/users', createUser);

// PUT - Atualizar usuário
router.put('/users/:id', updateUser);

// DELETE - Deletar usuário
router.delete('/users/:id', deleteUser);

module.exports = router;
