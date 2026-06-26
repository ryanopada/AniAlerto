require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    // We simulate marking all unread UNRESPONSIVE alerts as read, just to clean the DB.
    const [alerts] = await db.execute("SELECT DISTINCT worker_id FROM alerts WHERE type='UNRESPONSIVE' AND is_read=0 AND worker_id IS NOT NULL");
    
    if (alerts.length > 0) {
      console.log(`Found ${alerts.length} workers with unread UNRESPONSIVE alerts.`);
      const workerIds = alerts.map(a => a.worker_id);
      
      const placeholders = workerIds.map(() => '?').join(',');
      await db.execute(`UPDATE workers SET unresponsive=0, missed_response_count=0 WHERE id IN (${placeholders})`, workerIds);
      await db.execute(`UPDATE escalation_tracking SET status='Resolved' WHERE worker_id IN (${placeholders})`, workerIds);
      await db.execute(`DELETE FROM sms_queue WHERE status='Queued' AND worker_id IN (${placeholders})`, workerIds);
      
      await db.execute("UPDATE alerts SET is_read=1 WHERE type='UNRESPONSIVE' AND is_read=0");
      
      console.log("Successfully cleared existing alerts and synced worker states.");
    } else {
      console.log("No unread UNRESPONSIVE alerts to clean up.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    db.end();
  }
}

run();
