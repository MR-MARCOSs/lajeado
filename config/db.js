const mysql = require("mysql2/promise"); // Importando a versão de Promises

const connectionString = "mysql://root:VyRkGvMyDkUkvpZBQozYrAJbceojLXKK@autorack.proxy.rlwy.net:16781/railway";

// Usando a versão promise do mysql2 para criar o pool
const db = mysql.createPool(connectionString);

module.exports = db;
