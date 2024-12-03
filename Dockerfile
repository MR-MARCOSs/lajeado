# Use a imagem base do Node.js
FROM node:18

# Defina o diretório de trabalho na imagem Docker
WORKDIR /app

# Copie os arquivos do projeto para o container
COPY . .

# Instale as dependências
RUN npm install

# Instale o nodemon globalmente para facilitar o desenvolvimento
RUN npm install -g nodemon

# Exponha a porta em que sua aplicação será executada
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "app.js"]

