CREATE DATABASE IF NOT EXISTS anialerto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE anialerto;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS sms_queue;
DROP TABLE IF EXISTS inbound_messages;
DROP TABLE IF EXISTS scheduled_tasks;
DROP TABLE IF EXISTS command_responses;
DROP TABLE IF EXISTS message_templates;
DROP TABLE IF EXISTS batch_workers;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS farm_batches;
DROP TABLE IF EXISTS admins;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('Admin','Farm Head') NOT NULL DEFAULT 'Admin',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE farm_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    location VARCHAR(150) NOT NULL,
    planting_date DATE NOT NULL,
    area VARCHAR(50) NOT NULL,
    variety VARCHAR(120) NOT NULL,
    status ENUM('Planning','Active','Harvested') NOT NULL DEFAULT 'Planning',
    harvest_date DATE NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    INDEX idx_status_planting (status, planting_date)
) ENGINE=InnoDB;

CREATE TABLE workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150) NULL,
    address TEXT NULL,
    status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    date_joined DATE NULL,
    emergency_contact VARCHAR(150) NULL,
    emergency_phone VARCHAR(30) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE batch_workers (
    batch_id INT NOT NULL,
    worker_id INT NOT NULL,
    role VARCHAR(100) NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (batch_id, worker_id),
    CONSTRAINT fk_bw_batch FOREIGN KEY (batch_id) REFERENCES farm_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_bw_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE message_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category ENUM('Irrigation','Fertilization','Pest Control','Harvest','General') NOT NULL DEFAULT 'General',
    message TEXT NOT NULL,
    trigger_type ENUM('days_after_planting','interval','event') NOT NULL DEFAULT 'days_after_planting',
    days_after_planting INT NULL,
    interval_days INT NULL,
    event_keyword VARCHAR(30) NULL,
    expected_responses JSON NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    INDEX idx_template_due (active, trigger_type, days_after_planting),
    INDEX idx_event_keyword (event_keyword)
) ENGINE=InnoDB;

CREATE TABLE command_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    command VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    color VARCHAR(40) NOT NULL DEFAULT 'blue',
    action VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE scheduled_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    template_id INT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Pending','Completed','Delayed','Cancelled') NOT NULL DEFAULT 'Pending',
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    UNIQUE KEY uniq_task (batch_id, template_id, due_date),
    CONSTRAINT fk_task_batch FOREIGN KEY (batch_id) REFERENCES farm_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_template FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE CASCADE,
    INDEX idx_due_status (due_date, status)
) ENGINE=InnoDB;

CREATE TABLE sms_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NULL,
    worker_id INT NULL,
    phone VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('Queued','Sending','Sent','Retry','Failed') NOT NULL DEFAULT 'Queued',
    attempts INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    CONSTRAINT fk_queue_task FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_queue_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL,
    INDEX idx_queue_status (status, attempts, created_at)
) ENGINE=InnoDB;

CREATE TABLE sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    queue_id INT NULL,
    task_id INT NULL,
    worker_id INT NULL,
    phone VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    direction ENUM('Outbound','Inbound') NOT NULL DEFAULT 'Outbound',
    status VARCHAR(50) NOT NULL,
    response_text TEXT NULL,
    provider_ref VARCHAR(150) NULL,
    raw_response TEXT NULL,
    sent_at DATETIME NULL,
    received_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_log_queue FOREIGN KEY (queue_id) REFERENCES sms_queue(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_task FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_worker FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL,
    INDEX idx_log_created (created_at),
    INDEX idx_log_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE inbound_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    command VARCHAR(30) NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,
    INDEX idx_inbound_processed (processed_at, received_at),
    INDEX idx_inbound_phone (phone)
) ENGINE=InnoDB;

INSERT INTO admins (username, password_hash, full_name, role, created_at)
VALUES ('admin', '$2y$10$jkn8bjs8t7yjfRd9XSsUke.5AcRlkRnW4bmvjXxSrB3siY./X1U36', 'AniAlerto Admin', 'Admin', NOW());
-- Password: admin123

INSERT INTO command_responses (command, description, color, action, created_at) VALUES
('DONE', 'Task completed successfully', 'green', 'Mark task as completed', NOW()),
('DELAY', 'Task delayed or still in progress', 'yellow', 'Flag task for follow-up', NOW()),
('HELP', 'Worker needs assistance', 'red', 'Send predefined help message or notify admin', NOW()),
('PEST', 'Pest report keyword', 'red', 'Send urgent pest checklist and notify admin', NOW()),
('UOD', 'Uod/pest report keyword', 'red', 'Send urgent pest checklist and notify admin', NOW());

INSERT INTO farm_batches (name, location, planting_date, area, variety, status, notes, created_at) VALUES
('Field A - Wet Season', 'Field A', '2026-01-15', '2.5 ha', 'Pioneer 30G40', 'Active', 'Regular monitoring for Fall Armyworm.', NOW()),
('Field B - Early Planting', 'Field B', '2026-02-01', '3.0 ha', 'Dekalb 9150', 'Active', 'Early planting trial.', NOW());

INSERT INTO workers (name, phone, email, address, status, date_joined, emergency_contact, emergency_phone, created_at) VALUES
('Juan Dela Cruz', '+639123456789', 'juan@example.com', 'Tarlac City, Tarlac', 'Active', '2025-01-15', 'Maria Dela Cruz', '+639171234567', NOW()),
('Maria Santos', '+639234567890', 'maria@example.com', 'Tarlac City, Tarlac', 'Active', '2025-02-01', 'Pedro Santos', '+639182345678', NOW());

INSERT INTO batch_workers (batch_id, worker_id, role, created_at) VALUES
(1, 1, 'Field Supervisor', NOW()),
(1, 2, 'Field Worker', NOW()),
(2, 2, 'Field Worker', NOW());

INSERT INTO message_templates (name, category, message, trigger_type, days_after_planting, expected_responses, active, created_at) VALUES
('Pesticide Spray Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Mag-spray para sa pang-uod/pest prevention. Reply DONE, DELAY, or HELP.', 'days_after_planting', 15, JSON_ARRAY('DONE','DELAY','HELP'), 1, NOW()),
('Herbicide Reminder', 'Pest Control', 'AniAlerto: Day {crop_day} sa {batch_name}. Reminder: herbicide/pangdamo schedule today. Reply DONE or DELAY.', 'days_after_planting', 20, JSON_ARRAY('DONE','DELAY'), 1, NOW()),
('First Fertilizer Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Unang abono schedule today. Reply DONE or DELAY.', 'days_after_planting', 15, JSON_ARRAY('DONE','DELAY'), 1, NOW()),
('Second/Last Dressing Reminder', 'Fertilization', 'AniAlerto: Day {crop_day} sa {batch_name}. Second/last dressing schedule today. Reply DONE or DELAY.', 'days_after_planting', 40, JSON_ARRAY('DONE','DELAY'), 1, NOW()),
('Harvest Readiness Reminder', 'Harvest', 'AniAlerto: Day {crop_day} sa {batch_name}. Ihanda ang harvest planning and manpower. Reply DONE to acknowledge.', 'days_after_planting', 120, JSON_ARRAY('DONE'), 1, NOW());
