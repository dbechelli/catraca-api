# 🚀 INÍCIO RÁPIDO - API Sistema de Catracas

## 📦 O que foi criado?

✅ API REST completa com Node.js + Express
✅ Integração com PostgreSQL (Coolify)
✅ Upload e processamento de arquivos Excel
✅ Sistema de detecção de duplicidades
✅ Indicadores por grupos de horário (café, almoço, janta)
✅ Filtros avançados
✅ Documentação completa

---

## 📁 Estrutura do Projeto

```
catraca-api/
├── src/
│   ├── config/
│   │   └── database.js              # Conexão PostgreSQL
│   ├── controllers/
│   │   └── registrosController.js   # Lógica de negócio
│   ├── routes/
│   │   └── registros.js             # Rotas da API
│   ├── utils/
│   │   └── excelProcessor.js        # Processamento de Excel
│   └── server.js                    # Servidor Express
├── .env.example                     # Exemplo de configuração
├── .gitignore
├── package.json                     # Dependências
├── README.md                        # Documentação completa
└── TESTES.md                        # Guia de testes
```

---

## ⚡ INSTALAÇÃO RÁPIDA (5 minutos)

### 1️⃣ Descompactar o arquivo
```bash
tar -xzf catraca-api.tar.gz
cd catraca-api
```

### 2️⃣ Instalar dependências
```bash
npm install
```

### 3️⃣ Configurar ambiente
```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas credenciais do PostgreSQL (Coolify)
nano .env   # ou seu editor preferido
```

**Arquivo .env:**
```env
DB_HOST=seu-host.coolify.io
DB_PORT=5432
DB_NAME=catraca_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

PORT=3000
NODE_ENV=development

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4️⃣ Rodar o servidor
```bash
# Desenvolvimento (recarrega automaticamente)
npm run dev

# Ou produção
npm start
```

Você verá:
```
🚀 ====================================
🚀 Servidor rodando na porta 3000
🚀 Ambiente: development
🚀 URL: http://localhost:3000
🚀 ====================================
✅ Conectado ao PostgreSQL
```

### 5️⃣ Testar
```bash
# Outro terminal
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-06T..."
}
```

---

## 🎯 PRIMEIRO UPLOAD

### Usando cURL (Terminal):
```bash
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@/caminho/do/Relatorio_Catraca_01.xlsx" \
  -F "catracaId=1"
```

### Usando Postman/Insomnia:
1. **POST** `http://localhost:3000/api/registros/upload`
2. **Body** → form-data
3. Adicionar:
   - `file` (tipo File) → selecionar Excel
   - `catracaId` (tipo Text) → "1" ou "2"
4. **Send**

---

## 📡 PRINCIPAIS ENDPOINTS

### Listar registros
```bash
GET http://localhost:3000/api/registros
```

### Com filtros
```bash
# Por nome
GET http://localhost:3000/api/registros?nome=João

# Por data
GET http://localhost:3000/api/registros?data=2025-11-04

# Apenas duplicados
GET http://localhost:3000/api/registros?duplicados=true

# Por grupo horário
GET http://localhost:3000/api/registros?grupo_horario=almoco
```

### Indicadores
```bash
GET http://localhost:3000/api/registros/indicadores
```

Retorna:
```json
{
  "indicadores": {
    "cafe": { "total": 45, "duplicados": 2, "media_minutos": "18" },
    "almoco": { "total": 128, "duplicados": 5, "media_minutos": "25" },
    "janta": { "total": 89, "duplicados": 1, "media_minutos": "22" }
  },
  "total_geral": { "total": 272, "duplicados": 8 }
}
```

### Estatísticas
```bash
GET http://localhost:3000/api/registros/estatisticas
```

---

## 🔧 CONFIGURAÇÕES IMPORTANTES

### Porta do servidor
Por padrão usa porta **3000**. Para mudar:
```env
PORT=8080
```

### CORS
Adicione as origens permitidas:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://seu-frontend.com
```

### Ambiente
```env
NODE_ENV=production  # ou development
```

---

## 📊 COMO FUNCIONA O PROCESSAMENTO

1. **Upload do Excel** → API recebe arquivo + catracaId
2. **Leitura das planilhas** → "Entrada Catraca XX" e "Saida Catraca XX"
3. **Pula linhas** → Ignora linhas 1, 2, 3 e 5 (linha 4 = cabeçalho)
4. **Agrupa por pessoa + data + horário** → Identifica grupos (café/almoço/janta)
5. **Combina entrada/saída** → Pareia os horários
6. **Calcula minutos** → saída - entrada
7. **Detecta duplicidades** → Mais de 1 registro no mesmo grupo
8. **Salva no PostgreSQL** → Transação segura

---

## ⚠️ RESOLUÇÃO DE PROBLEMAS

### Erro de conexão com banco
```bash
# Verificar
curl http://localhost:3000/health

# Se retornar "disconnected":
# 1. Verifique as credenciais no .env
# 2. Confirme que o PostgreSQL está acessível
# 3. Teste a conexão diretamente
```

### Erro no upload
- Arquivo deve ser .xlsx ou .xls
- Máximo 10MB
- Deve ter 2 planilhas (Entrada e Saída)
- Campo `catracaId` deve ser "1" ou "2"

### Servidor não inicia
```bash
# Verificar se a porta está em uso
lsof -i :3000

# Ou mudar a porta no .env
PORT=8080
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Toda a documentação está em:
- **README.md** → Documentação completa da API
- **TESTES.md** → Guia de testes passo a passo

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ API funcionando localmente
2. 🔜 Desenvolver Frontend React
3. 🔜 Deploy no Coolify
4. 🔜 Testes com dados reais

---

## 📞 COMANDOS ÚTEIS

```bash
# Iniciar desenvolvimento
npm run dev

# Iniciar produção
npm start

# Ver logs do servidor
# (já aparecem no terminal)

# Parar servidor
# Ctrl + C
```

---

## ✅ CHECKLIST

- [ ] Arquivo descompactado
- [ ] npm install executado
- [ ] .env configurado com credenciais corretas
- [ ] Servidor iniciado (npm run dev)
- [ ] Teste de health passou (curl /health)
- [ ] Upload de teste funcionou
- [ ] Dados apareceram no banco

---

**Tudo pronto! A API está funcionando! 🎉**

Agora você pode:
- Fazer uploads de arquivos Excel
- Consultar os registros via API
- Ver indicadores em tempo real
- Integrar com o frontend React

**Próximo passo:** Desenvolver o Frontend! 🚀
