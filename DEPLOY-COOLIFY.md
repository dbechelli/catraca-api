# 🚀 GUIA DE DEPLOY - COOLIFY

## 📋 PRÉ-REQUISITOS

- [x] API funcionando localmente
- [x] Código testado e validado
- [x] Postman configurado
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)
- [ ] Acesso ao Coolify
- [ ] PostgreSQL já criado no Coolify

---

## 🔧 PASSO 1: Preparar o Código para Deploy

### 1.1 Verificar arquivos criados

Certifique-se que estes arquivos existem:
- [x] `Dockerfile`
- [x] `.dockerignore`
- [x] `.gitignore`
- [x] `package.json`

### 1.2 Ajustar package.json

Verifique se o `package.json` tem os scripts corretos:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

✅ Já está correto!

---

## 📦 PASSO 2: Subir para Repositório Git

### Opção A: Criar novo repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `catraca-api`
3. Privado ou Público (sua escolha)
4. **NÃO** adicione README, .gitignore ou licença
5. Criar repositório

### Opção B: Usar repositório existente

Se já tem um repositório, pule para o passo 2.2

### 2.1 Inicializar Git (se ainda não fez)

No terminal do VS Code, na pasta `catraca-api`:

```bash
# Inicializar git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - API Sistema de Catracas"

# Adicionar repositório remoto (substitua pela sua URL)
git remote add origin https://github.com/seu-usuario/catraca-api.git

# Subir para o GitHub
git push -u origin main
```

Se der erro sobre "master" vs "main":
```bash
git branch -M main
git push -u origin main
```

### 2.2 Verificar o .gitignore

O arquivo `.gitignore` já está configurado corretamente para NÃO subir:
- `node_modules/`
- `.env`
- `*.log`

✅ Seu `.env` com senhas NÃO vai para o Git!

---

## 🌐 PASSO 3: Configurar no Coolify

### 3.1 Acessar o Coolify

1. Acesse seu painel Coolify
2. Selecione o servidor onde quer fazer deploy

### 3.2 Criar novo recurso

1. Clique em **"+ New Resource"**
2. Selecione **"Application"**
3. **Source**: Selecione seu repositório Git
   - Se primeiro deploy: **"Add New Source"** → Conecte GitHub/GitLab
   - Autorize o Coolify a acessar seus repositórios
4. Selecione o repositório `catraca-api`
5. Branch: `main` (ou `master`)

### 3.3 Configurações do Build

**Build Pack**: 
- Se criou o Dockerfile: Selecione **"Dockerfile"**
- Se não criou: Selecione **"Node.js"**

**Configurações importantes:**
- **Port**: `3000` (ou a porta que você configurou)
- **Install Command**: `npm install` (padrão)
- **Build Command**: (deixe vazio se não tem build)
- **Start Command**: `npm start`

### 3.4 Variáveis de Ambiente

**IMPORTANTE:** Configure as variáveis de ambiente no Coolify:

Clique em **"Environment Variables"** e adicione:

```env
DB_HOST=seu-postgresql-host.coolify.io
DB_PORT=5432
DB_NAME=catraca_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_segura

PORT=3000
NODE_ENV=production

ALLOWED_ORIGINS=https://seu-frontend.coolify.io,https://seu-dominio.com
```

**Dicas:**
- ✅ Use a URL interna do PostgreSQL se estiver no mesmo servidor
- ✅ `NODE_ENV=production` ativa SSL no banco
- ✅ Configure CORS com os domínios corretos

### 3.5 Domínio

**Opções:**

1. **Subdomínio Coolify** (mais fácil):
   - O Coolify gera automaticamente: `catraca-api-xxxxx.coolify.io`
   
2. **Domínio personalizado**:
   - Adicione seu domínio: `api.seudominio.com.br`
   - Configure DNS: CNAME apontando para o Coolify

### 3.6 Recursos (opcional)

Se quiser limitar recursos:
- **Memory Limit**: 512MB (suficiente)
- **CPU Limit**: 0.5 CPU

---

## 🚀 PASSO 4: Deploy

1. Clique em **"Deploy"** ou **"Save & Deploy"**
2. Acompanhe os logs em tempo real
3. Aguarde o build terminar (2-5 minutos)

**O que vai acontecer:**
1. ✅ Coolify clona o repositório
2. ✅ Instala dependências (`npm install`)
3. ✅ Cria imagem Docker (se usando Dockerfile)
4. ✅ Inicia o container
5. ✅ Disponibiliza na URL

