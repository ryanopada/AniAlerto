-- =============================================================================
-- AniAlerto: Fix SMS Duplicate Logs
-- Run this ONCE against the anialerto database.
-- =============================================================================

USE anialerto;

-- ─── Step 1: Remove duplicate rows from sms_logs (keep lowest id per group) ──
-- Duplicates arise when the receiver loop fires multiple times before
-- deleteSMS() removes the message from the modem.
DELETE sl
FROM sms_logs sl
INNER JOIN (
    SELECT MIN(id) AS keep_id, phone, message, direction,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS minute_bucket
    FROM sms_logs
    WHERE direction = 'Inbound'
    GROUP BY phone, message, direction, minute_bucket
    HAVING COUNT(*) > 1
) dups
  ON sl.phone    = dups.phone
 AND sl.message  = dups.message
 AND sl.direction = dups.direction
 AND DATE_FORMAT(sl.created_at, '%Y-%m-%d %H:%i') = dups.minute_bucket
 AND sl.id <> dups.keep_id;

-- ─── Step 2: Remove duplicate rows from inbound_messages (keep lowest id) ─────
DELETE im
FROM inbound_messages im
INNER JOIN (
    SELECT MIN(id) AS keep_id, phone, message,
           DATE_FORMAT(received_at, '%Y-%m-%d %H:%i') AS minute_bucket
    FROM inbound_messages
    GROUP BY phone, message, minute_bucket
    HAVING COUNT(*) > 1
) dups
  ON im.phone   = dups.phone
 AND im.message = dups.message
 AND DATE_FORMAT(im.received_at, '%Y-%m-%d %H:%i') = dups.minute_bucket
 AND im.id <> dups.keep_id;

-- ─── Step 3: Add a unique index on sms_logs for inbound deduplication ─────────
-- This acts as a last-resort DB-level guard.  The worker uses INSERT IGNORE
-- (handled by application logic + dedup guard), but this index prevents any
-- path (PHP endpoints, future code) from creating a duplicate within the same
-- minute for the same phone + message + direction.
-- We use a prefix on `message` because TEXT columns cannot be fully indexed.
ALTER TABLE `sms_logs`
  ADD UNIQUE KEY `uniq_inbound_log`
    (`phone`, `direction`, `message`(80), `received_at`);

-- ─── Step 4: Add a unique index on inbound_messages for same protection ────────
ALTER TABLE `inbound_messages`
  ADD UNIQUE KEY `uniq_inbound_msg`
    (`phone`, `message`(80), `received_at`);

SELECT 'Done. Duplicates removed and unique indexes added.' AS status;
