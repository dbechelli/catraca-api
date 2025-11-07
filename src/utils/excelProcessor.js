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
  
  // Almoço: 10:40 até 13:59
  if (minutosDoDia >= 10 * 60 + 40 && minutosDoDia < 14 * 60) return 'almoco';
  
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
 * Processa o arquivo Excel e retorna dados estruturados
 */
function processarExcel(buffer, catracaId) {
  const workbook = XLSX.read(buffer);
  
  // Identificar as planilhas de entrada e saída
  const entradaSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('entrada'));
  const saidaSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('saida'));
  
  if (!entradaSheetName || !saidaSheetName) {
    throw new Error('Planilhas de Entrada e/ou Saída não encontradas');
  }
  
  // Ler planilhas pulando as linhas corretas
  const entradaSheet = workbook.Sheets[entradaSheetName];
  const saidaSheet = workbook.Sheets[saidaSheetName];
  
  // Converter para JSON pulando linhas 0,1,2,4 (mantendo linha 3 como header)
  const entradas = XLSX.utils.sheet_to_json(entradaSheet, { range: 3 });
  const saidas = XLSX.utils.sheet_to_json(saidaSheet, { range: 3 });
  
  // Agrupar por nome e data
  const registrosPorChave = {};
  
  // Processar entradas
  entradas.forEach(row => {
    const nome = row.NOME?.trim();
    const data = formatarData(row.DATA);
    const hora = row.HORA;
    
    if (!nome || !data || !hora) return;
    
    const grupo = identificarGrupoHorario(hora);
    const chave = `${nome}|${data}|${grupo}`;
    
    if (!registrosPorChave[chave]) {
      registrosPorChave[chave] = {
        nome,
        data,
        grupo_horario: grupo,
        entradas: [],
        saidas: []
      };
    }
    
    registrosPorChave[chave].entradas.push(hora);
  });
  
  // Processar saídas
  saidas.forEach(row => {
    const nome = row.NOME?.trim();
    const data = formatarData(row.DATA);
    const hora = row.HORA;
    
    if (!nome || !data || !hora) return;
    
    const grupo = identificarGrupoHorario(hora);
    const chave = `${nome}|${data}|${grupo}`;
    
    if (!registrosPorChave[chave]) {
      registrosPorChave[chave] = {
        nome,
        data,
        grupo_horario: grupo,
        entradas: [],
        saidas: []
      };
    }
    
    registrosPorChave[chave].saidas.push(hora);
  });
  
  // Combinar entradas e saídas
  const registros = [];
  
  Object.values(registrosPorChave).forEach(registro => {
    const { nome, data, grupo_horario, entradas, saidas } = registro;
    
    // Ordenar horários
    entradas.sort();
    saidas.sort();
    
    // Parear entrada com saída mais próxima
    const maxPares = Math.max(entradas.length, saidas.length);
    
    for (let i = 0; i < maxPares; i++) {
      const horarioEntrada = entradas[i] || null;
      const horarioSaida = saidas[i] || null;
      const minutosTotal = calcularMinutos(horarioEntrada, horarioSaida);
      
      // Detectar duplicidade: mais de 1 registro no mesmo grupo
      const isDuplicado = maxPares > 1 && i > 0;
      
      registros.push({
        nome,
        data,
        horario_entrada: horarioEntrada,
        horario_saida: horarioSaida,
        minutos_total: minutosTotal,
        catraca_id: catracaId,
        grupo_horario,
        is_duplicado: isDuplicado
      });
    }
  });
  
  return registros;
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

module.exports = {
  processarExcel,
  identificarGrupoHorario,
  calcularMinutos,
  formatarData
};
