const { readAllSMS, deleteSMS } = require('./modem');

// Valid first-level commands
const KNOWN_COMMANDS = ['DONE', 'DELAY', 'HELP', 'PEST'];

// ── Bilingual help menu (workers reply 1–4) ────────────────────────────
const HELP_MENU =
  'What help do you need? Reply with the number:\n' +
  '1 - Irrigation\n' +
  '2 - Fertilizer\n' +
  '3 - Pesticide Spray\n' +
  '4 - Harvest\n\n' +
  'Anong tulong ang kailangan mo? Sagot gamit ang numero:\n' +
  '1 - Patubig\n' +
  '2 - Abono\n' +
  '3 - Pesticide Spray\n' +
  '4 - Pag-aani';

// ── Help sub-type responses (English + blank line + Tagalog) ──────────────
const HELP_TYPES = {
  '1': {
    label: 'Irrigation',
    msg:
      'Irrigation Help: Ensure water reaches all plants evenly. Use the recommended amount of water and follow the irrigation schedule for your batch. Contact admin if issues persist.\n\n' +
      'Tulong sa Patubig: Siguraduhing umabot ang tubig sa lahat ng tanim nang pantay. Gamitin ang tamang dami ng tubig at sundin ang iskedyul ng patubig para sa inyong batch. Kontakin ang admin kung may problema.',
  },
  '2': {
    label: 'Fertilizer',
    msg:
      'Fertilizer Help: Apply the recommended fertilizer evenly across the field. Avoid over-application and follow the crop calendar schedule. Contact admin for questions.\n\n' +
      'Tulong sa Pataba: Ilapat ang inirerekomendang pataba nang pantay sa buong bukid. Iwasang mag-sobra at sundin ang crop calendar. Kontakin ang admin kung may katanungan.',
  },
  '3': {
    label: 'Pesticide Spray',
    msg:
      'Spray Help: Wear protective equipment. Mix pesticide as instructed. Apply evenly during low wind conditions. Contact admin if uncertain.\n\n' +
      'Tulong sa Pag-spray ng Pestisidyo: Magsuot ng proteksyon. Ihalo ang pestisidyo ayon sa tagubilin. I-apply nang pantay habang mahinang hangin. Kontakin ang admin kung hindi sigurado.',
  },
  '4': {
    label: 'Harvest',
    msg:
      'Harvest Help: Check if crops are mature. Prepare harvesting tools. Follow proper harvesting procedures to avoid losses. Contact admin for guidance.\n\n' +
      'Tulong sa Pag-aani: Suriin kung handa na ang mga pananim. Ihanda ang mga kasangkapan sa pag-aani. Sundin ang tamang pamamaraan upang maiwasan ang pagkalugi. Kontakin ang admin para sa gabay.',
  },
};

const HELP_INVALID_REPLY =
  'Invalid reply. Please reply with 1, 2, 3, or 4 according to the help menu.\n\n' +
  'Hindi wastong sagot. Mangyaring sumagot ng 1, 2, 3, o 4 ayon sa help menu.';

// Auto-reply messages (English + blank line + Tagalog)
const AUTO_REPLIES = {
  INVALID:
    'Invalid reply. Please reply only with DONE, DELAY, HELP, or PEST.\n\n' +
    'Hindi wastong sagot. Mangyaring sumagot lamang ng DONE, DELAY, HELP, o PEST.',
  DONE:
    'Task marked as completed. Thank you for the update.\n\n' +
    'Natapos na ang gawain. Salamat sa iyong pag-update.',
  DELAY:
    'Delay recorded. A follow-up reminder will be sent for this task.\n\n' +
    'Naitala ang pagka-delay. Magpapadala ng follow-up reminder para sa gawain na ito.',
  PEST:
    'Pest incident recorded. Inspect the affected area and prepare pesticide spraying according to the crop calendar. Contact admin if needed.\n\n' +
    'Naitala ang insidente ng peste. Suriin ang apektadong lugar at ihanda ang pag-spray ng pestisidyo ayon sa crop calendar. Kontakin ang admin kung kinakailangan.',
};

let db;
function setDB(connection) { db = connection; }

// ─── Phone Utilities ──────────────────────────────────────────────────────────

