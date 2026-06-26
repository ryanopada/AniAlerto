const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u268935662_anialerto123',
    password: process.env.DB_PASSWORD || 'AniAlerto123',
    database: process.env.DB_NAME || 'u268935662_AniAlerto'
  });

  const [res] = await db.execute("UPDATE alerts SET message = REPLACE(message, 'Menu sent — awaiting topic selection.', CONCAT('Topic selected: ', ?)) WHERE type = 'HELP' AND worker_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 1", ['Irrigation', 32]);
  console.log("UPDATE RESULT:", res);

  const [alerts] = await db.execute("SELECT id, message FROM alerts WHERE id=63");
  console.log("UPDATED ALERT:", alerts);

  await db.end();
}
check();
