require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    timezone: '+08:00'
  });

  const [hrRows] = await db.execute(`SELECT HOUR(NOW()) as hr, MINUTE(NOW()) as min, NOW() as now`);
  console.log("Current DB Time:", hrRows[0]);

  const [pending] = await db.execute(`SELECT et.*, st.due_date FROM escalation_tracking et JOIN scheduled_tasks st ON et.task_id = st.id WHERE et.status = 'Pending' AND st.due_date = CURDATE()`);
  console.log("PENDING ESCALATIONS (TODAY):", pending);

  const [unresponsive] = await db.execute(`SELECT * FROM escalation_tracking WHERE status = 'Unresponsive'`);
  console.log("UNRESPONSIVE ESCALATIONS:", unresponsive);

  await db.end();
}
main();
