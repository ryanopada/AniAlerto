require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  const [workers] = await db.execute('SELECT id, name, phone FROM workers WHERE name LIKE "%Julia%" OR name LIKE "%Francellin%"');
  console.log('WORKERS:', workers);
  
  const [tmpl] = await db.execute('SELECT * FROM message_templates WHERE id=107');
  console.log('TEMPLATE MESSAGE:', tmpl[0].message);
  
  db.end();
}
run();
