-- Weather-Aware Decision Support Migration

-- 1. Add municipality to farm_batches
ALTER TABLE farm_batches ADD COLUMN IF NOT EXISTS municipality VARCHAR(100) DEFAULT 'Mapandan, Pangasinan';

-- 2. Add weather sensitivity flags to message_templates
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_weather_sensitive TINYINT(1) DEFAULT 0;
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS weather_rules JSON DEFAULT NULL;

-- 3. Update scheduled_tasks status enum to include Weather_Hold
ALTER TABLE scheduled_tasks MODIFY COLUMN status ENUM('Pending','Completed','Delayed','Cancelled','Weather_Hold') NOT NULL DEFAULT 'Pending';

-- 4. Add weather reason to scheduled_tasks
ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS weather_reason VARCHAR(255) DEFAULT NULL;
