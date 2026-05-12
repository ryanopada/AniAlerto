const { readAllSMS, deleteSMS } = require('./modem');

const KNOWN_COMMANDS = ['DONE', 'DELAY', 'HELP', 'PEST', 'UOD'];

let db;
function setDB(connection) { db = connection; }

// Short codes (4-16 hex-looking digits) are Globe/TM promo senders — skip them
function isShortCode(phone) {
  const digits = phone.replace(/[^0-9A-Fa-f@]/g, '');
  return /^[\dA-Fa-f@]{4,20}$/.test(phone) && !/^\+/.test(phone) && !/^09\d{9}$/.test(phone);
}

// ─── Phone Normalization ──────────────────────────────────────────────────────
// FIX: The modem may deliver phone numbers in different formats:
//   "09123456789"       (local)
//   "+639123456789"     (international)
//   "+63 9123456789"    (with space)
// This normalizer strips all spaces/dashes and converts local 09xx to +639xx
// so it always matches the format stored in the workers table.

function normalizePhone(raw) {
  // Remove spaces, dashes, parentheses
  let phone = raw.replace(/[\s\-().]/g, '');

  // Convert local Philippine format 09xxxxxxxxx → +639xxxxxxxxx
  if (/^09\d{9}$/.test(phone)) {
    phone = '+63' + phone.slice(1);
  }

  return phone;
}

// ─── Main Polling Handler ─────────────────────────────────────────────────────

