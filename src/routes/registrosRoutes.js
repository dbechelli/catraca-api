const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validateToken } = require('../middleware/auth');
const accessLogger = require('../middleware/accessLogger');
const {
  uploadRegistros,
  uploadConsolidado,
  listarRegistros,
  obterIndicadores,
  obterEstatisticas,
  deletarRegistros,
  conferenciaICMS
} = require('../controllers/registrosControllerConsolidado');

// Middleware para proteger todas as rotas
router.use(validateToken);
router.use(accessLogger());

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();

// Upload individual (compatibilidade)
const uploadSingle = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'), false);
    }
  }
});

// Upload múltiplo para processamento consolidado
const uploadMultiple = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por arquivo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'), false);
    }
  }
});

// Rotas

// Upload individual (mantido para compatibilidade)
router.post('/upload', uploadSingle.single('file'), uploadRegistros);

// Upload consolidado - NOVO
router.post('/upload-consolidado', uploadMultiple.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 }
]), uploadConsolidado);

// Listar registros com filtros
router.get('/', listarRegistros);

// Obter indicadores
router.get('/indicadores', obterIndicadores);

// Obter estatísticas
router.get('/estatisticas', obterEstatisticas);

// Deletar registros
router.delete('/', deletarRegistros);

// Conferencia ICMS CTE
router.get('/conferencia-icms-cte', conferenciaICMS);

module.exports = router;
