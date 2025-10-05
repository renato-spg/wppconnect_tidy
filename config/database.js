import mariadb from "mariadb";

// Configuração do pool de conexão com o banco de dados

const SERVER = false;

export let pool = null;

if (!SERVER) {
  pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "card",
    connectionLimit: 5,
  });
} else {
  pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "uey#keikduey##keyznking",

    database: "card",
    connectionLimit: 5,
  });
}
// Exporta o pool para ser usado em outros arquivos
