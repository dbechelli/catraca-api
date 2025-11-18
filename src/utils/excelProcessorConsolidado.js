const XLSX = require('xlsx');

/**
 * Identifica o grupo de horário baseado na hora
 */
function identificarGrupoHorario(hora) {
  if (!hora) return null;
  
  const [h, m] = hora.split(':').map(Number);
  const minutosDoDia = h * 60 + m;
  
  // Café: até 10:39
  if (minutosDoDia < 10 * 60 + 40) return 'cafe';
  
  // Almoço: 10:40 até 17:49
  if (minutosDoDia >= 10 * 60 + 40 && minutosDoDia < 17 * 60 + 50) return 'almoco';
  
  // Janta: a partir das 18:00
  if (minutosDoDia >= 18 * 60) return 'janta';
  
  return 'outro';
}

/**
 * Calcula diferença de minutos entre dois horários
 */
function calcularMinutos(horaEntrada, horaSaida) {
  if (!horaEntrada || !horaSaida) return null;
  
  const [hE, mE, sE] = horaEntrada.split(':').map(Number);
  const [hS, mS, sS] = horaSaida.split(':').map(Number);
  
  const entrada = hE * 60 + mE + sE / 60;
  const saida = hS * 60 + mS + sS / 60;
  
  return Math.round(saida - entrada);
}

/**
 * Formata data para formato SQL (YYYY-MM-DD)
 */
function formatarData(data) {
  if (!data) return null;
  
  // Se já estiver no formato YYYY-MM-DD
  if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return data;
  }
  
  // Se for string no formato DD/MM/YYYY
  if (typeof data === 'string' && data.includes('/')) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  // Se for número do Excel (dias desde 1900)
  if (typeof data === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (data - 2) * 24 * 60 * 60 * 1000);
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  return null;
}

/**
 * Processa um único arquivo Excel e retorna dados estruturados
 */
function processarArquivo(buffer, catracaId) {
  const workbook = XLSX.read(buffer);
  
  // Identificar as planilhas de entrada e saída
  const entradaSheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('entrada')
  );
  const saidaSheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('saida') || name.toLowerCase().includes('saída')
  );
  
  const registros = [];
  
  // Processar planilha de entrada
  if (entradaSheetName) {
    const entradaSheet = workbook.Sheets[entradaSheetName];
    const entradas = XLSX.utils.sheet_to_json(entradaSheet, { range: 3 });
    
    entradas.forEach(row => {
      const nome = row.NOME?.trim();
      const data = formatarData(row.DATA);
      const hora = row.HORA;
      
      if (nome && data && hora) {
        registros.push({
          nome,
          data,
          hora,
          tipo: 'entrada',
          catraca: catracaId
        });
      }
    });
  }
  
  // Processar planilha de saída
  if (saidaSheetName) {
    const saidaSheet = workbook.Sheets[saidaSheetName];
    const saidas = XLSX.utils.sheet_to_json(saidaSheet, { range: 3 });
    
    saidas.forEach(row => {
      const nome = row.NOME?.trim();
      const data = formatarData(row.DATA);
      const hora = row.HORA;
      
      if (nome && data && hora) {
        registros.push({
          nome,
          data,
          hora,
          tipo: 'saida',
          catraca: catracaId
        });
      }
    });
  }
  
  return registros;
}

/**
 * Processa arquivos de forma consolidada
 * Combina entrada e saída mesmo quando em catracas diferentes
 */
async function processarExcelConsolidado(file1, file2) {
  const todosRegistros = [];
  const arquivosOrigem = [];
  
  // Processar arquivo 1
  if (file1) {
    const registros1 = processarArquivo(file1.buffer, 1);
    todosRegistros.push(...registros1);
    arquivosOrigem.push(file1.originalname);
  }
  
  // Processar arquivo 2
  if (file2) {
    const registros2 = processarArquivo(file2.buffer, 2);
    todosRegistros.push(...registros2);
    arquivosOrigem.push(file2.originalname);
  }
  
  // Agrupar por pessoa + data
  const registrosPorPessoaDia = {};
  
  todosRegistros.forEach(registro => {
    const chave = `${registro.nome}|${registro.data}`;
    
    if (!registrosPorPessoaDia[chave]) {
      registrosPorPessoaDia[chave] = {
        nome: registro.nome,
        data: registro.data,
        entradas: [],
        saidas: []
      };
    }
    
    if (registro.tipo === 'entrada') {
      registrosPorPessoaDia[chave].entradas.push({
        hora: registro.hora,
        catraca: registro.catraca
      });
    } else {
      registrosPorPessoaDia[chave].saidas.push({
        hora: registro.hora,
        catraca: registro.catraca
      });
    }
  });
  
  // Processar e parear entradas com saídas
  const registrosFinais = [];
  
  Object.values(registrosPorPessoaDia).forEach(pessoa => {
    // Ordenar horários
    pessoa.entradas.sort((a, b) => a.hora.localeCompare(b.hora));
    pessoa.saidas.sort((a, b) => a.hora.localeCompare(b.hora));
    
    // Agrupar por período do dia
    const periodos = {};
    
    // Processar entradas
    pessoa.entradas.forEach(entrada => {
      const grupo = identificarGrupoHorario(entrada.hora);
      if (!periodos[grupo]) {
        periodos[grupo] = { entradas: [], saidas: [] };
      }
      periodos[grupo].entradas.push(entrada);
    });
    
    // Processar saídas
    pessoa.saidas.forEach(saida => {
      const grupo = identificarGrupoHorario(saida.hora);
      if (!periodos[grupo]) {
        periodos[grupo] = { entradas: [], saidas: [] };
      }
      periodos[grupo].saidas.push(saida);
    });
    
    // Criar registros para cada período
    Object.entries(periodos).forEach(([grupo, periodo]) => {
      const entradasDoPeriodo = periodo.entradas;
      const saidasDoPeriodo = periodo.saidas;
      
      // Tentar parear entrada com saída mais próxima
      const maxRegistros = Math.max(entradasDoPeriodo.length, saidasDoPeriodo.length);
      
      for (let i = 0; i < maxRegistros; i++) {
        const entrada = entradasDoPeriodo[i];
        const saida = saidasDoPeriodo[i];
        
        // Detectar duplicidade no grupo
        const isDuplicado = i > 0;
        
        const registro = {
          nome: pessoa.nome,
          data: pessoa.data,
          horario_entrada: entrada ? entrada.hora : null,
          horario_saida: saida ? saida.hora : null,
          minutos_total: entrada && saida ? calcularMinutos(entrada.hora, saida.hora) : null,
          catraca_entrada: entrada ? entrada.catraca : null,
          catraca_saida: saida ? saida.catraca : null,
          grupo_horario: grupo,
          is_duplicado: isDuplicado,
          arquivo_origem: arquivosOrigem.join('; '),
          observacoes: null
        };
        
        // Adicionar observações especiais
        if (!entrada && saida) {
          registro.observacoes = 'Apenas saída registrada';
        } else if (entrada && !saida) {
          registro.observacoes = 'Apenas entrada registrada';
        } else if (entrada && saida && entrada.catraca !== saida.catraca) {
          registro.observacoes = 'Entrada e saída em catracas diferentes';
        }
        
        registrosFinais.push(registro);
      }
    });
  });
  
  return registrosFinais;
}

module.exports = {
  processarExcelConsolidado,
  identificarGrupoHorario,
  calcularMinutos,
  formatarData
};
