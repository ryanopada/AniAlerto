<?php
require_once 'Database.php';

try {
    $db = (new Database())->getConnection();

    echo "Updating scheduled_tasks status ENUM...\n";
    $db->exec("ALTER TABLE scheduled_tasks MODIFY COLUMN status ENUM('Pending','Completed','Delayed','Cancelled','NeedsHelp','Pest Detected') DEFAULT 'Pending'");

    echo "Creating worker_task_responses table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS worker_task_responses (
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
    )");

    echo "Migration successful!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
