const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pool = require('./config/database');
const registrosRoutes = require('./routes/registrosRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const permissionsRoutes = require('./routes/permissionsRoutes');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração manual do CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://transleg.visualsoftia.cloud",
    "https://www.transleg.visualsoftia.cloud",
    "https://saas.transleg.com.br",
    "https://www.saas.transleg.com.br"
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


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
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout'
      },
      registros: {
        upload: 'POST /api/registros/upload',
        listar: 'GET /api/registros',
        indicadores: 'GET /api/registros/indicadores',
        estatisticas: 'GET /api/registros/estatisticas',
        deletar: 'DELETE /api/registros'
      },
      admin: {
        listUsuarios: 'GET /api/admin/users',
        criarUsuario: 'POST /api/admin/users',
        atualizarUsuario: 'PUT /api/admin/users/:id',
        deletarUsuario: 'DELETE /api/admin/users/:id'
      },
      permissoes: {
        listar: 'GET /api/permissions',
        usuarioPermissoes: 'GET /api/permissions/:userId/permissions',
        adicionarPermissao: 'POST /api/permissions/:userId/permissions',
        removerPermissao: 'DELETE /api/permissions/:userId/permissions/:permId',
        criarPermissao: 'POST /api/permissions'
      },
      financeiro: {
        fluxoDiario: 'GET /api/financeiro/fluxo-diario?data_inicial=YYYY-MM-DD&data_final=YYYY-MM-DD'
      },
      health: 'GET /health'
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

// Rotas de permissões
app.use('/api/permissions', permissionsRoutes);

// Rotas principais
app.use('/api/registros', registrosRoutes);

// Rotas financeiras
app.use('/api/financeiro', financeiroRoutes);

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
