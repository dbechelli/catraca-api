const pool = require('../config/database');
const { processarExcelConsolidado } = require('../utils/excelProcessorConsolidado');

/**
 * Upload e processamento consolidado de arquivos Excel
 * Processa arquivos de múltiplas catracas e combina entrada/saída
 */
async function uploadConsolidado(req, res) {
  const client = await pool.connect();
  
  try {
    // Verificar se pelo menos um arquivo foi enviado
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const file1 = req.files['file1'] ? req.files['file1'][0] : null;
    const file2 = req.files['file2'] ? req.files['file2'][0] : null;

    if (!file1 && !file2) {
      return res.status(400).json({ error: 'É necessário pelo menos um arquivo' });
    }

    // Processar arquivos de forma consolidada
    const registrosConsolidados = await processarExcelConsolidado(file1, file2);
    
    if (registrosConsolidados.length === 0) {
      return res.status(400).json({ error: 'Nenhum registro encontrado nos arquivos' });
    }

    // Iniciar transação
    await client.query('BEGIN');

    // Limpar registros anteriores da mesma data (opcional)
    // const datasUnicas = [...new Set(registrosConsolidados.map(r => r.data))];
    // for (const data of datasUnicas) {
    //   await client.query('DELETE FROM registros_catraca WHERE data = $1', [data]);
    // }

    // Inserir registros consolidados
    let inseridos = 0;
    let pareados = 0;
    let duplicados = 0;
    
    for (const registro of registrosConsolidados) {
      const query = `
        INSERT INTO registros_catraca 
        (nome, data, horario_entrada, horario_saida, minutos_total, 
         catraca_entrada, catraca_saida, grupo_horario, is_duplicado, 
         arquivo_origem, observacoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      const values = [
        registro.nome,
        registro.data,
        registro.horario_entrada,
        registro.horario_saida,
        registro.minutos_total,
        registro.catraca_entrada,
        registro.catraca_saida,
        registro.grupo_horario,
        registro.is_duplicado,
        registro.arquivo_origem,
        registro.observacoes || null
      ];
      
      await client.query(query, values);
      inseridos++;
      
      if (registro.horario_entrada && registro.horario_saida) {
        pareados++;
      }
      
      if (registro.is_duplicado) {
        duplicados++;
      }
    }
    
    // Commit transação
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: `${inseridos} registros processados com sucesso`,
      total: inseridos,
      detalhes: {
        pareados,
        duplicados,
        arquivos: {
          catraca1: file1 ? file1.originalname : null,
          catraca2: file2 ? file2.originalname : null
        }
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar upload consolidado:', error);
    res.status(500).json({ 
      error: 'Erro ao processar arquivos',
      details: error.message 
    });
  } finally {
    client.release();
  }
}

/**
 * Upload individual (mantido para compatibilidade)
 */
async function uploadRegistros(req, res) {
  // Código existente do upload individual
  // ... mantido como estava
}

/**
 * Listar registros com filtros (incluindo período de datas)
 */
async function listarRegistros(req, res) {
  try {
    const { 
      nome, 
      data,           
      data_inicial,   
      data_final,
      grupo_horario, 
      duplicados 
    } = req.query;
    
    let query = 'SELECT * FROM registros_catraca WHERE 1=1';
    const values = [];
    let paramIndex = 1;
    
    if (nome) {
      query += ` AND nome ILIKE $${paramIndex}`;
      values.push(`%${nome}%`);
      paramIndex++;
    }

    // 🔹 Conversão segura para formato ISO (YYYY-MM-DD)
    const parseDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
    const d = parseDate(data);
    const dIni = parseDate(data_inicial);
    const dFim = parseDate(data_final);
    
    if (d) {
      query += ` AND data = $${paramIndex}::date`;
      values.push(d);
      paramIndex++;
    } else {
      if (dIni && dFim) {
        query += ` AND data BETWEEN $${paramIndex}::date AND $${paramIndex + 1}::date`;
        values.push(dIni, dFim);
        paramIndex += 2;
      } else if (dIni) {
        query += ` AND data >= $${paramIndex}::date`;
        values.push(dIni);
        paramIndex++;
      } else if (dFim) {
        query += ` AND data <= $${paramIndex}::date`;
        values.push(dFim);
        paramIndex++;
      }
    }

    if (grupo_horario) {
      query += ` AND grupo_horario = $${paramIndex}`;
      values.push(grupo_horario);
      paramIndex++;
    }

    if (duplicados === 'true') {
      query += ' AND is_duplicado = true';
    } else if (duplicados === 'false') {
      query += ' AND is_duplicado = false';
    }
    
    query += ' ORDER BY data DESC, horario_entrada DESC';
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      total: result.rows.length,
      registros: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao listar registros:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar registros',
      details: error.message 
    });
  }
}

/**
 * Obter indicadores por grupo de horário
 */
async function obterIndicadores(req, res) {
  try {
    const { data, catraca_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;
    
    if (data) {
      whereClause += ` AND data = $${paramIndex}`;
      values.push(data);
      paramIndex++;
    }
    
    if (catraca_id) {
      whereClause += ` AND (catraca_entrada = $${paramIndex} OR catraca_saida = $${paramIndex})`;
      values.push(parseInt(catraca_id));
      paramIndex++;
    }
    
    const query = `
      SELECT 
        grupo_horario,
        COUNT(*) as total,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as duplicados,
        AVG(minutos_total) as media_minutos,
        COUNT(CASE WHEN horario_entrada IS NOT NULL AND horario_saida IS NOT NULL THEN 1 END) as pareados
      FROM registros_catraca
      ${whereClause}
      GROUP BY grupo_horario
      ORDER BY 
        CASE grupo_horario 
          WHEN 'cafe' THEN 1 
          WHEN 'almoco' THEN 2 
          WHEN 'janta' THEN 3 
          ELSE 4 
        END
    `;
    
    const result = await pool.query(query, values);
    
    // Formatar resposta
    const indicadores = {
      cafe: { total: 0, duplicados: 0, media_minutos: 0, pareados: 0 },
      almoco: { total: 0, duplicados: 0, media_minutos: 0, pareados: 0 },
      janta: { total: 0, duplicados: 0, media_minutos: 0, pareados: 0 },
      outro: { total: 0, duplicados: 0, media_minutos: 0, pareados: 0 }
    };
    
    result.rows.forEach(row => {
      indicadores[row.grupo_horario] = {
        total: parseInt(row.total),
        duplicados: parseInt(row.duplicados),
        media_minutos: parseFloat(row.media_minutos || 0).toFixed(0),
        pareados: parseInt(row.pareados)
      };
    });
    
    // Total geral
    const totalQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as duplicados,
        COUNT(CASE WHEN horario_entrada IS NOT NULL AND horario_saida IS NOT NULL THEN 1 END) as pareados
      FROM registros_catraca
      ${whereClause}
    `;
    
    const totalResult = await pool.query(totalQuery, values);
    
    res.json({
      success: true,
      indicadores,
      total_geral: {
        total: parseInt(totalResult.rows[0].total),
        duplicados: parseInt(totalResult.rows[0].duplicados),
        pareados: parseInt(totalResult.rows[0].pareados)
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter indicadores:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar indicadores',
      details: error.message 
    });
  }
}

/**
 * Obter estatísticas gerais
 */
async function obterEstatisticas(req, res) {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT nome) as total_pessoas,
        COUNT(DISTINCT data) as total_dias,
        COUNT(*) as total_registros,
        COUNT(CASE WHEN catraca_entrada = 1 OR catraca_saida = 1 THEN 1 END) as catraca_01,
        COUNT(CASE WHEN catraca_entrada = 2 OR catraca_saida = 2 THEN 1 END) as catraca_02,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as total_duplicados,
        COUNT(CASE WHEN horario_entrada IS NOT NULL AND horario_saida IS NOT NULL THEN 1 END) as total_pareados,
        MIN(data) as primeira_data,
        MAX(data) as ultima_data
      FROM registros_catraca
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      estatisticas: {
        total_pessoas: parseInt(stats.total_pessoas),
        total_dias: parseInt(stats.total_dias),
        total_registros: parseInt(stats.total_registros),
        catraca_01: parseInt(stats.catraca_01),
        catraca_02: parseInt(stats.catraca_02),
        total_duplicados: parseInt(stats.total_duplicados),
        total_pareados: parseInt(stats.total_pareados),
        primeira_data: stats.primeira_data,
        ultima_data: stats.ultima_data
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message 
    });
  }
}

