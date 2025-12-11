// middleware/accessLogger.js
const pool = require('../config/database');

function accessLogger() {
  return async (req, res, next) => {
    const start = Date.now();
    const started_at = new Date();

    // salvar log inicial COM o user_id/username que foi setado antes
    const insert = `
      INSERT INTO auth_access_logs (user_id, username, path, method, started_at, meta)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;

    const user = req.user || {};
    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      const values = [user.id || null, user.username || null, req.originalUrl, req.method, started_at, JSON.stringify(meta)];
      const r = await pool.query(insert, values);
      const logId = r.rows[0].id;

      // quando responder, atualizar com finished_at e duration
      res.on('finish', async () => {
        const finished_at = new Date();
        const duration_ms = Date.now() - start;
        
        // Depois que o controller executou, captura req.user novamente em caso de ter sido setado
        const userUpdated = req.user || {};
        
        await pool.query(
          'UPDATE auth_access_logs SET finished_at=$1, duration_ms=$2, user_id=$3, username=$4 WHERE id=$5',
          [finished_at, duration_ms, userUpdated.id || null, userUpdated.username || null, logId]
        );
      });
    } catch (err) {
      console.error('Erro ao registrar log de acesso:', err);
    }
    
    next();
  };
}

module.exports = accessLogger;
