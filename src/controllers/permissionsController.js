// controllers/permissionsController.js
const pool = require('../config/database');

/**
 * Listar todas as permissões
 */
async function listPermissions(req, res) {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        icon, 
        module, 
        created_at
      FROM permissions 
      ORDER BY module, name
    `;
    
    const { rows } = await pool.query(query);
    
    res.json({ 
      success: true, 
      permissions: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('❌ Erro ao listar permissões:', err);
    res.status(500).json({ error: 'Erro ao listar permissões' });
  }
}

/**
 * Obter permissões de um usuário específico
 */
async function getUserPermissions(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se usuário existe
    const userCheck = await pool.query('SELECT id FROM auth_users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.icon,
        p.module,
        up.granted_at
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
      ORDER BY p.module, p.name
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    res.json({ 
      success: true, 
      user_id: parseInt(userId),
      permissions: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('❌ Erro ao obter permissões do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter permissões do usuário' });
  }
}

/**
 * Adicionar permissão a um usuário
 */
async function addUserPermission(req, res) {
  try {
    const { userId } = req.params;
    const { permission_id } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    if (!permission_id) {
      return res.status(400).json({ error: 'ID da permissão é obrigatório' });
    }

    // Verificar se usuário existe
    const userCheck = await pool.query('SELECT id FROM auth_users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se permissão existe
    const permCheck = await pool.query('SELECT id, name FROM permissions WHERE id = $1', [permission_id]);
    if (permCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    // Adicionar permissão
    const query = `
      INSERT INTO user_permissions (user_id, permission_id)
      VALUES ($1, $2)
      RETURNING id, user_id, permission_id, granted_at
    `;
    
    try {
      const { rows } = await pool.query(query, [userId, permission_id]);
      
      res.status(201).json({ 
        success: true, 
        message: `Permissão "${permCheck.rows[0].name}" adicionada com sucesso`,
        user_permission: rows[0]
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Usuário já possui esta permissão' });
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('❌ Erro ao adicionar permissão:', err);
    res.status(500).json({ error: 'Erro ao adicionar permissão' });
  }
}

/**
 * Remover permissão de um usuário
 */
async function removeUserPermission(req, res) {
  try {
    const { userId, permId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    if (!permId) {
      return res.status(400).json({ error: 'ID da permissão é obrigatório' });
    }

    // Verificar se relacionamento existe
    const checkQuery = `
      SELECT up.id, p.name 
      FROM user_permissions up
      INNER JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = $1 AND up.permission_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, permId]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não possui esta permissão' });
    }

    // Remover permissão
    const deleteQuery = `
      DELETE FROM user_permissions 
      WHERE user_id = $1 AND permission_id = $2
      RETURNING id
    `;
    
    await pool.query(deleteQuery, [userId, permId]);

    res.json({ 
      success: true, 
      message: `Permissão "${checkResult.rows[0].name}" removida com sucesso`
    });
  } catch (err) {
    console.error('❌ Erro ao remover permissão:', err);
    res.status(500).json({ error: 'Erro ao remover permissão' });
  }
}

/**
 * Criar permissão (admin only)
 */
async function createPermission(req, res) {
  try {
    const { name, description, icon, module } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da permissão é obrigatório' });
    }

    const query = `
      INSERT INTO permissions (name, description, icon, module)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, icon, module, created_at
    `;
    
    try {
      const { rows } = await pool.query(query, [name, description || null, icon || null, module || null]);
      
      res.status(201).json({ 
        success: true, 
        message: 'Permissão criada com sucesso',
        permission: rows[0]
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Permissão com este nome já existe' });
      }
      throw dbErr;
    }
  } catch (err) {
    console.error('❌ Erro ao criar permissão:', err);
    res.status(500).json({ error: 'Erro ao criar permissão' });
  }
}

module.exports = {
  listPermissions,
  getUserPermissions,
  addUserPermission,
  removeUserPermission,
  createPermission
};
