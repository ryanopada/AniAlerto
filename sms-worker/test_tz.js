require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 1
  });

  pool.on('connection', (connection) => {
    connection.query("SET time_zone = '+08:00'");
  });

  const [rows] = await pool.query("SELECT NOW() as currentTime");
  console.log("With hook:", rows[0].currentTime);

  const pool2 = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 1
  });

  const [rows2] = await pool2.query("SELECT NOW() as currentTime");
  console.log("Without hook:", rows2[0].currentTime);

  process.exit(0);
}
test();
