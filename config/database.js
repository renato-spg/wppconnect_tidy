const mariadb = require('mariadb');

// Configuração do pool de conexão com o banco de dados
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'uey#keikduey##keyznking',
  database: 'card',
  connectionLimit: 5,
});

// Exporta o pool para ser usado em outros arquivos
module.exports = { pool };