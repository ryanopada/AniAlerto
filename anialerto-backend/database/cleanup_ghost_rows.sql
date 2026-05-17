-- ============================================================
-- AniAlerto — Ghost Row Cleanup
-- Run this once in phpMyAdmin or MySQL CLI
-- ============================================================
-- Removes orphan/ghost rows from sms_logs that:
--   1. direction = 'Outbound' but sent_at IS NULL
--      → these were never actually sent by sender.js
--   2. direction = 'Inbound' — old mirror rows from before Option B
--      → now redundant; back-fill UPDATE stamps the Outbound row directly
-- ============================================================

-- Preview first (check what will be deleted):
SELECT id, direction, phone, LEFT(message, 40) AS message, sent_at, created_at
FROM sms_logs
WHERE (direction = 'Outbound' AND sent_at IS NULL)
   OR direction = 'Inbound'
ORDER BY created_at DESC;

-- ── Run the cleanup ──────────────────────────────────────────

-- Delete ghost Outbound rows (sent_at NULL = never actually sent)
DELETE FROM sms_logs
WHERE direction = 'Outbound'
  AND sent_at IS NULL;

-- Delete old Inbound mirror rows (Option B: replies live in Outbound row only)
DELETE FROM sms_logs
WHERE direction = 'Inbound';

-- Confirm result:
SELECT direction, COUNT(*) AS total FROM sms_logs GROUP BY direction;