---

## ✅ PASSO 5: Testar o Deploy

### 5.1 Verificar logs

No Coolify:
1. Vá em **"Deployments"**
2. Clique no último deploy
3. Verifique os logs:
   - ✅ `🚀 Servidor rodando na porta 3000`
   - ✅ `✅ Conectado ao PostgreSQL`

Se aparecer erro de conexão ao banco:
- Verifique as variáveis de ambiente
- Confirme que o PostgreSQL está acessível

### 5.2 Testar no navegador

Acesse no navegador:
```
https://seu-app.coolify.io/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-06T..."
}
```

---

## 📱 PASSO 6: Atualizar o Postman

### 6.1 Criar novo ambiente

1. No Postman, clique em **"Environments"**
2. Clique em **"+"** para criar novo
3. Nome: `Catraca - Produção`
4. Adicione a variável:
   - **Variable**: `base_url`
   - **Initial Value**: `https://seu-app.coolify.io`
   - **Current Value**: `https://seu-app.coolify.io`
5. **Save**

### 6.2 Trocar ambiente

1. No canto superior direito do Postman
2. Selecione **"Catraca - Produção"**
3. Todas as requisições agora usarão a URL de produção! 🎉

### 6.3 Testar endpoints

Execute na ordem:
1. ✅ Health Check
2. ✅ Upload de arquivo
3. ✅ Listar registros
4. ✅ Indicadores

---

## 🔄 PASSO 7: Deploy Automático (CI/CD)

### Configurar Auto Deploy

No Coolify:
1. Vá em **"Settings"** do seu app
2. Ative **"Auto Deploy"**
3. Selecione a branch: `main`

**Agora:**
- ✅ Todo `git push` para a branch `main` faz deploy automático
- ✅ Não precisa mais fazer deploy manual no Coolify

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "Cannot connect to database"

**Causas comuns:**
- ❌ Variáveis de ambiente erradas
- ❌ PostgreSQL não acessível da rede do app
- ❌ Senha incorreta

**Solução:**
1. Verifique as variáveis de ambiente no Coolify
2. Use a URL **interna** do PostgreSQL (se no mesmo servidor)
3. Teste conexão manualmente

### Erro: "Port already in use"

**Solução:**
- Mude a variável `PORT` para outra (ex: 8080)
- Configure no Coolify: Settings → Port

### Erro: "Module not found"

**Solução:**
- Certifique-se que o `package.json` está correto
- Verifique se todas as dependências estão listadas
- Faça rebuild: Coolify → Redeploy

### App não inicia

**Verificar logs:**
1. Coolify → Deployments → View Logs
2. Procure por mensagens de erro
3. Verifique se o `npm start` está funcionando

---

## 🎯 CHECKLIST DE DEPLOY

Antes de considerar concluído:

- [ ] Código no repositório Git
- [ ] Dockerfile criado (opcional)
- [ ] App criado no Coolify
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado com sucesso
- [ ] Logs mostram servidor rodando
- [ ] `/health` retorna status ok
- [ ] Upload de arquivo funciona
- [ ] Postman atualizado com URL de produção
- [ ] Auto deploy ativado (opcional)

---

## 📊 URLs Importantes

**Local:**
```
http://localhost:3000
```

**Produção (Coolify):**
```
https://seu-app.coolify.io
https://api.seudominio.com.br (se configurou domínio)
```

**PostgreSQL:**
```
Host interno: postgresql.coolify.internal
Host externo: seu-postgres.coolify.io
```

---

## 🚀 PRÓXIMOS PASSOS

Após o deploy da API:
1. ✅ API rodando em produção
2. 🔜 Desenvolver Frontend React
3. 🔜 Deploy do Frontend no Coolify
4. 🔜 Conectar Frontend → API
5. 🔜 Domínio personalizado (opcional)

---

## 💡 DICAS PRO

### Monitoring
- Configure alertas no Coolify (se disponível)
- Monitore logs regularmente
- Configure backup do PostgreSQL

### Segurança
- ✅ Use HTTPS (Coolify faz automaticamente)
- ✅ Configure CORS corretamente
- ✅ Nunca commite `.env` no Git
- ✅ Use senhas fortes no PostgreSQL

### Performance
- Use connection pooling (já configurado)
- Configure limites de memória
- Monitore uso de recursos

---

**Boa sorte com o deploy! 🎉**

Qualquer problema, verifique os logs no Coolify!
