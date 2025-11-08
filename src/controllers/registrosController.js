const pool = require('../config/database');
const { processarExcel } = require('../utils/excelProcessor');

/**
 * Upload e processamento de arquivo Excel
 */
async function uploadRegistros(req, res) {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const { catracaId } = req.body;
    
    if (!catracaId || (catracaId !== '1' && catracaId !== '2')) {
      return res.status(400).json({ error: 'catraca_id inválido (deve ser 1 ou 2)' });
    }
    
    // Processar Excel
    const registros = processarExcel(req.file.buffer, parseInt(catracaId));
    
    if (registros.length === 0) {
      return res.status(400).json({ error: 'Nenhum registro encontrado no arquivo' });
    }
    
    await client.query('BEGIN');
    
    let inseridos = 0;
    
    for (const registro of registros) {
      // 🔹 Garantir formato de data compatível com o PostgreSQL
      const dataFormatada = registro.data 
        ? new Date(registro.data).toISOString().split('T')[0] // yyyy-MM-dd
        : null;
      
      const query = `
        INSERT INTO registros_catraca 
        (nome, data, horario_entrada, horario_saida, minutos_total, catraca_id, grupo_horario, is_duplicado, arquivo_origem)
        VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        registro.nome,
        dataFormatada,
        registro.horario_entrada,
        registro.horario_saida,
        registro.minutos_total,
        registro.catraca_id,
        registro.grupo_horario,
        registro.is_duplicado,
        req.file.originalname
      ];
      
      await client.query(query, values);
      inseridos++;
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: `${inseridos} registros inseridos com sucesso`,
      total: inseridos,
      arquivo: req.file.originalname,
      catraca_id: parseInt(catracaId)
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar upload:', error);
    res.status(500).json({ 
      error: 'Erro ao processar arquivo',
      details: error.message 
    });
  } finally {
    client.release();
  }
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
      catraca_id, 
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

    if (catraca_id) {
      query += ` AND catraca_id = $${paramIndex}`;
      values.push(parseInt(catraca_id));
      paramIndex++;
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
 * Obter indicadores por grupo de horário (com suporte a período)
 */
async function obterIndicadores(req, res) {
  try {
    const { data, data_inicial, data_final, catraca_id } = req.query;

    const parseDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
    const d = parseDate(data);
    const dIni = parseDate(data_inicial);
    const dFim = parseDate(data_final);

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (d) {
      whereClause += ` AND data = $${paramIndex}::date`;
      values.push(d);
      paramIndex++;
    } else {
      if (dIni && dFim) {
        whereClause += ` AND data BETWEEN $${paramIndex}::date AND $${paramIndex + 1}::date`;
        values.push(dIni, dFim);
        paramIndex += 2;
      } else if (dIni) {
        whereClause += ` AND data >= $${paramIndex}::date`;
        values.push(dIni);
        paramIndex++;
      } else if (dFim) {
        whereClause += ` AND data <= $${paramIndex}::date`;
        values.push(dFim);
        paramIndex++;
      }
    }

    if (catraca_id) {
      whereClause += ` AND catraca_id = $${paramIndex}`;
      values.push(parseInt(catraca_id));
      paramIndex++;
    }

    const query = `
      SELECT 
        grupo_horario,
        COUNT(*) as total,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as duplicados,
        AVG(minutos_total) as media_minutos
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

    const indicadores = {
      cafe: { total: 0, duplicados: 0, media_minutos: 0 },
      almoco: { total: 0, duplicados: 0, media_minutos: 0 },
      janta: { total: 0, duplicados: 0, media_minutos: 0 },
      outro: { total: 0, duplicados: 0, media_minutos: 0 }
    };
    
    result.rows.forEach(row => {
      indicadores[row.grupo_horario] = {
        total: parseInt(row.total),
        duplicados: parseInt(row.duplicados),
        media_minutos: parseFloat(row.media_minutos || 0).toFixed(0)
      };
    });
    
    const totalQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as duplicados
      FROM registros_catraca
      ${whereClause}
    `;
    
    const totalResult = await pool.query(totalQuery, values);
    
    res.json({
      success: true,
      indicadores,
      total_geral: {
        total: parseInt(totalResult.rows[0].total),
        duplicados: parseInt(totalResult.rows[0].duplicados)
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
 * Deletar registros (limpar banco) - com suporte a período
 */
async function deletarRegistros(req, res) {
  try {
    const { data, data_inicial, data_final, catraca_id } = req.query;

    const parseDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
    const d = parseDate(data);
    const dIni = parseDate(data_inicial);
    const dFim = parseDate(data_final);

    if (!d && !dIni && !dFim && !catraca_id) {
      return res.status(400).json({ 
        error: 'Forneça ao menos um filtro (data, data_inicial, data_final ou catraca_id) para deletar' 
      });
    }

    let query = 'DELETE FROM registros_catraca WHERE 1=1';
    const values = [];
    let paramIndex = 1;

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

    if (catraca_id) {
      query += ` AND catraca_id = $${paramIndex}`;
      values.push(parseInt(catraca_id));
    }

    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: `${result.rowCount} registros deletados`,
      deletados: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao deletar registros:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar registros',
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
        COUNT(CASE WHEN catraca_id = 1 THEN 1 END) as catraca_01,
        COUNT(CASE WHEN catraca_id = 2 THEN 1 END) as catraca_02,
        COUNT(CASE WHEN is_duplicado = true THEN 1 END) as total_duplicados,
        MIN(data) as primeira_data,
        MAX(data) as ultima_data
      FROM registros_catraca
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      estatisticas: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message 
    });
  }
}

module.exports = {
  uploadRegistros,
  listarRegistros,
  obterIndicadores,
  deletarRegistros,
  obterEstatisticas
};
