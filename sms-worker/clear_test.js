require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearTest() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    await conn.execute(`DELETE FROM inbound_messages WHERE phone LIKE '%9682186081%' OR phone LIKE '%9457365778%'`);
    await conn.execute(`DELETE FROM pest_alerts WHERE phone LIKE '%9682186081%' OR phone LIKE '%9457365778%'`);
    console.log("Cleared test data for Ryan.");
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

clearTest();
