const pool = require('../config/database');

async function getFluxoDiario(req, res) {
  try {
    const { data_inicial, data_final } = req.query;

    if (!data_inicial || !data_final) {
      return res.status(400).json({ error: 'Parâmetros data_inicial e data_final são obrigatórios.' });
    }

    const query = 'SELECT * FROM public.fn_fluxo_diario($1, $2)';
    const values = [data_inicial, data_final];

    const { rows } = await pool.query(query, values);

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar fluxo diário:', error);
    res.status(500).json({ error: 'Erro interno ao buscar fluxo diário.' });
  }
}

module.exports = {
  getFluxoDiario
};
