require('dotenv').config();
const mysql = require('mysql2/promise');
const { connectModem, initModem, getConnectionStatus } = require('./modem');
const { setDB: setSenderDB, processBatch } = require('./sender');
const { setDB: setReceiverDB, processIncoming } = require('./receiver');
const { setDB: setSchedulerDB, runScheduler } = require('./scheduler');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE)          || 5;
const SEND_DELAY = parseInt(process.env.SEND_DELAY_MS)       || 3000;
const POLL_MS    = parseInt(process.env.POLL_INTERVAL_MS)    || 10000;
const RECV_MS    = parseInt(process.env.RECEIVE_INTERVAL_MS) || 5000;

async function main() {
  console.log('========================================');
  console.log('   AniAlerto SMS Worker Starting...');
  console.log('========================================\n');

  // Step 1: Connect modem (auto-reconnect built in)
  connectModem();

  // Step 2: Wait for modem to power up
  await new Promise(r => setTimeout(r, 3000));

  // Step 3: Initialize modem (text mode, storage, receive mode)
  await initModem();

  // Step 4: Connect to MySQL
  let db;
  try {
    db = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log('[DB] ✅ Connected to MySQL');
  } catch (err) {
    console.error('[DB] ❌ Cannot connect to MySQL:', err.message);
    process.exit(1);
  }

  // Step 5: Share DB with sender, receiver, and scheduler
  setSenderDB(db);
  setReceiverDB(db);
  setSchedulerDB(db);

  // Step 6: Startup cleanup — fix rows stuck from a previous crash or modem outage
  // a) Any row still "Sending" means the worker crashed mid-send — move back to Retry
  await db.execute(`UPDATE sms_queue SET status='Retry' WHERE status='Sending'`);
  // b) Rows that hit the attempt cap during the previous session → Failed
  await db.execute(`UPDATE sms_queue SET status='Failed' WHERE status='Retry' AND attempts >= 3`);
  // c) KEY FIX: Scheduled messages (task_id IS NOT NULL) that became 'Failed' due to
  //    the modem being offline are NOT permanent failures — reset them to Queued so
  //    they are retried automatically in this session without any manual intervention.
  const [failReset] = await db.execute(
    `UPDATE sms_queue SET status='Queued', attempts=0, updated_at=NOW()
     WHERE status='Failed' AND task_id IS NOT NULL`
  );
  if (failReset.affectedRows > 0) {
    console.log(`[Worker] 🔄 Startup: reset ${failReset.affectedRows} failed scheduled message(s) → Queued for retry`);
  }
  // Ensure skip_log column exists (for auto-replies that should not appear in SMS Monitoring)
  await db.execute(`ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS skip_log TINYINT NOT NULL DEFAULT 0`);

  // ── Scheduled message feature migrations (safe / idempotent) ─────────────
  await db.execute(`ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_test    TINYINT  NOT NULL DEFAULT 0`);
  await db.execute(`ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS queued_at  DATETIME DEFAULT NULL`);
  await db.execute(`ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()`);
  await db.execute(`ALTER TABLE batch_workers     ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()`);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_recipients (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      template_id INT NOT NULL,
      worker_id   INT NOT NULL,
      created_at  DATETIME DEFAULT NOW(),
      UNIQUE KEY uq_tmpl_worker (template_id, worker_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      type        VARCHAR(20)  NOT NULL,
      worker_id   INT          DEFAULT NULL,
      worker_name VARCHAR(150) DEFAULT NULL,
      phone       VARCHAR(30)  DEFAULT NULL,
      task_id     INT          DEFAULT NULL,
      message     TEXT         DEFAULT NULL,
      is_read     TINYINT      NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('[DB] \u2705 Schema migrations applied');


  // Ensure help_sessions table exists (tracks workers awaiting HELP menu reply)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS help_sessions (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      worker_id  INT,
      phone      VARCHAR(20) NOT NULL,
      created_at DATETIME NOT NULL,
      INDEX idx_phone (phone),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [qRows] = await db.execute(
    `SELECT COUNT(*) as c FROM sms_queue WHERE status IN ('Queued','Retry')`
  );
  console.log(`[Worker] Startup recovery done. Pending in queue: ${qRows[0].c}`);

  // Show today's queue status breakdown to help diagnose stuck messages
  const [todayStats] = await db.execute(`
    SELECT status, COUNT(*) AS cnt FROM sms_queue
    WHERE DATE(created_at) = CURDATE()
    GROUP BY status
  `);
  if (todayStats.length > 0) {
    const summary = todayStats.map(r => `${r.status}:${r.cnt}`).join(', ');
    console.log(`[Worker] Today's SMS queue: ${summary}`);
  }

  console.log('\n[AniAlerto Worker] ✅ Running!\n');

  // ── SENDER LOOP ──────────────────────────────────────────────────────────
  // Uses recursive setTimeout (NOT setInterval) so the next send cycle only
  // starts AFTER the current one fully completes.  setInterval would fire
  // blindly every N ms even if the previous async run is still in progress,
  // which can cause duplicate sms_logs rows when the modem is slow.
  async function senderLoop() {
    if (!getConnectionStatus()) {
      console.log('[Sender] ⏸ Modem not connected, skipping...');
    } else {
      try {
        const count = await processBatch(BATCH_SIZE, SEND_DELAY);
        if (count > 0) console.log(`[Sender] ✅ Sent ${count} message(s)`);
      } catch (err) {
        console.error('[Sender] Error:', err.message);
      }
    }
    setTimeout(senderLoop, POLL_MS); // schedule NEXT run only after this one ends
  }
  setTimeout(senderLoop, POLL_MS);  // initial delay before first send attempt

  // ── RECEIVER LOOP ─────────────────────────────────────────────────────────
  // Same pattern: recursive setTimeout so concurrent polls are impossible.
  // setInterval would overlap when modem AT+CMGL takes longer than RECV_MS,
  // causing the same physical SMS to be read and inserted more than once.
  let recvTick = 0;
  async function receiverLoop() {
    if (getConnectionStatus()) {
      try {
        await processIncoming();
        recvTick++;
        // Heartbeat log every 60 s so we know receiver is alive when idle
        if (recvTick % 12 === 0) {
          console.log('[Receiver] ⏱ Polling for replies... (no new messages)');
        }
      } catch (err) {
        console.error('[Receiver] Error:', err.message);
      }
    }
    setTimeout(receiverLoop, RECV_MS); // schedule NEXT run only after this one ends
  }
  setTimeout(receiverLoop, RECV_MS);  // initial delay before first receive attempt

  // ── SCHEDULER LOOP ───────────────────────────────────────────────────────
  // Checks every 60 s for message templates whose scheduled_send_datetime
  // has arrived. Queues new SMS, retries Failed ones — no external cron or
  // manual "Run Scheduler" click required for normal operation.
  const SCHED_MS = 60_000; // check every 60 seconds
  async function schedulerLoop() {
    try {
      await runScheduler();
    } catch (err) {
      console.error('[Scheduler] Loop error:', err.message);
    }
    setTimeout(schedulerLoop, SCHED_MS); // recursive setTimeout → never overlaps
  }
  // Run once immediately on startup (catches any missed send windows from downtime),
  // then every 60 s automatically.
  await runScheduler();
  setTimeout(schedulerLoop, SCHED_MS);
  console.log('[Scheduler] ✅ Continuous scheduler active (60s interval) — no manual trigger needed');
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
