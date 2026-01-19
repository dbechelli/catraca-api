const express = require('express');
const router = express.Router();
const { validateToken } = require('../middleware/auth');
const accessLogger = require('../middleware/accessLogger');
const { getFluxoDiario } = require('../controllers/financeiroController');

router.use(validateToken);
router.use(accessLogger());

router.get('/fluxo-diario', getFluxoDiario);

module.exports = router;