function phoneDigits(raw) { return String(raw || '').replace(/\D/g, ''); }
function phoneKey(raw)    { return phoneDigits(raw).slice(-10); }

function phoneVariants(raw) {
  const key = phoneKey(raw);
  return key ? [`+63${key}`, `0${key}`] : [];
}

function normalizePhone(raw) {
  const key = phoneKey(raw);
  if (key) return `+63${key}`;
  return String(raw || '').replace(/[\s\-().]/g, '');
}

function phoneMatchExpr(col) {
  return `RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${col}, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10)`;
}

function isShortCode(phone) {
  const digits = phone.replace(/[^0-9A-Fa-f@]/g, '');
  return /^[\dA-Fa-f@]{4,20}$/.test(phone) && !/^\+/.test(phone) && !/^09\d{9}$/.test(phone);
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

// Queue an auto-reply SMS via sms_queue (skip_log=1 → sender will NOT create an sms_logs row)
async function queueAutoReply(phone, message, workerId = null) {
  try {
    await db.execute(
      `INSERT INTO sms_queue (task_id, worker_id, phone, message, status, skip_log, created_at)
       VALUES (NULL, ?, ?, ?, 'Queued', 1, NOW())`,
      [workerId || null, phone, message]
    );
    console.log(`[Receiver] 📤 Auto-reply queued → ${phone}: "${message.substring(0, 60)}"`);
  } catch (err) {
    console.error(`[Receiver] ❌ queueAutoReply failed: ${err.message}`);
  }
}

// ─── Help Session Helpers ─────────────────────────────────────────────────────

// Returns session row if worker has an active help session (within 10 min), else null
async function getHelpSession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  const [rows] = await db.execute(
    `SELECT id FROM help_sessions
     WHERE (${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?)
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
     ORDER BY created_at DESC LIMIT 1`,
    [key, normalizedPhone, workerId || 0]
  );
  return rows.length ? rows[0] : null;
}

async function createHelpSession(normalizedPhone, workerId) {
  // Clear stale sessions first
  await clearHelpSession(normalizedPhone, workerId);
  await db.execute(
    `INSERT INTO help_sessions (worker_id, phone, created_at) VALUES (?, ?, NOW())`,
    [workerId || null, normalizedPhone]
  );
}

async function clearHelpSession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  await db.execute(
    `DELETE FROM help_sessions
     WHERE ${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?`,
    [key, normalizedPhone, workerId || 0]
  );
}

// Create an admin-facing alert record
async function createAlert(type, workerId, workerName, phone, taskId, message) {
  try {
    await db.execute(
      `INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [type, workerId || null, workerName, phone, taskId || null, message]
    );
    console.log(`[Receiver] 🔔 Alert [${type}]: ${message.substring(0, 60)}`);
  } catch (err) {
    console.error(`[Receiver] ❌ createAlert failed: ${err.message}`);
  }
}

// Fetch admin phone for SMS notifications
async function getAdminPhone() {
  try {
    const [rows] = await db.execute(
      `SELECT phone FROM admins WHERE phone IS NOT NULL AND phone != '' LIMIT 1`
    );
    return rows.length ? rows[0].phone : null;
  } catch {
    return null;
  }
}

// Fetch the latest Pending task for a worker (with template category & batch info)
async function getTaskContext(workerId) {
  const [rows] = await db.execute(
    `SELECT st.id, st.batch_id,
            mt.category, mt.message AS template_message,
            fb.name AS batch_name
     FROM scheduled_tasks st
     JOIN batch_workers bw ON st.batch_id = bw.batch_id
     LEFT JOIN message_templates mt ON st.template_id = mt.id
     LEFT JOIN farm_batches fb ON st.batch_id = fb.id
     WHERE bw.worker_id = ? AND st.status = 'Pending'
     ORDER BY st.due_date DESC
     LIMIT 1`,
    [workerId]
  );
  return rows.length ? rows[0] : null;
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

async function handleDone(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);
  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks
         SET status='Completed', completed_at=NOW(), updated_at=NOW()
       WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] ✅ Task ${task.id} → Completed`);
  } else {
    console.log(`[Receiver] ℹ️  No pending task for DONE from ${workerName}`);
  }
  await queueAutoReply(phone, AUTO_REPLIES.DONE, workerId);
}

