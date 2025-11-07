# Usar Node.js LTS
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
