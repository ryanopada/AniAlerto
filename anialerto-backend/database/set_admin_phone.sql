-- Set admin phone so HELP/PEST alerts trigger an SMS to this number
-- Run once in phpMyAdmin → anialerto database → SQL tab

UPDATE admins SET phone = '+639457365778' WHERE id = 1;

-- Verify:
SELECT id, username, full_name, phone FROM admins;
