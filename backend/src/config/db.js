const { Pool, types } = require("pg");
require("dotenv").config();

// PostgreSQL DATE tipini JavaScript Date nesnesine çevirmeden
// "YYYY-MM-DD" biçiminde metin olarak döndürür.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", (error) => {
  console.error("Beklenmeyen PostgreSQL hatası:", error);
});

module.exports = pool;