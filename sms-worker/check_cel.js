const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u268935662_anialerto123',
    password: process.env.DB_PASSWORD || 'AniAlerto123',
    database: process.env.DB_NAME || 'u268935662_AniAlerto'
  });

  const [workers] = await db.execute("SELECT * FROM workers");
  console.log("WORKERS:", workers);

  await db.end();
}
check();
