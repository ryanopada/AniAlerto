require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME});
  pool.on('connection', c => {
    c.query("SET time_zone = '+08:00'");
  });
  const [r] = await pool.execute('SELECT HOUR(NOW()) as hr, MINUTE(NOW()) as min, NOW() as now');
  console.log('Pool TIME:', r[0]);
  process.exit();
}
run();
