const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

const app = express();
const cors = require('cors');
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  console.log(`Recebida uma solicitação: ${req.method} ${req.url}`);
  next();
});

// Configurações do servidor

app.use(express.urlencoded({ extended: true })); // Para entender dados de formulário
app.use(express.json()); // Para ler JSONs
app.use(session({
  secret: 'seu-segredo-aqui', // Mantenha isso seguro
  resave: false,
  saveUninitialized: true,
  cookie: {
      secure: false, // Altere para true em produção se usar HTTPS
      maxAge: 1000 * 60 * 60 // Sessão expira em 1 hora
  }
}));


// Definir diretórios de arquivos estáticos


// Definir rotas
app.use('/', authRoutes);
app.use(express.static(path.join(__dirname, 'public')));
// Configurar a view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
