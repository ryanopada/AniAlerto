const { sendSMS } = require('./modem');

let db;
function setDB(connection) { db = connection; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    let status = 'Failed';
    let providerRef = null;
    let rawResponse = null;

    try {
      await sendSMS(sms.phone, sms.message);
      status = 'Sent';
      providerRef = 'GSM-' + Date.now();
      rawResponse = 'OK';
      console.log(`[Sender] ✅ Sent to ${sms.phone}`);
    } catch (err) {
      status = sms.attempts >= 3 ? 'Failed' : 'Retry';
      rawResponse = err.message;
      console.error(`[Sender] ❌ Failed ${sms.phone}: ${err.message}`);
    }

    await db.execute(
      `UPDATE sms_queue SET status=?, updated_at=NOW() WHERE id=?`,
      [status, sms.id]
    );

    await db.execute(
      `INSERT INTO sms_logs
       (queue_id, task_id, worker_id, phone, message, direction, status, provider_ref, raw_response, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'Outbound', ?, ?, ?, NOW(), NOW())`,
      [sms.id, sms.task_id, sms.worker_id, sms.phone, sms.message, status, providerRef, rawResponse]
    );

    await sleep(delayMs);
  }

  return rows.length;
}

module.exports = { setDB, processBatch };
