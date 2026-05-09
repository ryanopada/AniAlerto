require('dotenv').config();
const mysql = require('mysql2/promise');
const { connectModem, initModem, getConnectionStatus } = require('./modem');
const { setDB: setSenderDB, processBatch } = require('./sender');
const { setDB: setReceiverDB, processIncoming } = require('./receiver');

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

  // Step 5: Share DB with sender and receiver
  setSenderDB(db);
  setReceiverDB(db);

  // Step 6: Startup cleanup — fix any rows stuck from previous crash
  await db.execute(`UPDATE sms_queue SET status='Retry' WHERE status='Sending'`);
  // Any row that already hit max attempts (3) should be Failed, not retried forever
  await db.execute(`UPDATE sms_queue SET status='Failed' WHERE status='Retry' AND attempts >= 3`);
  const [qRows] = await db.execute(
    `SELECT COUNT(*) as c FROM sms_queue WHERE status IN ('Queued','Retry')`
  );
  console.log(`[Worker] Startup recovery done. Pending in queue: ${qRows[0].c}`);
  console.log('\n[AniAlerto Worker] ✅ Running!\n');

  // ── SENDER LOOP ── checks sms_queue every 10 seconds ──────────────────────
  setInterval(async () => {
    if (!getConnectionStatus()) {
      console.log('[Sender] ⏸ Modem not connected, skipping...');
      return;
    }
    try {
      const count = await processBatch(BATCH_SIZE, SEND_DELAY);
      if (count > 0) console.log(`[Sender] ✅ Sent ${count} message(s)`);
    } catch (err) {
      console.error('[Sender] Error:', err.message);
    }
  }, POLL_MS);

  // ── RECEIVER LOOP ── polls for inbound SMS every 5 seconds ────────────────
  let recvTick = 0;
  setInterval(async () => {
    if (!getConnectionStatus()) return;
    try {
      await processIncoming();
      recvTick++;
      // Heartbeat log every 60s so we know the receiver loop is alive when idle
      if (recvTick % 12 === 0) {
        console.log('[Receiver] ⏱ Polling for replies... (no new messages)');
      }
    } catch (err) {
      console.error('[Receiver] Error:', err.message);
    }
  }, RECV_MS);
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
