require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  const [logs] = await db.execute('SELECT phone, status, SUBSTRING(message, 1, 50) as msg, created_at FROM sms_logs WHERE created_at >= "2026-06-24 05:15:00" AND direction="Outbound"');
  console.log('LOGS:', logs);
  db.end();
}
run();
