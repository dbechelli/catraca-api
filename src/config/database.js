const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // SSL configurável via variável de ambiente
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

// Log de debug da conexão
console.log(`📊 DB Config: host=${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
console.log(`🔐 SSL: ${process.env.DB_SSL === 'true' ? 'enabled' : 'disabled'}`);

// Testar conexão com retry
let connectionAttempts = 0;
const maxRetries = 3;

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL em:', res.rows[0].now);
    connectionAttempts = 0;
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Erro ao conectar (tentativa ${connectionAttempts}/${maxRetries}):`, err.code, err.message);
    
    if (connectionAttempts < maxRetries) {
      console.log(`⏳ Tentando novamente em 5s...`);
      setTimeout(testConnection, 5000);
    } else {
      console.error('❌ Falha ao conectar ao banco após', maxRetries, 'tentativas');
      console.error('Verifique:');
      console.error('  1. Se o host está online:', process.env.DB_HOST);
      console.error('  2. Se as credenciais estão corretas');
      console.error('  3. Se a rede do container consegue resolver DNS');
    }
  }
}

// Testar conexão ao iniciar
testConnection();

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err.code, err.message);
  // Não faz exit - deixa tentar reconectar
});

module.exports = pool;