// routes/permissionsRoutes.js
const express = require('express');
const router = express.Router();
const {
  listPermissions,
  getUserPermissions,
  addUserPermission,
  removeUserPermission,
  createPermission
} = require('../controllers/permissionsController');
const { validateToken, requireRole } = require('../middleware/auth');
const accessLogger = require('../middleware/accessLogger');

// Middleware para proteger todas as rotas de permissões
router.use(validateToken);
router.use(accessLogger());

// GET - Listar todas as permissões (todos os usuários autenticados)
router.get('/', listPermissions);

// GET - Obter permissões de um usuário específico (todos os usuários autenticados)
router.get('/:userId/permissions', getUserPermissions);

// POST - Adicionar permissão a um usuário (apenas superadmin)
router.post(
  '/:userId/permissions',
  requireRole('superadmin'),
  addUserPermission
);

// DELETE - Remover permissão de um usuário (apenas superadmin)
router.delete(
  '/:userId/permissions/:permId',
  requireRole('superadmin'),
  removeUserPermission
);

// POST - Criar nova permissão (apenas superadmin)
router.post(
  '/',
  requireRole('superadmin'),
  createPermission
);

module.exports = router;
