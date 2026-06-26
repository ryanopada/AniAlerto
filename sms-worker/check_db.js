const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u268935662_anialerto123',
    password: process.env.DB_PASSWORD || 'AniAlerto123',
    database: process.env.DB_NAME || 'u268935662_AniAlerto'
  });

  const [queue] = await db.execute("SELECT id, phone, message, status, created_at FROM sms_queue ORDER BY id DESC LIMIT 5");
  console.log("SMS QUEUE:", queue);

  const [logs] = await db.execute("SELECT id, direction, phone, message, status, created_at FROM sms_logs WHERE direction='Outbound' ORDER BY id DESC LIMIT 5");
  console.log("SMS LOGS:", logs);

  const [inbound] = await db.execute("SELECT id, phone, message, command, received_at FROM inbound_messages ORDER BY id DESC LIMIT 5");
  console.log("INBOUND MESSAGES:", inbound);

  await db.end();
}
check();
