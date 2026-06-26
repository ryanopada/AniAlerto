const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: '148.222.53.111',
    user: 'u268935662_anialerto123',
    password: 'AniAlerto123',
    database: 'u268935662_AniAlerto'
  });

  const [rows] = await connection.execute('SELECT * FROM inbound_messages ORDER BY received_at DESC LIMIT 5;');
  console.log("INBOUND_MESSAGES:", rows);
  
  const [logs] = await connection.execute('SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5;');
  console.log("SMS_LOGS:", logs);

  await connection.end();
}
check();
