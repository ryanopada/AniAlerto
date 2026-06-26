require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const phones = ['+639688700922', '+639171329989']; // Julia, Francellin
  const rawMsg = "Irrigation for [Test Batch 3] is scheduled. Patubigan ang tanim upang manatiling basa ang lupa at suportahan ang mabilis na pagtubo. Iwasan ang sobrang tubig at pantayin ang distribusyon.";
  const msgPrefix = "AniAlerto [Test Batch 3]: ";
  const REPLY_GUIDE = "\n\nReply only: DONE, DELAY, HELP, PEST\nSumagot lamang ng: DONE, DELAY, HELP, PEST";
  
  const finalMsg = msgPrefix + rawMsg + REPLY_GUIDE;

  for (const phone of phones) {
    await db.execute(
      `INSERT INTO sms_queue (phone, message, status, created_at) VALUES (?, ?, 'Queued', NOW())`,
      [phone, finalMsg]
    );
    console.log(`Queued message for ${phone}`);
  }
  
  db.end();
}
run();
