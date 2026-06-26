const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u268935662_anialerto123',
    password: process.env.DB_PASSWORD || 'AniAlerto123',
    database: process.env.DB_NAME || 'u268935662_AniAlerto'
  });

  const [alerts] = await db.execute("SELECT message, REPLACE(message, 'Menu sent — awaiting topic selection.', 'Topic selected: Irrigation') as updated FROM alerts WHERE id=63");
  console.log("ALERTS:", alerts);

  await db.end();
}
check();
