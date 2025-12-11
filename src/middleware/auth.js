// middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não configurada em .env');
  process.exit(1);
}

async function validateToken(req, res, next) {
  const auth = req.headers.authorization;
  console.log('[validateToken] Authorization header:', auth ? 'presente' : 'AUSENTE');
  
  if (!auth) return res.status(401).json({ error: 'Token não enviado' });
  
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[validateToken] Token decodificado, sub:', decoded.sub);
    
    // verificar blacklist
    const jti = decoded.jti;
    const r = await pool.query('SELECT 1 FROM auth_token_blacklist WHERE jti = $1 AND expired_at > now()', [jti]);
    if (r.rowCount > 0) return res.status(401).json({ error: 'Token revogado' });

    // anexar info do usuário ao req
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role
    };
    console.log('[validateToken] req.user setado:', req.user);
    next();
  } catch (err) {
    console.log('[validateToken] Erro:', err.message);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Validar token opcionalmente (não falha se não existir, mas popula req.user se existir)
async function validateTokenOptional(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth) {
    return next(); // Sem token, continua sem req.user
  }
  
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verifica blacklist
    const jti = decoded.jti;
    const r = await pool.query('SELECT 1 FROM auth_token_blacklist WHERE jti = $1 AND expired_at > now()', [jti]);
    if (r.rowCount > 0) {
      // Token revogado, continua sem req.user
      return next();
    }

    // Anexa info do usuário ao req
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (err) {
    // Token inválido, continua sem req.user
    next();
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (allowedRoles.includes(req.user.role) || req.user.role === 'superadmin') return next();
    return res.status(403).json({ error: 'Acesso negado' });
  };
}

module.exports = { validateToken, requireRole };
