# Dockerfile para Lojify
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar dependências
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copiar código fonte
COPY . .

# Build do cliente
RUN cd client && npm run build

# Expor porta
EXPOSE 5000

# Comando para iniciar
CMD ["npm", "start"]
