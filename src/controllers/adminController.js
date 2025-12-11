// controllers/adminController.js
const pool = require('../config/database');

/**
 * Listar todos os usuários (somente para superadmin)
 */
async function listUsers(req, res) {
  try {
    const query = `
      SELECT 
        id, 
        username, 
        role, 
        active,
        created_at, 
        updated_at,
        last_login
      FROM auth_users 
      ORDER BY created_at DESC
    `;
    
    const { rows } = await pool.query(query);
    
    res.json({ 
      success: true, 
      users: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('❌ Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
}

/**
 * Criar novo usuário (somente para superadmin)
 */
async function createUser(req, res) {
  try {
    const { username, password, role = 'user' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO auth_users (username, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, username, role, created_at
    `;
    
    const { rows } = await pool.query(query, [username, passwordHash, role]);
    
    res.status(201).json({ 
      success: true, 
      user: rows[0],
      message: 'Usuário criado com sucesso'
    });
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
}

/**
 * Atualizar usuário (somente para superadmin)
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, active } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }
    
    const query = `
      UPDATE auth_users 
      SET role = COALESCE($1, role), 
          active = COALESCE($2, active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, role, active, updated_at
    `;
    
    const { rows } = await pool.query(query, [role || null, active !== undefined ? active : null, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ 
      success: true, 
      user: rows[0],
      message: 'Usuário atualizado com sucesso'
    });
  } catch (err) {
    console.error('❌ Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
}

/**
 * Deletar usuário (somente para superadmin)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }
    
    // Impedir que o próprio superadmin se delete
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }
    
    const query = 'DELETE FROM auth_users WHERE id = $1 RETURNING id, username';
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ 
      success: true, 
      deleted_user: rows[0],
      message: 'Usuário deletado com sucesso'
    });
  } catch (err) {
    console.error('❌ Erro ao deletar usuário:', err);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
