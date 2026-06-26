require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME});
  
  const localNow = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`;

  const [r1Tasks] = await db.execute(`
    SELECT et.id as tracking_id, et.worker_id, et.task_id, w.phone, w.name as worker_name, fb.name as batch_name, mt.category
    FROM escalation_tracking et
    JOIN workers w ON et.worker_id = w.id
    JOIN scheduled_tasks st ON et.task_id = st.id
    JOIN farm_batches fb ON st.batch_id = fb.id
    LEFT JOIN message_templates mt ON st.template_id = mt.id
    WHERE et.status = 'Pending' 
      AND et.reminder_count = 0 
      AND st.due_date = ?
      AND w.unresponsive = 0
  `, [todayStr]);
  console.log("Found tasks:", r1Tasks);
  db.end();
}
run();
