const mysql = require('mysql2/promise');
require('dotenv').config({path: './.env'});

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  
  try {
    await db.query('ALTER TABLE workers ADD COLUMN unresponsive TINYINT(1) DEFAULT 0;');
    console.log('Added unresponsive to workers');
  } catch(e) { console.log(e.message); }

  try {
    await db.query('ALTER TABLE workers ADD COLUMN missed_response_count INT DEFAULT 0;');
    console.log('Added missed_response_count to workers');
  } catch(e) { console.log(e.message); }

  try {
    await db.query('ALTER TABLE sms_logs ADD COLUMN response_time_minutes INT NULL;');
    console.log('Added response_time_minutes to sms_logs');
  } catch(e) { console.log(e.message); }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS escalation_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        worker_id INT NOT NULL,
        task_id INT NOT NULL,
        reminder_count INT DEFAULT 0,
        last_reminder_at DATETIME NULL,
        status ENUM('Pending', 'Replied', 'Unresponsive') DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE
      );
    `);
    console.log('Created escalation_tracking table');
  } catch(e) { console.log(e.message); }

  console.log('Migration Complete');
  process.exit();
}
run();
