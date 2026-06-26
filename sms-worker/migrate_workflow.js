require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Updating scheduled_tasks status ENUM...");
    await db.execute("ALTER TABLE scheduled_tasks MODIFY COLUMN status ENUM('Pending','Completed','Delayed','Cancelled','NeedsHelp','Pest Detected') DEFAULT 'Pending'");
    
    console.log("Creating worker_task_responses table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS worker_task_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        worker_id INT NOT NULL,
        response_status ENUM('On-time', 'Late Response', 'Unresponsive') NOT NULL,
        action_taken ENUM('DONE', 'DELAY', 'PEST', 'NONE') DEFAULT 'NONE',
        responded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_task_worker (task_id, worker_id),
        FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
      )
    `);
    
    console.log("Migration successful!");
  } catch (e) {
    console.error("Migration failed:", e.message);
  } finally {
    await db.end();
  }
}

migrate();
