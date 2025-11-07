# 🍽️ API Sistema de Controle de Catracas

API REST para gerenciamento de registros de catracas com upload de arquivos Excel.

## 🚀 Tecnologias

- Node.js + Express
- PostgreSQL
- Multer (upload de arquivos)
- xlsx (processamento de Excel)

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais do PostgreSQL (Coolify)

5. Execute o servidor:
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

## 🔧 Configuração do .env

```env
# PostgreSQL - Coolify
DB_HOST=seu-host.coolify.io
DB_PORT=5432
DB_NAME=catraca_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📡 Endpoints

### Base URL
```
http://localhost:3000
```

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-06T..."
}
```

---

### 2. Upload de Arquivo Excel
```http
POST /api/registros/upload
```

**Form Data:**
- `file`: arquivo Excel (.xlsx ou .xls)
- `catracaId`: "1" ou "2"

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@Relatorio_Catraca_01.xlsx" \
  -F "catracaId=1"
```

**Response:**
```json
{
  "success": true,
  "message": "129 registros inseridos com sucesso",
  "total": 129,
  "arquivo": "Relatorio_Catraca_01.xlsx",
  "catraca_id": 1
}
```

---

### 3. Listar Registros
```http
GET /api/registros
```

**Query Parameters (todos opcionais):**
- `nome`: filtrar por nome (busca parcial)
- `data`: filtrar por data (formato: YYYY-MM-DD)
- `catraca_id`: filtrar por catraca (1 ou 2)
- `grupo_horario`: filtrar por grupo (cafe, almoco, janta, outro)
- `duplicados`: filtrar duplicados (true/false)

**Exemplos:**
```bash
# Todos os registros
GET /api/registros

# Filtrar por nome
GET /api/registros?nome=João

# Filtrar por data e catraca
GET /api/registros?data=2025-11-04&catraca_id=1

# Apenas duplicados
GET /api/registros?duplicados=true

# Registros do almoço
GET /api/registros?grupo_horario=almoco
```

**Response:**
```json
{
  "success": true,
  "total": 272,
  "registros": [
    {
      "id": 1,
      "nome": "João Silva",
      "data": "2025-11-04",
      "horario_entrada": "07:30:00",
      "horario_saida": "07:45:00",
      "minutos_total": 15,
      "catraca_id": 1,
      "grupo_horario": "cafe",
      "is_duplicado": false,
      "arquivo_origem": "Relatorio_Catraca_01.xlsx",
      "created_at": "2025-11-06T..."
    }
  ]
}
```

---

### 4. Obter Indicadores
```http
GET /api/registros/indicadores
```

**Query Parameters (opcionais):**
- `data`: filtrar por data (YYYY-MM-DD)
- `catraca_id`: filtrar por catraca (1 ou 2)

**Exemplos:**
```bash
# Indicadores gerais
GET /api/registros/indicadores

# Indicadores de uma data específica
GET /api/registros/indicadores?data=2025-11-04

# Indicadores de uma catraca específica
GET /api/registros/indicadores?catraca_id=1
```

**Response:**
```json
{
  "success": true,
  "indicadores": {
    "cafe": {
      "total": 45,
      "duplicados": 2,
      "media_minutos": "18"
    },
    "almoco": {
      "total": 128,
      "duplicados": 5,
      "media_minutos": "25"
    },
    "janta": {
      "total": 89,
      "duplicados": 1,
      "media_minutos": "22"
    },
    "outro": {
      "total": 10,
      "duplicados": 0,
      "media_minutos": "15"
    }
  },
  "total_geral": {
    "total": 272,
    "duplicados": 8
  }
}
```

---

### 5. Obter Estatísticas
```http
GET /api/registros/estatisticas
```

**Response:**
```json
{
  "success": true,
  "estatisticas": {
    "total_pessoas": 156,
    "total_dias": 1,
    "total_registros": 272,
    "catraca_01": 129,
    "catraca_02": 143,
    "total_duplicados": 8,
    "primeira_data": "2025-11-04",
    "ultima_data": "2025-11-04"
  }
}
```

---

### 6. Deletar Registros
```http
DELETE /api/registros
```

**Query Parameters (ao menos um obrigatório):**
- `data`: deletar por data (YYYY-MM-DD)
- `catraca_id`: deletar por catraca (1 ou 2)

**Exemplos:**
```bash
# Deletar registros de uma data
DELETE /api/registros?data=2025-11-04

# Deletar registros de uma catraca
DELETE /api/registros?catraca_id=1

# Deletar registros de uma data E catraca
DELETE /api/registros?data=2025-11-04&catraca_id=1
```

**Response:**
```json
{
  "success": true,
  "message": "129 registros deletados",
  "deletados": 129
}
```

---

## 📊 Estrutura dos Dados

### Grupos de Horário:
- **café**: Entrada antes das 11h
- **almoco**: Entrada entre 11h e 14h
- **janta**: Entrada após 18h
- **outro**: Fora dos grupos principais

### Detecção de Duplicidade:
Registros são marcados como duplicados quando:
- Mesma pessoa
- Mesma data
- Mesmo grupo de horário
- Mais de uma entrada/saída no grupo

### Cálculo de Minutos:
```
minutos_total = horario_saida - horario_entrada
```

---

## 🧪 Testando a API

### 1. Testar conexão
```bash
curl http://localhost:3000/health
```

### 2. Upload de arquivo
```bash
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@caminho/do/arquivo.xlsx" \
  -F "catracaId=1"
```

### 3. Listar registros
```bash
curl http://localhost:3000/api/registros
```

### 4. Obter indicadores
```bash
curl http://localhost:3000/api/registros/indicadores
```

---

## 🐛 Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (se disponível)"
}
```

**Códigos HTTP:**
- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Erro na requisição (dados inválidos)
- `404`: Não encontrado
- `500`: Erro interno do servidor

---

## 📁 Estrutura do Projeto

```
catraca-api/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração PostgreSQL
│   ├── controllers/
│   │   └── registrosController.js  # Lógica de negócio
│   ├── routes/
│   │   └── registros.js         # Definição de rotas
│   ├── utils/
│   │   └── excelProcessor.js    # Processamento de Excel
│   └── server.js                # Servidor Express
├── .env                         # Variáveis de ambiente
├── .env.example                 # Exemplo de configuração
├── package.json
└── README.md
```

---

## 🔒 Segurança

- CORS configurado via variável de ambiente
- Validação de tipos de arquivo (apenas Excel)
- Limite de tamanho de arquivo: 10MB
- Credenciais do banco protegidas no .env
- Transações SQL para garantir integridade

---

## 🚀 Deploy (Coolify)

1. Configure as variáveis de ambiente no Coolify
2. Conecte o repositório Git
3. Coolify irá detectar automaticamente o Node.js
4. A aplicação estará disponível na URL fornecida

---

## 📝 Notas

- O arquivo Excel deve ter 2 planilhas: "Entrada Catraca XX" e "Saida Catraca XX"
- As linhas 1, 2, 3 e 5 são ignoradas automaticamente
- A linha 4 é usada como cabeçalho
- Colunas esperadas: NOME, DATA, HORA, DESCRIÇÃO

---

## 🤝 Suporte

Se encontrar algum problema, verifique:
1. Conexão com o PostgreSQL (endpoint `/health`)
2. Formato do arquivo Excel
3. Logs do servidor (console)

---

**Desenvolvido para Sistema de Controle de Catracas** 🍽️
