-- ============================================================
-- AniAlerto — Reply Rule Migrations
-- Run once in phpMyAdmin SQL tab
-- ============================================================

-- 1. Add NeedsHelp status to scheduled_tasks
ALTER TABLE scheduled_tasks
  MODIFY COLUMN status
    ENUM('Pending','Completed','Delayed','Cancelled','NeedsHelp')
    NOT NULL DEFAULT 'Pending';

-- 2. Add phone column to admins (for admin SMS notifications)
ALTER TABLE admins
  ADD COLUMN phone VARCHAR(30) DEFAULT NULL AFTER full_name;

-- 3. Pest incidents table
CREATE TABLE IF NOT EXISTS pest_alerts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  worker_id   INT DEFAULT NULL,
  phone       VARCHAR(30) NOT NULL,
  batch_id    INT DEFAULT NULL,
  task_id     INT DEFAULT NULL,
  status      ENUM('Open','Acknowledged','Resolved') NOT NULL DEFAULT 'Open',
  notes       TEXT DEFAULT NULL,
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME DEFAULT NULL,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id)  REFERENCES farm_batches(id) ON DELETE SET NULL
);

-- 4. Admin alerts/notifications table (used by get_alerts.php)
CREATE TABLE IF NOT EXISTS alerts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(30)  NOT NULL,
  worker_id   INT DEFAULT NULL,
  worker_name VARCHAR(150) DEFAULT NULL,
  phone       VARCHAR(30)  DEFAULT NULL,
  task_id     INT DEFAULT NULL,
  message     TEXT         DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL
);

-- 5. Remove UOD command
DELETE FROM command_responses WHERE command = 'UOD';

-- ── Verify ────────────────────────────────────────────────────────────────────
SHOW COLUMNS FROM scheduled_tasks LIKE 'status';
SHOW COLUMNS FROM admins          LIKE 'phone';
SHOW TABLES  LIKE 'pest_alerts';
SHOW TABLES  LIKE 'alerts';
SELECT command FROM command_responses ORDER BY id;
