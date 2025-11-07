# TESTES DA API - Exemplos práticos

## 🧪 Guia Rápido de Testes

### 1️⃣ VERIFICAR SE O SERVIDOR ESTÁ RODANDO

```bash
curl http://localhost:3000/
```

Resposta esperada:
```json
{
  "message": "🍽️ API Sistema de Controle de Catracas",
  "version": "1.0.0",
  ...
}
```

---

### 2️⃣ TESTAR CONEXÃO COM BANCO DE DADOS

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

---

### 3️⃣ FAZER UPLOAD DO ARQUIVO (CATRACA 01)

**Opção A - Com cURL (Terminal):**
```bash
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@/caminho/completo/do/Relatorio_Catraca_01.xlsx" \
  -F "catracaId=1"
```

**Opção B - Com Postman/Insomnia:**
1. POST `http://localhost:3000/api/registros/upload`
2. Body → form-data
3. Adicionar campo `file` (tipo File) → selecionar o Excel
4. Adicionar campo `catracaId` (tipo Text) → valor "1"
5. Enviar

Resposta esperada:
```json
{
  "success": true,
  "message": "X registros inseridos com sucesso",
  "total": X,
  "arquivo": "Relatorio_Catraca_01.xlsx",
  "catraca_id": 1
}
```

---

### 4️⃣ LISTAR TODOS OS REGISTROS

```bash
curl http://localhost:3000/api/registros
```

---

### 5️⃣ BUSCAR POR NOME

```bash
curl "http://localhost:3000/api/registros?nome=João"
```

---

### 6️⃣ BUSCAR POR DATA

```bash
curl "http://localhost:3000/api/registros?data=2025-11-04"
```

---

### 7️⃣ BUSCAR APENAS DUPLICADOS

```bash
curl "http://localhost:3000/api/registros?duplicados=true"
```

---

### 8️⃣ BUSCAR REGISTROS DO ALMOÇO

```bash
curl "http://localhost:3000/api/registros?grupo_horario=almoco"
```

---

### 9️⃣ OBTER INDICADORES GERAIS

```bash
curl http://localhost:3000/api/registros/indicadores
```

Resposta esperada:
```json
{
  "success": true,
  "indicadores": {
    "cafe": { "total": 45, "duplicados": 2, "media_minutos": "18" },
    "almoco": { "total": 128, "duplicados": 5, "media_minutos": "25" },
    "janta": { "total": 89, "duplicados": 1, "media_minutos": "22" },
    "outro": { "total": 10, "duplicados": 0, "media_minutos": "15" }
  },
  "total_geral": { "total": 272, "duplicados": 8 }
}
```

---

### 🔟 OBTER ESTATÍSTICAS GERAIS

```bash
curl http://localhost:3000/api/registros/estatisticas
```

---

### 1️⃣1️⃣ DELETAR REGISTROS DE UMA DATA

⚠️ **CUIDADO: Isso deleta dados do banco!**

```bash
curl -X DELETE "http://localhost:3000/api/registros?data=2025-11-04"
```

---

### 1️⃣2️⃣ TESTE COMPLETO - FLUXO INTEIRO

```bash
# 1. Verificar servidor
curl http://localhost:3000/health

# 2. Upload Catraca 01
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@Relatorio_Catraca_01.xlsx" \
  -F "catracaId=1"

# 3. Upload Catraca 02
curl -X POST http://localhost:3000/api/registros/upload \
  -F "file=@Relatorio_Catraca_02.xlsx" \
  -F "catracaId=2"

# 4. Ver indicadores
curl http://localhost:3000/api/registros/indicadores

# 5. Ver estatísticas
curl http://localhost:3000/api/registros/estatisticas

# 6. Listar duplicados
curl "http://localhost:3000/api/registros?duplicados=true"
```

---

## 🔍 TESTES COM DIFERENTES FILTROS

### Combinar múltiplos filtros:

```bash
# Almoço da Catraca 01 em 04/11
curl "http://localhost:3000/api/registros?data=2025-11-04&catraca_id=1&grupo_horario=almoco"

# Todos registros de João na Catraca 01
curl "http://localhost:3000/api/registros?nome=João&catraca_id=1"

# Duplicados do café
curl "http://localhost:3000/api/registros?grupo_horario=cafe&duplicados=true"
```

---

## 📊 VALIDAR DADOS NO BANCO

Depois de fazer upload, você pode validar os dados diretamente no PostgreSQL:

```sql
-- Total de registros
SELECT COUNT(*) FROM registros_catraca;

-- Registros por catraca
SELECT catraca_id, COUNT(*) 
FROM registros_catraca 
GROUP BY catraca_id;

-- Registros por grupo
SELECT grupo_horario, COUNT(*) 
FROM registros_catraca 
GROUP BY grupo_horario;

-- Duplicados
SELECT nome, data, grupo_horario, COUNT(*) 
FROM registros_catraca 
WHERE is_duplicado = true 
GROUP BY nome, data, grupo_horario;
```

---

## 🐛 RESOLVER PROBLEMAS COMUNS

### Erro: "Nenhum arquivo enviado"
✅ Verifique se o campo do formulário se chama `file`
✅ Use `-F` no cURL, não `-d`

### Erro: "catraca_id inválido"
✅ O valor deve ser "1" ou "2" (string)
✅ Não esqueça de adicionar o campo `catracaId` no formulário

### Erro: "Planilhas de Entrada e/ou Saída não encontradas"
✅ O nome das planilhas deve conter "entrada" e "saida"
✅ Exemplo: "Entrada Catraca 01" e "Saida Catraca 01"

### Erro de conexão com banco
✅ Verifique as credenciais no `.env`
✅ Teste a conexão: `curl http://localhost:3000/health`
✅ Verifique se o PostgreSQL está rodando

---

## 🎯 CHECKLIST DE TESTES

- [ ] Servidor inicia sem erros
- [ ] Endpoint `/health` retorna status ok
- [ ] Upload de arquivo funciona
- [ ] Dados são salvos no banco
- [ ] Listar registros funciona
- [ ] Filtros funcionam corretamente
- [ ] Indicadores são calculados
- [ ] Duplicados são identificados
- [ ] Estatísticas são precisas
- [ ] Deletar funciona (com cuidado!)

---

**Boa sorte com os testes! 🚀**
