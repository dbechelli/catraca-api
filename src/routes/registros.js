const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  uploadRegistros,
  listarRegistros,
  obterIndicadores,
  deletarRegistros,
  obterEstatisticas
} = require('../controllers/registrosController');

// Configurar multer para upload em memória
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos (.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Rotas

/**
 * @route   POST /api/registros/upload
 * @desc    Upload e processamento de arquivo Excel
 * @body    { catracaId: "1" ou "2" }
 * @file    Excel file
 */
router.post('/upload', upload.single('file'), uploadRegistros);

/**
 * @route   GET /api/registros
 * @desc    Listar registros com filtros opcionais
 * @query   nome, data, catraca_id, grupo_horario, duplicados
 */
router.get('/', listarRegistros);

/**
 * @route   GET /api/registros/indicadores
 * @desc    Obter indicadores por grupo de horário
 * @query   data, catraca_id (opcionais)
 */
router.get('/indicadores', obterIndicadores);

/**
 * @route   GET /api/registros/estatisticas
 * @desc    Obter estatísticas gerais do sistema
 */
router.get('/estatisticas', obterEstatisticas);

/**
 * @route   DELETE /api/registros
 * @desc    Deletar registros com filtros
 * @query   data, catraca_id (ao menos um obrigatório)
 */
router.delete('/', deletarRegistros);

module.exports = router;
