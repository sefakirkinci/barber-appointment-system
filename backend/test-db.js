const pool = require("./src/config/db");

async function testDatabaseConnection() {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time, current_database() AS database_name"
    );

    console.log("PostgreSQL bağlantısı başarılı.");
    console.log("Veritabanı:", result.rows[0].database_name);
    console.log("Sunucu zamanı:", result.rows[0].current_time);
  } catch (error) {
    console.error("PostgreSQL bağlantısı başarısız.");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();