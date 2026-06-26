const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u268935662_anialerto123',
    password: process.env.DB_PASSWORD || 'AniAlerto123',
    database: process.env.DB_NAME || 'u268935662_AniAlerto'
  });

  const [queue] = await db.execute("SELECT * FROM sms_queue WHERE status = 'Queued'");
  console.log("Pending in queue:", queue.length);
  console.log("Queue items:", queue);

  const [logs] = await db.execute("SELECT * FROM sms_logs ORDER BY id DESC LIMIT 5");
  console.log("Recent outbound logs:", logs);

  await db.end();
}
check();
