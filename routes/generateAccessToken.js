const jwt = require("jsonwebtoken");

function generateAccessToken(cpf) {
  return jwt.sign({ cpf: cpf }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

module.exports = generateAccessToken;
