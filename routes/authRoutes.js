const express = require("express");
const mysql = require('mysql2/promise');
const bcrypt = require("bcrypt");
const cors = require("cors"); // Importando o pacote CORS
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Configuração do multer para o armazenamento de arquivos
const baseUploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.session.user?.id; // ID do usuário
    const docId = req.body.docId || Date.now(); // Identificador do documento
  
    if (!userId) {
      return cb(new Error("Usuário não autenticado"), false);
    }
  
    // Caminho base para uploads
    const userFolder = path.join(baseUploadsDir, userId.toString());
    const docFolder = path.join(userFolder, docId.toString());
  
    try {
      // Criar pasta do usuário se não existir
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }
      // Criar pasta do documento se não existir
      if (!fs.existsSync(docFolder)) {
        fs.mkdirSync(docFolder, { recursive: true });
      }
  
      cb(null, docFolder); // Define o diretório para os arquivos
    } catch (error) {
      console.error("Erro ao criar diretório:", error);
      cb(error, false);
    }
  },
  

  filename: (req, file, cb) => {
    // Cria um nome de arquivo único baseado no timestamp e na extensão do arquivo
    const fileExtension = path.extname(file.originalname); // Extensão do arquivo
    const docId = req.body.docId || Date.now(); // Use docId do corpo ou um valor de fallback (timestamp)
    const filename = `${docId}${fileExtension}`; // Nome do arquivo
    cb(null, filename); // Define o nome do arquivo
  }
});

const upload = multer({ storage: storage });
const generateAccessToken = require("./generateAccessToken");
// Habilitando CORS para todas as origens
const corsOptions = {
  origin: "*", // ou especificar origens permitidas
  methods: ["GET", "POST"], // métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"],
};

router.use(cors(corsOptions));

 

router.post('/service', upload.fields([
  { name: 'identidade', maxCount: 1 }, // Arquivo de identidade
  { name: 'sus', maxCount: 1 }         // Arquivo SUS
]), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send({ status: 'error', message: 'Usuário não autenticado' });
  }

  // Acessando o ID do usuário da sessão
  const userId = req.session.user.id;

  console.log('Dados recebidos:', req.body);
  console.log('Arquivos recebidos:', req.files);

  const { identidade, sus } = req.files;

  try {
    // Verifica se os arquivos foram recebidos
    if (!identidade || !sus) {
      return res.status(400).send({ status: 'error', message: 'Faltando documentos de identidade ou SUS.' });
    }

    // Criar a pasta do usuário se não existir
    const userDir = path.join(__dirname, '..', 'uploads', userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir);
    }

    // Inserir os dados no banco de dados, incluindo o id do usuário e os caminhos dos arquivos
    const [result] = await db.query("INSERT INTO user_documents (userId, identidade, sus) VALUES (?, ?, ?)", [
      userId, 
      identidade[0].path, 
      sus[0].path
    ]);

    // Agora você pode usar o `result.insertId` para referenciar o docId
    const docId = result.insertId;

    // Criar a pasta do documento com o nome do docId
    const docDir = path.join(userDir, docId.toString());
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir);
    }

    // Mover os arquivos para a pasta do documento
    const identidadeDest = path.join(docDir, path.basename(identidade[0].path));
    const susDest = path.join(docDir, path.basename(sus[0].path));

    // Mover os arquivos
    fs.renameSync(identidade[0].path, identidadeDest);
    fs.renameSync(sus[0].path, susDest);

    // Atualiza o banco de dados com os novos caminhos dos arquivos
    await db.query("UPDATE user_documents SET identidade = ?, sus = ? WHERE docId = ?", [
      identidadeDest, 
      susDest,
      docId
    ]);

    // Resposta de sucesso
    res.status(200).send({ status: 'success', message: 'Documentos inseridos com sucesso' });
  } catch (err) {
    console.error("Erro ao inserir documentos:", err);
    res.status(500).send({ status: 'error', message: 'Erro ao inserir documentos no banco de dados' });
  }
});



router.get("/login", (req, res) => {
  res.render("login", { errorMessage: null }); // Garantindo que a variável sempre estará definida
});

