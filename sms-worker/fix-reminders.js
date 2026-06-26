require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME});
  
  const [reminders] = await db.execute("SELECT id, worker_id, response_text, received_at FROM sms_logs WHERE message LIKE 'Reminder!%' AND response_text IS NOT NULL");
  
  if (reminders.length > 0) {
    console.log(`Found ${reminders.length} reminder(s) with responses to migrate.`);
    for (const r of reminders) {
      // Find the most recent original message (not a reminder) for this worker
      const [orig] = await db.execute("SELECT id FROM sms_logs WHERE worker_id = ? AND direction = 'Outbound' AND message NOT LIKE 'Reminder!%' ORDER BY created_at DESC LIMIT 1", [r.worker_id]);
      if (orig.length > 0) {
        // Migrate
        await db.execute("UPDATE sms_logs SET response_text = ?, received_at = ?, status = 'Replied' WHERE id = ?", [r.response_text, r.received_at, orig[0].id]);
        // Null out reminder
        await db.execute("UPDATE sms_logs SET response_text = NULL, received_at = NULL, status = 'Delivered' WHERE id = ?", [r.id]);
        console.log(`Migrated worker_id ${r.worker_id} response from Reminder ${r.id} to Original ${orig[0].id}`);
      }
    }
  } else {
    console.log("No old reminder responses to migrate.");
  }
  db.end();
}
run();
