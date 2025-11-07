# ✅ CHECKLIST RÁPIDO - DEPLOY NO COOLIFY

## 📦 ANTES DE COMEÇAR

- [ ] API testada e funcionando localmente
- [ ] PostgreSQL criado no Coolify
- [ ] Credenciais do banco anotadas

---

## 🔄 PASSO A PASSO (15 MINUTOS)

### 1. SUBIR PARA O GIT (5 min)

```bash
cd catraca-api

# Inicializar (se não fez)
git init
git add .
git commit -m "Initial commit - API Catracas"

# Conectar ao GitHub (substitua pela sua URL)
git remote add origin https://github.com/seu-usuario/catraca-api.git
git branch -M main
git push -u origin main
```

✅ Código no GitHub!

---

### 2. CRIAR APP NO COOLIFY (5 min)

1. Coolify → **+ New Resource** → **Application**
2. Conectar repositório Git (se primeira vez)
3. Selecionar repositório: `catraca-api`
4. Branch: `main`
5. Build Pack: **Dockerfile** (ou Node.js)
6. Port: `3000`

---

### 3. CONFIGURAR VARIÁVEIS (2 min)

Adicionar em **Environment Variables**:

```env
DB_HOST=seu-postgres.coolify.io
DB_PORT=5432
DB_NAME=catraca_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

PORT=3000
NODE_ENV=production

ALLOWED_ORIGINS=*
```

**IMPORTANTE:** Use as credenciais corretas do seu PostgreSQL!

---

### 4. FAZER DEPLOY (3 min)

1. Clicar em **"Deploy"**
2. Aguardar build (2-5 min)
3. Verificar logs:
   - ✅ `🚀 Servidor rodando na porta 3000`
   - ✅ `✅ Conectado ao PostgreSQL`

---

### 5. TESTAR (1 min)

No navegador:
```
https://seu-app.coolify.io/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected"
}
```

✅ **FUNCIONOU!** 🎉

---

## 📱 ATUALIZAR POSTMAN

1. Criar novo Environment: `Catraca - Produção`
2. Variable `base_url` = `https://seu-app.coolify.io`
3. Trocar environment no dropdown
4. Testar endpoints

---

## 🐛 SE DER ERRO

### Erro de conexão ao banco:
- Verificar variáveis de ambiente no Coolify
- Usar URL **interna** do PostgreSQL (se no mesmo servidor)

### App não inicia:
- Ver logs no Coolify
- Verificar se todas variáveis estão corretas

### Port in use:
- Mudar PORT para 8080 nas variáveis

---

## ✅ TUDO CERTO!

Agora você tem:
- ✅ API rodando em produção
- ✅ URL pública funcionando
- ✅ Postman configurado
- 🔜 Pronto para criar o Frontend!

---

**Próximo:** Desenvolver o Frontend React! 🚀