async function handleDelay(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);
  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks SET status='Delayed', updated_at=NOW() WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] ⏰ Task ${task.id} → Delayed`);

    // Confirmation SMS first
    await queueAutoReply(phone, AUTO_REPLIES.DELAY, workerId);

    // Follow-up reminder
    const urgentCategories = ['Irrigation', 'Pest Control'];
    const isHarvest = task.category === 'Harvest';
    const urgentTag = urgentCategories.includes(task.category) ? 'URGENT: ' : '';
    const followUp =
      `${urgentTag}AniAlerto Reminder: You reported a delay on your ${task.category || 'farming'} task in ${task.batch_name || 'your batch'}. Please complete it as soon as possible and reply DONE when done.\n\n` +
      `${urgentTag}Paalala ng AniAlerto: Nag-ulat ka ng pagka-delay sa iyong gawaing ${task.category || 'pagsasaka'} sa ${task.batch_name || 'inyong batch'}. Mangyaring tapusin ito sa lalong madaling panahon at sumagot ng DONE kapag tapos na.\n\n` +
      `Reply only: DONE, DELAY, HELP, PEST\nSumagot lamang ng: DONE, DELAY, HELP, PEST`;
    await queueAutoReply(phone, followUp, workerId);

    // ★ FIX: Always create a dashboard checklist alert for DELAY (was Harvest-only)
    const batchInfo = task.batch_name ? ` in ${task.batch_name}` : '';
    const alertMsg  = `${workerName} (${phone}) reported DELAY on ${task.category || 'farming'} task${batchInfo}. Task #${task.id}.`;
    await createAlert('DELAY', workerId, workerName, phone, task.id, alertMsg);

    // Harvest delay → additionally notify admin by SMS
    if (isHarvest) {
      const adminPhone = await getAdminPhone();
      if (adminPhone) {
        await queueAutoReply(adminPhone, `AniAlerto Alert: ${workerName} reported HARVEST DELAY in ${task.batch_name}. Task #${task.id}. Follow up immediately.`, null);
      }
    }
  } else {
    // No pending task — still confirm, but no alert (nothing to track)
    await queueAutoReply(phone, AUTO_REPLIES.DELAY, workerId);
    console.log(`[Receiver] ℹ️  No pending task for DELAY from ${workerName}`);
  }
}

