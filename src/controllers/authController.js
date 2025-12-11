// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não configurada em .env');
  process.exit(1);
}
const JWT_EXPIRES = '10h'; // 10 horas

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

    const q = 'SELECT * FROM auth_users WHERE username = $1 AND active = true';
    const { rows } = await pool.query(q, [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    // Se o usuário já tem um token ativo, revoga ele primeiro
    if (user.active_jti) {
      const jtiExpiresAt = user.jti_expires_at || new Date(Date.now() + 10 * 3600 * 1000);
      await pool.query(
        'INSERT INTO auth_token_blacklist (jti, expired_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING',
        [user.active_jti, jtiExpiresAt]
      );
    }

    // gerar novo jti
    const jti = uuidv4();
    const jtiExpiresAt = new Date(Date.now() + 10 * 3600 * 1000); // 10 horas

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      jti
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // atualizar last_login E o active_jti
    await pool.query(
      'UPDATE auth_users SET last_login = now(), active_jti = $1, jti_expires_at = $2 WHERE id = $3',
      [jti, jtiExpiresAt, user.id]
    );

    // GRAVAR O LOG DE LOGIN AQUI
    const started_at = new Date();
    const meta = JSON.stringify({
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await pool.query(
      'INSERT INTO auth_access_logs (user_id, username, path, method, started_at, finished_at, duration_ms, meta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [user.id, user.username, req.originalUrl, req.method, started_at, started_at, 0, meta]
    );

    res.json({
      success: true,
      token,
      expires_in: JWT_EXPIRES,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
}

async function logout(req, res) {
  try {
    // req.user já foi setado pelo validateToken middleware
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

    // token deve vir no Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Sem token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const jti = decoded.jti;
    const exp = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 10 * 3600 * 1000);

    // inserir na blacklist
    await pool.query('INSERT INTO auth_token_blacklist (jti, expired_at) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING', [jti, exp]);

    // limpar o active_jti do usuário
    await pool.query('UPDATE auth_users SET active_jti = NULL, jti_expires_at = NULL WHERE id = $1', [req.user.id]);

    // GRAVAR O LOG DE LOGOUT AQUI
    const logoutTime = new Date();
    const meta = JSON.stringify({
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await pool.query(
      'INSERT INTO auth_access_logs (user_id, username, path, method, started_at, finished_at, duration_ms, meta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, req.user.username, req.originalUrl, req.method, logoutTime, logoutTime, 0, meta]
    );

    return res.json({ success: true, message: 'Logout efetuado' });
  } catch (err) {
    console.error('❌ Erro no logout:', err);
    return res.status(400).json({ error: 'Token inválido' });
  }
}

module.exports = { login, logout };