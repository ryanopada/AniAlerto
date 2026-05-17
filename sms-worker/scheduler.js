// scheduler.js — checks for due message templates and queues their SMS
// Called by index.js on a 60-second loop (no external cron needed).

let db;
function setDB(connection) { db = connection; }

// Reply guide appended to every scheduled SMS (not to auto-replies)
const REPLY_GUIDE =
  '\n\nReply only: DONE, DELAY, HELP, PEST\nSumagot lamang ng: DONE, DELAY, HELP, PEST';

async function runScheduler() {
  try {
    // ── Build Manila-local "now" string for comparison ─────────────────────────
    // new Date() on Windows uses system timezone; getHours() etc. return local time.
    // Stored scheduled_send_datetime values come from the datetime-local picker
    // (Manila time), so this comparison is apples-to-apples.
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const nowDT = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
                  `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const today = nowDT.slice(0, 10); // YYYY-MM-DD

    // ── Find active templates whose send time has arrived ──────────────────────
    const [templates] = await db.execute(`
      SELECT mt.*, fb.name AS batch_name
      FROM message_templates mt
      LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
      WHERE mt.active = 1
        AND mt.scheduled_send_datetime IS NOT NULL
        AND mt.scheduled_send_datetime <= ?
    `, [nowDT]);

    if (templates.length === 0) return;

    console.log(`[Scheduler] 🕐 ${templates.length} template(s) due — checking...`);

    for (const tmpl of templates) {
      const templateId = tmpl.id;
      const batchId    = tmpl.batch_id || null;
      const batchName  = tmpl.batch_name || 'All Batches';
      const rawMessage = tmpl.message;
      const daysAfter  = tmpl.days_after_planting ?? 0;

      // ── Get target workers ─────────────────────────────────────────────────
      let workers;
      if (batchId) {
        const [rows] = await db.execute(`
          SELECT w.id, w.phone, w.name
          FROM workers w
          JOIN batch_workers bw ON w.id = bw.worker_id
          WHERE bw.batch_id = ? AND w.status = 'Active'
        `, [batchId]);
        workers = rows;
      } else {
        const [rows] = await db.execute(
          `SELECT id, phone, name FROM workers WHERE status = 'Active'`
        );
        workers = rows;
      }

      if (workers.length === 0) {
        console.log(`[Scheduler] ⚠️  No workers for template #${templateId} (${batchName})`);
        continue;
      }

      // ── Reuse or create the scheduled_task row ─────────────────────────────
      // scheduled_tasks requires batch_id NOT NULL; skip for "All Batches".
      // Always reuse an existing task for this template+batch+day to avoid
      // creating duplicate task rows on retry runs.
      let taskId = null;
      if (batchId) {
        const [existing] = await db.execute(`
          SELECT id FROM scheduled_tasks
          WHERE batch_id = ? AND template_id = ? AND DATE(created_at) = ?
          LIMIT 1
        `, [batchId, templateId, today]);

        if (existing.length > 0) {
          taskId = existing[0].id;
        } else {
          try {
            const [taskRes] = await db.execute(`
              INSERT INTO scheduled_tasks (batch_id, template_id, due_date, status, created_at)
              VALUES (?, ?, ?, 'Pending', NOW())
            `, [batchId, templateId, today]);
            taskId = taskRes.insertId;
          } catch (e) {
            console.error(`[Scheduler] ❌ Task insert failed for template #${templateId}:`, e.message);
            continue;
          }
        }
      }

      // ── Queue one SMS per worker (per-worker dedup) ────────────────────────
      // KEY FIX: For each worker we check individually whether they already have
      // a live (Queued / Sending / Retry) or successfully Sent entry today.
      // 'Failed' entries are intentionally excluded — a failed send should retry.
      let queued  = 0;
      let skipped = 0;

      for (const w of workers) {
        if (!w.phone) continue;

        // Check for an active or already-sent entry for this worker + template today
        const [workerDup] = await db.execute(`
          SELECT COUNT(*) AS cnt
          FROM sms_queue sq
          WHERE sq.worker_id = ?
            AND sq.status IN ('Queued', 'Sending', 'Retry', 'Sent')
            AND DATE(sq.created_at) = ?
            AND (
              (sq.task_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM scheduled_tasks st
                WHERE st.id = sq.task_id AND st.template_id = ?
              ))
              OR
              (sq.task_id IS NULL AND sq.message LIKE ?)
            )
        `, [w.id, today, templateId, rawMessage.slice(0, 40) + '%']);

        if (workerDup[0].cnt > 0) {
          skipped++;
          continue; // already being sent or successfully sent — do not duplicate
        }

        const finalMsg = rawMessage
          .replace('{batch_name}',  batchName)
          .replace('{crop_day}',    daysAfter)
          .replace('{worker_name}', w.name)
          + REPLY_GUIDE;

        await db.execute(`
          INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at)
          VALUES (?, ?, ?, ?, 'Queued', NOW())
        `, [taskId, w.id, w.phone, finalMsg]);

        queued++;
      }

      if (queued > 0) {
        console.log(
          `[Scheduler] ✅ Template #${templateId} → queued ${queued} SMS` +
          (skipped ? ` (${skipped} already handled)` : '') +
          ` to "${batchName}"`
        );
      } else if (skipped > 0) {
        console.log(`[Scheduler] ⏭  Template #${templateId} — all ${skipped} worker(s) already handled`);
      }
    }

  } catch (err) {
    console.error('[Scheduler] ❌ Error:', err.message);
  }
}

module.exports = { setDB, runScheduler };