async function handleHelp(workerId, workerName, phone) {
  // ★ FIX: Guard against double-menu. If a session already exists for this worker,
  // the modem re-delivered the HELP SMS — do NOT resend the menu.
  const existingSession = await getHelpSession(phone, workerId);
  if (existingSession) {
    console.log(`[Receiver] 🆘 Help session already active for ${workerName} — skipping duplicate menu send`);
    return;
  }

  const task = await getTaskContext(workerId);

  // Mark task as NeedsHelp if one exists
  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks SET status='NeedsHelp', updated_at=NOW() WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] 🆘 Task ${task.id} → NeedsHelp`);
  }

  // Create help session (worker now awaiting menu selection)
  await createHelpSession(phone, workerId);

  // Send the numbered help menu — exactly once
  await queueAutoReply(phone, HELP_MENU, workerId);

  // Notify admin that HELP was triggered
  const batchInfo = task && task.batch_name ? ` in ${task.batch_name}` : '';
  const alertMsg  = `${workerName} (${phone}) requested HELP${batchInfo}. Menu sent — awaiting topic selection.`;
  await createAlert('HELP', workerId, workerName, phone, task ? task.id : null, alertMsg);

  console.log(`[Receiver] 🆘 HELP menu sent to ${workerName} (${phone})`);
}

// ── Two-step HELP: handle the worker's menu number reply (1–4) ────────────────
async function handleHelpReply(number, workerId, workerName, phone) {
  const helpType = HELP_TYPES[number];
  if (!helpType) return; // guard — should not happen

  const responseLabel = `HELP: ${helpType.label}`;

  // Update the sms_logs row that was stamped 'HELP' to the specific topic
  const [upd] = await db.execute(
    `UPDATE sms_logs
        SET response_text = ?,
            received_at   = NOW()
      WHERE direction     = 'Outbound'
        AND response_text = 'HELP'
        AND (
          worker_id = ?
          OR phone  = ?
          OR ${phoneMatchExpr('phone')} = ?
        )
      ORDER BY created_at DESC
      LIMIT 1`,
    [responseLabel, workerId, phone, phoneKey(phone)]
  );
  if (upd.affectedRows > 0) {
    console.log(`[Receiver] 🔗 sms_logs HELP row → ${responseLabel}`);
  }

  // Send specific help SMS to worker
  await queueAutoReply(phone, helpType.msg, workerId);

  // Notify admin with the selected topic
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      `AniAlerto: ${workerName} selected HELP topic "${helpType.label}". Phone: ${phone}.`,
      null
    );
  }

  // Clear the help session
  await clearHelpSession(phone, workerId);

  console.log(`[Receiver] 🆘 Help sub-reply processed: ${workerName} → ${helpType.label}`);
}

async function handlePest(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);

  // ── Dedup guard: skip if this worker already reported PEST in the last 5 min ──
  // Prevents duplicate guidance when the modem delivers the same SMS twice.
  const [recentPest] = await db.execute(
    `SELECT id FROM pest_alerts
     WHERE worker_id = ?
       AND reported_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
     LIMIT 1`,
    [workerId]
  );
  if (recentPest.length > 0) {
    console.log(`[Receiver] ⚠️  PEST already logged for ${workerName} (${phone}) — skipping duplicate`);
    return;
  }

  // Create pest incident
  await db.execute(
    `INSERT INTO pest_alerts (worker_id, phone, batch_id, task_id, status, reported_at)
     VALUES (?, ?, ?, ?, 'Open', NOW())`,
    [workerId, phone, task ? task.batch_id : null, task ? task.id : null]
  );

  // Admin alert + SMS (only once, only to admin)
  const batchInfo = task && task.batch_name ? ` in ${task.batch_name}` : '';
  const alertMsg = `PEST report from ${workerName} (${phone})${batchInfo}. Urgent inspection required.`;
  await createAlert('PEST', workerId, workerName, phone, task ? task.id : null, alertMsg);

  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      `AniAlerto URGENT: ${workerName} reported PEST${batchInfo}. Immediate inspection required. Phone: ${phone}.`,
      null
    );
  }

  // Send pest guidance ONLY to the reporting worker
  await queueAutoReply(phone, AUTO_REPLIES.PEST, workerId);
  console.log(`[Receiver] 🐛 Pest incident logged for ${workerName}${batchInfo}`);
  // Note: task status intentionally NOT changed for PEST
}

// ─── Main Polling Handler ─────────────────────────────────────────────────────

async function processIncoming() {
  const messages = await readAllSMS();
  if (messages.length === 0) return;

  console.log(`[Receiver] 📬 Found ${messages.length} message(s) on modem`);

  for (const sms of messages) {
    // ── Auto-purge operator spam ──────────────────────────────────────────────
    if (isShortCode(sms.phone)) {
      console.log(`[Receiver] 🗑️  Spam from ${sms.phone} — purging`);
      await deleteSMS(sms.index).catch(() => {});
      continue;
    }

    const normalizedPhone = normalizePhone(sms.phone);
    const text    = sms.text.toUpperCase().trim();
    const command = KNOWN_COMMANDS.find(c => text.startsWith(c)) || null;

    try {
      // ── Gate 1: Registered-worker check ──────────────────────────────────
      const variants = phoneVariants(normalizedPhone);
      const altPhone = variants[1] || normalizedPhone;
      const key      = phoneKey(normalizedPhone);

      const [workerRows] = await db.execute(
        `SELECT id, name FROM workers
         WHERE status='Active'
           AND (phone=? OR phone=? OR ${phoneMatchExpr('phone')}=?)
         LIMIT 1`,
        [normalizedPhone, altPhone, key]
      );

      if (workerRows.length === 0) {
        console.log(`[Receiver] 🚫 Unregistered: ${normalizedPhone} — purging`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      const workerId   = workerRows[0].id;
      const workerName = workerRows[0].name;
      console.log(`[Receiver] 👤 Verified: ${workerName} (${normalizedPhone})`);

      // ── Help session intercept: reply 1–4 while awaiting menu selection ─────
      const helpNum = sms.text.trim();
      if (/^[1-4]$/.test(helpNum)) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(`[Receiver] 🆘 Help sub-reply from ${workerName}: "${helpNum}"`);
          await db.execute(
            `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())`,
            [normalizedPhone, sms.text, `HELP:${helpNum}`]
          );
          await handleHelpReply(helpNum, workerId, workerName, normalizedPhone);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }
      }

      // ── Invalid reply while in help session (not 1–4): prompt again ─────────
      if (command === null) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(`[Receiver] ⚠️  Invalid help menu reply from ${workerName}: "${sms.text}"`);
          await queueAutoReply(normalizedPhone, HELP_INVALID_REPLY, workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }
        // No help session — normal invalid reply
        console.log(`[Receiver] ⚠️  Invalid reply from ${workerName}: "${sms.text}"`);
        await db.execute(
          `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
           VALUES (?, ?, NULL, NOW())`,
          [normalizedPhone, sms.text]
        );
        await queueAutoReply(normalizedPhone, AUTO_REPLIES.INVALID, workerId);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Gate 2: Deduplication guard ───────────────────────────────────────
      const [existing] = await db.execute(
        `SELECT id FROM inbound_messages
         WHERE (${phoneMatchExpr('phone')}=? OR phone=? OR phone=?)
           AND message=?
           AND received_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         LIMIT 1`,
        [key, normalizedPhone, altPhone, sms.text]
      );

      if (existing.length > 0) {
        console.log(`[Receiver] ⚠️  Duplicate — skipping insert, purging (${normalizedPhone})`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Store in inbound_messages (audit + dedup only) ────────────────────
      const [inboundResult] = await db.execute(
        `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
         VALUES (?, ?, ?, NOW())`,
        [normalizedPhone, sms.text, command]
      );
      if (inboundResult.affectedRows === 0) {
        console.log(`[Receiver] ⚠️  DB unique constraint caught duplicate — purging`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }
      console.log(`[Receiver] 📩 ${workerName}: "${sms.text}" → ${command}`);

      // ── Update the matching outbound sms_logs row in-place ────────────────
      // No new Inbound row — the outbound row is mutated to carry the reply.
      const [updateResult] = await db.execute(
        `UPDATE sms_logs
           SET response_text = ?,
               received_at   = NOW(),
               status        = 'Replied'
         WHERE direction  = 'Outbound'
           AND status    != 'Replied'
           AND (
             worker_id = ?
             OR phone  = ?
             OR phone  = ?
             OR ${phoneMatchExpr('phone')} = ?
           )
         ORDER BY created_at DESC
         LIMIT 1`,
        [command, workerId, normalizedPhone, altPhone, key]
      );
      if (updateResult.affectedRows > 0) {
        console.log(`[Receiver] 🔗 Outbound row updated → ${command} (${workerName})`);
      } else {
        console.log(`[Receiver] ℹ️  No pending outbound row found for ${workerName}`);
      }

      // ── Dispatch command handler ──────────────────────────────────────────
      if (command === 'DONE')  await handleDone (workerId, workerName, normalizedPhone);
      if (command === 'DELAY') await handleDelay(workerId, workerName, normalizedPhone);
      if (command === 'HELP')  await handleHelp (workerId, workerName, normalizedPhone);
      if (command === 'PEST')  await handlePest (workerId, workerName, normalizedPhone);

      // ── Mark inbound_messages as processed ───────────────────────────────
      await db.execute(
        `UPDATE inbound_messages SET processed_at=NOW() WHERE id=?`,
        [inboundResult.insertId]
      );

      // ── Delete from modem ─────────────────────────────────────────────────
      try {
        await deleteSMS(sms.index);
      } catch (delErr) {
        console.warn(`[Receiver] ⚠️  deleteSMS failed for index ${sms.index}: ${delErr.message}`);
      }

    } catch (err) {
      console.error(`[Receiver] ❌ DB error for ${normalizedPhone}: ${err.message}`);
    }
  }
}

module.exports = { setDB, processIncoming };
