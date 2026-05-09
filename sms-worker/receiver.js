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
      // Store inbound message — use normalized phone for easy lookups
      await db.execute(
        `INSERT INTO inbound_messages (phone, message, command, received_at)
         VALUES (?, ?, ?, NOW())`,
        [normalizedPhone, sms.text, command]
      );
      console.log(`[Receiver] 📩 ${normalizedPhone}: "${sms.text}" → ${command || 'UNKNOWN'}`);

      // Update task status for DONE / DELAY responses
      if (command === 'DONE' || command === 'DELAY') {
        await updateTaskStatus(normalizedPhone, command);
      }

      // Delete from modem memory so it doesn't get re-processed next poll
      await deleteSMS(sms.index);

      // Mark as processed
      await db.execute(
        `UPDATE inbound_messages SET processed_at=NOW()
         WHERE phone=? ORDER BY received_at DESC LIMIT 1`,
        [normalizedPhone]
      );
    } catch (err) {
      console.error(`[Receiver] ❌ DB error for ${normalizedPhone}: ${err.message}`);
    }
  }
}

// ─── Task Status Update ───────────────────────────────────────────────────────

async function updateTaskStatus(phone, command) {
  // FIX: Search by both +639xx and 09xx variants to be safe
  const altPhone = phone.startsWith('+63')
    ? '0' + phone.slice(3)   // +639123456789 → 09123456789
    : '+63' + phone.slice(1); // 09123456789  → +639123456789

  const [workers] = await db.execute(
    `SELECT id FROM workers WHERE phone=? OR phone=? LIMIT 1`,
    [phone, altPhone]
  );

  if (!workers.length) {
    console.log(`[Receiver] ⚠️  No worker found for ${phone}`);
    return;
  }

  const workerId = workers[0].id;
  const newStatus = command === 'DONE' ? 'Completed' : 'Delayed';
  const extra = command === 'DONE' ? ', completed_at=NOW()' : '';

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