async function processIncoming() {
  const messages = await readAllSMS();
  if (messages.length === 0) return;

  console.log(`[Receiver] 📬 Found ${messages.length} message(s) on modem`);

  for (const sms of messages) {
    // ── Auto-purge operator spam (short codes) ──────────────────────────────
    // Short codes (4-8 digits like 8080, 83038303) are Globe/TM promo messages.
    // Delete them silently so SIM memory never fills up and blocks real SMS.
    if (isShortCode(sms.phone)) {
      console.log(`[Receiver] 🗑️  Deleting spam from ${sms.phone} (index ${sms.index})`);
      await deleteSMS(sms.index).catch(() => {});
      continue;
    }

    const normalizedPhone = normalizePhone(sms.phone);
    const text = sms.text.toUpperCase().trim();
    const command = KNOWN_COMMANDS.find(c => text.startsWith(c)) || null;

    try {
      // ── Gate 1: Registered-worker check ────────────────────────────────
      // Reject messages from any number not in the workers table.
      // Both +639xx and 09xx variants are checked to handle modem formatting.
      const altPhone = normalizedPhone.startsWith('+63')
        ? '0' + normalizedPhone.slice(3)          // +639123456789 → 09123456789
        : '+63' + normalizedPhone.slice(1);        // 09123456789  → +639123456789

      const [workerRows] = await db.execute(
        `SELECT id, name FROM workers WHERE (phone=? OR phone=?) AND status='Active' LIMIT 1`,
        [normalizedPhone, altPhone]
      );

      if (workerRows.length === 0) {
        console.log(`[Receiver] 🚫 Unregistered number ${normalizedPhone} — ignoring and purging from modem`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      const workerId   = workerRows[0].id;
      const workerName = workerRows[0].name;
      console.log(`[Receiver] 👤 Verified worker: ${workerName} (${normalizedPhone})`);

      // ── Gate 2: Deduplication guard ────────────────────────────────────
      // If deleteSMS failed on a previous poll, the same physical SMS will
      // appear again on AT+CMGL="ALL". This check prevents a second DB row.
      const [existing] = await db.execute(
        `SELECT id FROM inbound_messages
         WHERE (phone = ? OR phone = ?) AND message = ?
           AND received_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         LIMIT 1`,
        [normalizedPhone, altPhone, sms.text]
      );

      if (existing.length > 0) {
        console.log(`[Receiver] ⚠️  Duplicate on modem – skipping insert, deleting from modem (${normalizedPhone})`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Store in inbound_messages ───────────────────────────────────────
      const [inboundResult] = await db.execute(
        `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
         VALUES (?, ?, ?, NOW())`,
        [normalizedPhone, sms.text, command]
      );
      // INSERT IGNORE returns affectedRows=0 if the unique index blocked it
      if (inboundResult.affectedRows === 0) {
        console.log(`[Receiver] ⚠️  DB unique constraint caught duplicate for ${normalizedPhone}, purging from modem`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }
      console.log(`[Receiver] 📩 ${workerName}: "${sms.text}" → ${command || 'UNKNOWN'}`);

      // ── Mirror into sms_logs ────────────────────────────────────────────
      await db.execute(
        `INSERT IGNORE INTO sms_logs
         (worker_id, phone, message, direction, status, response_text, received_at, created_at)
         VALUES (?, ?, ?, 'Inbound', 'Received', ?, NOW(), NOW())`,
        [workerId, normalizedPhone, sms.text, command || null]
      );

      // ── Back-fill response_text on the latest Outbound log row ──────────
      // The outbound row is created by sender.js with response_text=NULL.
      // We now stamp the worker's reply onto it so SMS Monitoring can show
      // the response in the same row instead of always displaying "No Reply".
      if (command) {
        const [updateResult] = await db.execute(
          `UPDATE sms_logs
           SET response_text = ?, received_at = NOW()
           WHERE (worker_id = ? OR phone = ? OR phone = ?)
             AND direction  = 'Outbound'
             AND (response_text IS NULL OR response_text = '')
           ORDER BY created_at DESC
           LIMIT 1`,
          [command, workerId, normalizedPhone, altPhone]
        );
        if (updateResult.affectedRows > 0) {
          console.log(`[Receiver] Outbound log updated with response: ${command}`);
        } else {
          console.log(`[Receiver] No open outbound log found for ${workerName}; inbound reply was still logged`);
        }
      }

      // ── Update task status for DONE / DELAY responses ───────────────────
      if (command === 'DONE' || command === 'DELAY') {
        await updateTaskStatus(workerId, command);
      }

      // ── Mark as processed (before modem delete) ─────────────────────────
      await db.execute(
        `UPDATE inbound_messages SET processed_at=NOW() WHERE id=?`,
        [inboundResult.insertId]
      );

      // ── Delete from modem (isolated catch) ─────────────────────────────
      // Kept separate: a modem failure must NOT prevent the processed_at
      // update. The dedup guard handles the retry on the next poll.
      try {
        await deleteSMS(sms.index);
      } catch (delErr) {
        console.warn(`[Receiver] ⚠️  deleteSMS failed for index ${sms.index}: ${delErr.message} — dedup guard will handle next poll`);
      }

    } catch (err) {
      console.error(`[Receiver] ❌ DB error for ${normalizedPhone}: ${err.message}`);
    }
  }
}

// ─── Task Status Update ───────────────────────────────────────────────────────
// workerId is passed directly — the caller (processIncoming) already verified
// that this is a registered, active worker before calling this function.

async function updateTaskStatus(workerId, command) {
  const newStatus = command === 'DONE' ? 'Completed' : 'Delayed';
  const extra     = command === 'DONE' ? ', completed_at=NOW()' : '';

  const [tasks] = await db.execute(
    `SELECT st.id FROM scheduled_tasks st
     JOIN batch_workers bw ON st.batch_id = bw.batch_id
     WHERE bw.worker_id=? AND st.status='Pending'
     ORDER BY st.due_date DESC LIMIT 1`,
    [workerId]
  );

  if (!tasks.length) {
    console.log(`[Receiver] ℹ️  No pending task found for worker ${workerId}`);
    return;
  }

  await db.execute(
    `UPDATE scheduled_tasks SET status=?, updated_at=NOW()${extra} WHERE id=?`,
    [newStatus, tasks[0].id]
  );
  console.log(`[Receiver] ✅ Task ${tasks[0].id} → ${newStatus}`);
}

module.exports = { setDB, processIncoming };