/**
 * Deletar registros
 */
async function deletarRegistros(req, res) {
  try {
    const { data, catraca_id } = req.query;
    
    if (!data && !catraca_id) {
      return res.status(400).json({ 
        error: 'É necessário informar pelo menos data ou catraca_id' 
      });
    }
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;
    
    if (data) {
      whereClause += ` AND data = $${paramIndex}`;
      values.push(data);
      paramIndex++;
    }
    
    if (catraca_id) {
      whereClause += ` AND (catraca_entrada = $${paramIndex} OR catraca_saida = $${paramIndex})`;
      values.push(parseInt(catraca_id));
      paramIndex++;
    }
    
    const query = `
      DELETE FROM registros_catraca
      ${whereClause}
      RETURNING id
    `;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: `${result.rows.length} registros deletados`,
      deletados: result.rows.length
    });
    
  } catch (error) {
    console.error('Erro ao deletar registros:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar registros',
      details: error.message 
    });
  }
}

async function conferenciaICMS(req, res) {
  try {
    const { tomador, data_inicio, data_fim } = req.query;

    const query = `
      SELECT *
      FROM fn_conferencia_icms_cte($1, $2, $3)
    `;

    const result = await pool.query(query, [
      tomador || null,
      data_inicio || null,
      data_fim || null
    ]);

    res.json({
      success: true,
      total: result.rows.length,
      dados: result.rows
    });

  } catch (error) {
    console.error('Erro na conferência ICMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar conferência de ICMS',
      details: error.message
    });
  }
}


module.exports = {
  uploadRegistros,
  uploadConsolidado,
  listarRegistros,
  obterIndicadores,
  obterEstatisticas,
  deletarRegistros,
  conferenciaICMS
};
