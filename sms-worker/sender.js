const { sendSMS } = require('./modem');

let db;
function setDB(connection) { db = connection; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Errors that indicate the GSM modem is temporarily offline/unavailable.
// These are infrastructure failures — we do NOT count them as send attempts
// so the message remains Queued and is retried as soon as the modem comes back.
function isModemOfflineError(msg) {
  return (
    msg.includes('Modem not connected') ||
    msg.includes('not connected')       ||
    msg.includes('No SMS prompt')       // AT+CMGS prompt timeout — transient modem issue
  );
}

async function processBatch(batchSize, delayMs) {
  // Lock rows to prevent duplicate sending
  await db.execute(
    `UPDATE sms_queue SET status='Sending', attempts=attempts+1, updated_at=NOW()
     WHERE status IN ('Queued','Retry') AND attempts < 3
     ORDER BY created_at ASC LIMIT ?`,
    [batchSize]
  );

  const [rows] = await db.execute(
    `SELECT * FROM sms_queue WHERE status='Sending' ORDER BY created_at ASC LIMIT ?`,
    [batchSize]
  );

  for (const sms of rows) {
    let status      = 'Failed';
    let providerRef = null;
    let rawResponse = null;
    let modemOffline = false;

    try {
      await sendSMS(sms.phone, sms.message);
      status      = 'Sent';
      providerRef = 'GSM-' + Date.now();
      rawResponse = 'OK';
      console.log(`[Sender] ✅ Sent to ${sms.phone}`);
    } catch (err) {
      rawResponse = err.message;

      if (isModemOfflineError(err.message)) {
        // ── Modem temporarily offline ──────────────────────────────────────
        // Put the row back to Queued and undo the attempt increment so we don't
        // burn through the 3-attempt limit on infrastructure-level failures.
        // The senderLoop already guards with getConnectionStatus(), but the modem
        // can disconnect mid-batch; this handles that race condition.
        modemOffline = true;
        status       = 'Queued';
        console.warn(`[Sender] ⏸  Modem offline for ${sms.phone} — resetting to Queued (attempt NOT counted)`);
      } else {
        // ── Real send failure (bad number, CMS ERROR, etc.) ────────────────
        status = sms.attempts >= 3 ? 'Failed' : 'Retry';
        console.error(`[Sender] ❌ Failed ${sms.phone} (attempt ${sms.attempts}): ${err.message}`);
      }

      // Extra cooldown after any failure so the modem recovers cleanly
      await sleep(2000);
    }

    if (modemOffline) {
      // Undo the attempt increment — this was not a real send attempt
      await db.execute(
        `UPDATE sms_queue SET status='Queued', attempts=GREATEST(0, attempts-1), updated_at=NOW() WHERE id=?`,
        [sms.id]
      );
    } else {
      await db.execute(
        `UPDATE sms_queue SET status=?, updated_at=NOW() WHERE id=?`,
        [status, sms.id]
      );
    }

    // Only log to sms_logs for task/quick-send messages.
    // Auto-replies (skip_log=1) are not shown in SMS Monitoring.
    // Modem-offline resets are also not logged (nothing was actually sent).
    if (!sms.skip_log && !modemOffline) {
      await db.execute(
        `INSERT INTO sms_logs
         (queue_id, task_id, worker_id, phone, message, direction, status, provider_ref, raw_response, sent_at, created_at)
         VALUES (?, ?, ?, ?, ?, 'Outbound', ?, ?, ?, NOW(), NOW())`,
        [sms.id, sms.task_id, sms.worker_id, sms.phone, sms.message, status, providerRef, rawResponse]
      );
    }

    await sleep(delayMs);
  }

  return rows.length;
}

module.exports = { setDB, processBatch };
