<?php
// run_setup.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// This automatically reads Render's internal database link securely
$dbUrl = getenv('DATABASE_URL');
if (!$dbUrl) {
    die("Error: DATABASE_URL variable is missing in Render settings.");
}

$dbopts = parse_url($dbUrl);
$dsn = "pgsql:host=" . $dbopts["host"] . ";port=" . $dbopts["port"] . ";dbname=" . ltrim($dbopts["path"], '/');

try {
    $pdo = new PDO($dsn, $dbopts["user"], $dbopts["pass"], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "Connected successfully to Render Postgres!<br>";
    
    // The complete database structure setup
    $sql = "
    DROP TABLE IF EXISTS sms_logs, sms_queue, scheduled_tasks, inbound_messages, message_templates, command_responses, batch_workers, workers, farm_batches, admins CASCADE;
    DROP TYPE IF EXISTS role_type, batch_status_type, category_type, trigger_type, task_status_type, queue_status_type, sms_direction_type CASCADE;

    CREATE TYPE role_type AS ENUM ('Admin', 'Farm Head');
    CREATE TYPE batch_status_type AS ENUM ('Planning', 'Active', 'Harvested');
    CREATE TYPE category_type AS ENUM ('Irrigation', 'Fertilization', 'Pest Control', 'Harvest', 'General');
    CREATE TYPE trigger_type AS ENUM ('days_after_planting', 'interval', 'event');
    CREATE TYPE task_status_type AS ENUM ('Pending', 'Completed', 'Delayed', 'Cancelled');
    CREATE TYPE queue_status_type AS ENUM ('Queued', 'Sending', 'Sent', 'Retry', 'Failed');
    CREATE TYPE sms_direction_type AS ENUM ('Outbound', 'Inbound');

    CREATE TABLE admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(80) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role role_type NOT NULL DEFAULT 'Admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );
    INSERT INTO admins (id, username, password_hash, full_name, role) VALUES
    (1, 'admin', '\$2y\$10\$jkn8bjs8t7yjfRd9XSsUke.5AcRlkRnW4bmvjXxSrB3siY./X1U36', 'AniAlerto Admin', 'Admin');

    CREATE TABLE farm_batches (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      location VARCHAR(150) NOT NULL,
      planting_date DATE NOT NULL,
      area VARCHAR(50) NOT NULL,
      variety VARCHAR(120) NOT NULL,
      status batch_status_type NOT NULL DEFAULT 'Planning',
      harvest_date DATE DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );
    INSERT INTO farm_batches (id, name, location, planting_date, area, variety, status, notes) VALUES
    (1, 'Field A - Wet Season', 'Field A', '2026-04-17', '2.5 ha', 'Pioneer 30G40', 'Active', 'Regular monitoring for Fall Armyworm.'),
    (2, 'Field B - Early Planting', 'Field B', '2026-04-17', '3.0 ha', 'Dekalb 9150', 'Active', 'Early planting trial.');

    CREATE TABLE workers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL UNIQUE,
      assignedBatch VARCHAR(50) DEFAULT NULL,
      email VARCHAR(150) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      date_joined DATE DEFAULT NULL,
      emergency_contact VARCHAR(150) DEFAULT NULL,
      emergency_phone VARCHAR(30) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );
    INSERT INTO workers (id, name, phone, email, address, status, date_joined, emergency_contact, emergency_phone) VALUES
    (1, 'Juan Dela Cruz', '+639123456789', 'juan@example.com', 'Tarlac City, Tarlac', 'Active', '2025-01-15', 'Maria Dela Cruz', '+639171234567'),
    (2, 'Maria Santos', '+639234567890', 'maria@example.com', 'Tarlac City, Tarlac', 'Active', '2025-02-01', 'Pedro Santos', '+639182345678'),
    (3, 'jia', '09688700922', NULL, NULL, 'Active', NULL, NULL, NULL),
    (4, 'saefw', '0934123433', NULL, NULL, 'Active', NULL, NULL, NULL);

    CREATE TABLE batch_workers (
      batch_id INT NOT NULL REFERENCES farm_batches(id) ON DELETE CASCADE,
      worker_id INT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      role VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (batch_id, worker_id)
    );
    INSERT INTO batch_workers (batch_id, worker_id, role) VALUES
    (1, 1, 'Field Supervisor'),
    (1, 2, 'Field Worker'),
    (2, 2, 'Field Worker');

    CREATE TABLE command_responses (
      id SERIAL PRIMARY KEY,
      command VARCHAR(30) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      color VARCHAR(40) NOT NULL DEFAULT 'blue',
      action VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );
    INSERT INTO command_responses (id, command, description, color, action) VALUES
    (1, 'DONE', 'Task completed successfully', 'green', 'Mark task as completed'),
    (2, 'DELAY', 'Task delayed or still in progress', 'yellow', 'Flag task for follow-up'),
    (3, 'HELP', 'Worker needs assistance', 'red', 'Send predefined help message or notify admin'),
    (4, 'PEST', 'Pest report keyword', 'red', 'Send urgent pest checklist and notify admin'),
    (5, 'UOD', 'Uod/pest report keyword', 'red', 'Send urgent pest checklist and notify admin');

    CREATE TABLE inbound_messages (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(30) NOT NULL,
      message TEXT NOT NULL,
      command VARCHAR(30) DEFAULT NULL,
      received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP DEFAULT NULL
    );

    CREATE TABLE message_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category category_type NOT NULL DEFAULT 'General',
      message TEXT NOT NULL,
      trigger_type trigger_type NOT NULL DEFAULT 'days_after_planting',
      days_after_planting INT DEFAULT NULL,
      interval_days INT DEFAULT NULL,
      event_keyword VARCHAR(30) DEFAULT NULL,
      expected_responses JSON DEFAULT NULL,
      active SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );
    INSERT INTO message_templates (id, name, category, message, trigger_type, days_after_planting, expected_responses, active) VALUES
    (1, 'Pesticide Spray Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'days_after_planting', 15, '[\"DONE\", \"DELAY\", \"HELP\"]', 1),
    (2, 'Herbicide Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Reminder: herbicide/pangdamo schedule today. Reply DONE or DELAY.', 'days_after_planting', 20, '[\"DONE\", \"DELAY\"]', 1),
    (3, 'First Fertilizer Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Unang abono schedule today. Reply DONE or DELAY.', 'days_after_planting', 15, '[\"DONE\", \"DELAY\"]', 1),
    (4, 'Second/Last Dressing Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Second/last dressing schedule today. Reply DONE or DELAY.', 'days_after_planting', 40, '[\"FILL\", \"DELAY\"]', 1),
    (5, 'Harvest Readiness Reminder', 'Harvest', 'AniAlerto: Day {crop_day} sa {batch_name}. Ihanda ang harvest planning and manpower. Reply DONE to acknowledge.', 'days_after_planting', 120, '[\"DONE\"]', 1),
    (6, 'hello', 'Pest Control', 'aksdfkasdf', 'interval', 11, '[\"DONE\",\"DELAY\",\"HELP\"]', 1);

    CREATE TABLE scheduled_tasks (
      id SERIAL PRIMARY KEY,
      batch_id INT NOT NULL REFERENCES farm_batches(id) ON DELETE CASCADE,
      template_id INT NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
      due_date DATE NOT NULL,
      status task_status_type NOT NULL DEFAULT 'Pending',
      completed_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL,
      CONSTRAINT uniq_task UNIQUE (batch_id, template_id, due_date)
    );

    CREATE TABLE sms_queue (
      id SERIAL PRIMARY KEY,
      task_id INT DEFAULT NULL REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
      worker_id INT DEFAULT NULL REFERENCES workers(id) ON DELETE SET NULL,
      phone VARCHAR(30) NOT NULL,
      message TEXT NOT NULL,
      status queue_status_type NOT NULL DEFAULT 'Queued',
      attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NULL
    );

    CREATE TABLE sms_logs (
      id SERIAL PRIMARY KEY,
      queue_id INT DEFAULT NULL REFERENCES sms_queue(id) ON DELETE SET NULL,
      task_id INT DEFAULT NULL REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
      worker_id INT DEFAULT NULL REFERENCES workers(id) ON DELETE SET NULL,
      phone VARCHAR(30) NOT NULL,
      message TEXT NOT NULL,
      direction sms_direction_type NOT NULL DEFAULT 'Outbound',
      status VARCHAR(50) NOT NULL,
      response_text TEXT DEFAULT NULL,
      provider_ref VARCHAR(150) DEFAULT NULL,
      raw_response TEXT DEFAULT NULL,
      sent_at TIMESTAMP DEFAULT NULL,
      received_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    ";

    $pdo->exec($sql);
    echo "🎉 SUCCESS! All AniAlerto database tables have been successfully constructed inside Render!";
} catch (PDOException $e) {
    echo "Error executing setup: " . $e->getMessage();
}
?>