require('dotenv').config();
const mysql = require('mysql2/promise');
const scheduler = require('./scheduler');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME
  });
  
  // 1. Fix the broken tasks that were inserted for tomorrow!
  const [res] = await db.execute("UPDATE scheduled_tasks SET due_date = '2026-06-24' WHERE due_date = '2026-06-25'");
  console.log("Fixed broken tasks:", res.affectedRows);
  
  // 2. Run the scheduler!
  scheduler.setDB(db);
  await scheduler.runScheduler();
  console.log("Scheduler manual run complete.");
  
  db.end();
}
run();