router.get('/register', (req, res) => {
  res.render('register');
});

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove qualquer caracter não numérico

  // Verifica se o CPF tem 11 caracteres
  if (cpf.length !== 11) return false;

  // Verificação dos dois dígitos verificadores
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.charAt(i - 1)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.charAt(i - 1)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true; // CPF válido
}

// Rota de cadastro
router.post('/register', async (req, res) => {
  console.log('Dados recebidos:', req.body);
  const { name, cpf, email, phone, password } = req.body;
  
  // Valida o CPF
  if (!validarCPF(cpf)) {
    return res.render("cadastro", { errorMessage: "CPF inválido. Por favor, insira um CPF válido." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Verificando se o CPF ou e-mail já existe no banco de dados
    const [rows] = await db.query("SELECT * FROM users WHERE cpf = ? OR email = ?", [cpf, email]);

    if (rows.length > 0) {
      // Se já existir, retornamos um erro específico para CPF ou E-mail duplicado
      return res.render("cadastro", { errorMessage: "CPF ou E-mail já cadastrado!" });
    }

    // Inserir o novo usuário no banco de dados
    await db.query("INSERT INTO users (name, cpf, email, phone, password) VALUES (?, ?, ?, ?, ?)", [name, cpf, email, phone, hashedPassword]);

    // Redireciona para a página de login após o cadastro
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render("cadastro", { errorMessage: "Erro de conexão com o banco de dados!" });
  }
});


router.post("/login", async (req, res) => {
  const { cpf, password } = req.body;

  try {
    // Usando .query diretamente, sem getConnection()
    const [result] = await db.query("SELECT * FROM users WHERE cpf = ?", [cpf]);

    if (result.length === 0) {
      console.log("----> User does not exist");
      return res.render("login", { errorMessage: "Usuário não encontrado!" });  // Retornando erro para o front-end
    }

    const user = result[0];
    const hashedPassword = user.password;

    // Comparando as senhas
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch) {
      // Gerar um token JWT
      const token = jwt.sign({ id: user.id }, 'seu-segredo', { expiresIn: '1h' });
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf
      };
      req.session.token = token;

      return res.redirect('/home');
    } else {
      return res.render("login", { errorMessage: "Senha incorreta!" });  // Erro de senha
    }
  } catch (err) {
    console.error("Error logging in:", err);
    return res.render("login", { errorMessage: "Erro de conexão com o banco de dados!" });  // Erro de banco de dados
  }
});



router.get('/home', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login'); // Redirecionar para login se não estiver logado
  }
  res.render('home', { user: req.session.user });
});





router.get('/perfil_user', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  try {
    // Consultar os documentos do usuário no banco de dados
    const [rows] = await db.query("SELECT docId, created_at FROM user_documents WHERE userId = ?", [userId]);

    // Transformar os dados em formato adequado
    const solicitacoesPendentes = rows.map(doc => ({
      docId: doc.docId || "N/A", // Garante que não seja vazio
      createdAt: doc.created_at ? new Date(doc.created_at).toLocaleString("pt-BR") : "Data inválida"
    }));

    // Renderizar a página com os dados
    res.render('perfil_user', { 
      user: req.session.user, 
      solicitacoesPendentes // Dados processados
    });

  } catch (err) {
    console.error("Erro ao buscar documentos:", err);

    // Renderiza a página mesmo em caso de erro
    res.render('perfil_user', { 
      user: req.session.user, 
      solicitacoesPendentes: [], // Garantindo que está inicializado
      errorMessage: "Erro ao carregar as solicitações." 
    });
  }
});






router.get('/solicitacao_page', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login'); // Redirecionar para login se não estiver logado
  }
  res.render('solicitacao_page', { user: req.session.user });
});

router.get('/cadastro', (req, res) => {
  res.render('cadastro',  { errorMessage: null });
});


router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao fazer logout');
    }

    // Desabilitar o cache para impedir o acesso ao conteúdo após logout
    res.setHeader('Cache-Control', 'no-store');
    res.redirect('/login');
  });
});

const port = process.env.PORT;
module.exports = router;
