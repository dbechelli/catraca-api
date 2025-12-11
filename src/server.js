const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pool = require('./config/database');
const registrosRoutes = require('./routes/registrosRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://catratafront.visualsoftia.cloud",
    "https://www.catratafront.visualsoftia.cloud"
  ],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ API Sistema de Controle de Catracas',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/registros/upload',
      listar: 'GET /api/registros',
      indicadores: 'GET /api/registros/indicadores',
      estatisticas: 'GET /api/registros/estatisticas',
      deletar: 'DELETE /api/registros'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Rota de autenticação
app.use('/api/auth', authRoutes);

// Rotas administrativas
app.use('/api/admin', adminRoutes);

// Rotas principais
app.use('/api/registros', registrosRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 ====================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🚀 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log('🚀 ====================================');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT recebido. Encerrando servidor...');
  await pool.end();
  process.exit(0);
});
