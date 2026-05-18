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
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const nowDT = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
                  `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const today = nowDT.slice(0, 10); // YYYY-MM-DD

    // ── Find active templates whose send time has arrived ──────────────────────
    // Skip: is_test=1 (test messages) and templates already stamped with queued_at
    // (meaning they were fully queued or an admin marked them as sent).
    const [templates] = await db.execute(`
      SELECT mt.*, fb.name AS batch_name
      FROM message_templates mt
      LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
      WHERE mt.active = 1
        AND mt.is_test = 0
        AND mt.queued_at IS NULL
        AND mt.scheduled_send_datetime IS NOT NULL
        AND mt.scheduled_send_datetime <= ?
    `, [nowDT]);

    if (templates.length === 0) return;

    console.log(`[Scheduler] 🕐 ${templates.length} template(s) due — checking workers...`);

    for (const tmpl of templates) {
      const templateId = tmpl.id;
      const batchId    = tmpl.batch_id || null;
      const batchName  = tmpl.batch_name || 'All Batches';
      const rawMessage = tmpl.message;
      const daysAfter  = tmpl.days_after_planting ?? 0;
      const msgPrefix  = rawMessage.slice(0, 40); // used for task_id-less dedup

      // ── Get target workers via snapshot-first approach ──────────────────
      // Priority:
      //   1. message_recipients snapshot (set at template creation time)
      //   2. Auto-build snapshot from batch_workers filtered by join date
      //   3. All active workers (all-batch templates only)
      //
      // Once a snapshot is auto-built and stored in message_recipients,
      // ALL future scheduler runs use it — new workers added later are
      // permanently excluded from this template.
      let workers = [];

      // Ensure message_recipients table exists (idempotent)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS message_recipients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_id INT NOT NULL,
          worker_id   INT NOT NULL,
          created_at  DATETIME DEFAULT NOW(),
          UNIQUE KEY uq_tmpl_worker (template_id, worker_id)
        )
      `);

      // Step 1: Check for existing snapshot
      const [snapshotRows] = await db.execute(`
        SELECT w.id, w.phone, w.name
        FROM workers w
        JOIN message_recipients mr ON w.id = mr.worker_id
        WHERE mr.template_id = ? AND w.status = 'Active'
      `, [templateId]);

      if (snapshotRows.length > 0) {
        // ✅ Snapshot exists — use it. New workers are NOT in it.
        workers = snapshotRows;
        console.log(`[Scheduler] 📋 Template #${templateId} — snapshot: ${workers.length} recipient(s)`);

      } else if (batchId) {
        // Step 2: No snapshot yet — build one now.
        // Filter by join date if template.created_at is available, so workers
        // added AFTER the template was created are excluded.
        let eligibleRows;
        if (tmpl.created_at) {
          const [rows] = await db.execute(`
            SELECT w.id, w.phone, w.name
            FROM workers w
            JOIN batch_workers bw ON w.id = bw.worker_id
            WHERE bw.batch_id = ?
              AND w.status = 'Active'
              AND bw.created_at <= ?
          `, [batchId, tmpl.created_at]);
          eligibleRows = rows;
          console.log(`[Scheduler] 📸 Template #${templateId} — auto-snapshot (join-date filter): ${rows.length} worker(s)`);
        } else {
          // No created_at on template (legacy) — use all current batch workers
          const [rows] = await db.execute(`
            SELECT w.id, w.phone, w.name
            FROM workers w
            JOIN batch_workers bw ON w.id = bw.worker_id
            WHERE bw.batch_id = ? AND w.status = 'Active'
          `, [batchId]);
          eligibleRows = rows;
          console.log(`[Scheduler] 📸 Template #${templateId} — auto-snapshot (no date filter): ${rows.length} worker(s)`);
        }

        // Persist the snapshot — future runs will use this list, not live batch_workers
        for (const w of eligibleRows) {
          await db.execute(
            `INSERT IGNORE INTO message_recipients (template_id, worker_id) VALUES (?, ?)`,
            [templateId, w.id]
          );
        }
        workers = eligibleRows;

      } else {
        // Step 3: No batch_id — send to ALL active workers (all-batch templates)
        const [rows] = await db.execute(
          `SELECT id, phone, name FROM workers WHERE status = 'Active'`
        );
        workers = rows;
      }

      if (workers.length === 0) {
        // Lock the template immediately so workers added LATER never receive this old message.
        await db.execute(
          `UPDATE message_templates SET queued_at = NOW() WHERE id = ?`, [templateId]
        );
        console.log(`[Scheduler] 🔒 Template #${templateId} locked — no workers at due time, new workers will NOT receive it.`);
        continue;
      }

      // ── Reuse or create the scheduled_task row ─────────────────────────────
      // Remove the DATE(created_at)=today restriction so we reuse the existing
      // task row across retry runs on later days (avoids duplicate task rows).
      let taskId = null;
      if (batchId) {
        const [existing] = await db.execute(`
          SELECT id FROM scheduled_tasks
          WHERE batch_id = ? AND template_id = ?
          LIMIT 1
        `, [batchId, templateId]);

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

      // ── Per-worker dedup + retry logic ────────────────────────────────────
      // Strategy (in order):
      //   1. Active entry (Queued/Sending/Retry/Sent) exists  → skip (already handled)
      //   2. Failed entry exists                               → reset to Queued (retry, no new row)
      //   3. No entry                                         → insert new Queued row
      //
      // KEY FIX: No DATE restriction on sq.created_at — that old restriction caused
      // the scheduler to re-queue templates that were already sent on a prior day.
      let queued = 0, retried = 0, skipped = 0;

      for (const w of workers) {
        if (!w.phone) continue;

        // Step 1 — is there already an active or successfully sent row?
        const [activeEntry] = await db.execute(`
          SELECT COUNT(*) AS cnt
          FROM sms_queue sq
          WHERE sq.worker_id = ?
            AND sq.status IN ('Queued', 'Sending', 'Retry', 'Sent')
            AND (
              (sq.task_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM scheduled_tasks st
                WHERE st.id = sq.task_id AND st.template_id = ?
              ))
              OR
              (sq.task_id IS NULL AND sq.message LIKE ?)
            )
        `, [w.id, templateId, msgPrefix + '%']);

        if (activeEntry[0].cnt > 0) {
          skipped++;
          continue; // already in-flight or done — do not duplicate
        }

        // Step 2 — any Failed row we can reset instead of creating a duplicate?
        const [failedEntry] = await db.execute(`
          SELECT id FROM sms_queue sq
          WHERE sq.worker_id = ?
            AND sq.status = 'Failed'
            AND (
              (sq.task_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM scheduled_tasks st
                WHERE st.id = sq.task_id AND st.template_id = ?
              ))
              OR
              (sq.task_id IS NULL AND sq.message LIKE ?)
            )
          ORDER BY created_at DESC LIMIT 1
        `, [w.id, templateId, msgPrefix + '%']);

        if (failedEntry.length > 0) {
          // Reset Failed → Queued with fresh attempt counter (no duplicate row)
          await db.execute(
            `UPDATE sms_queue SET status='Queued', attempts=0, updated_at=NOW() WHERE id=?`,
            [failedEntry[0].id]
          );
          console.log(`[Scheduler] 🔄 Retry reset for ${w.name} (template #${templateId})`);
          retried++;
          continue;
        }

        // Step 3 — no existing row: insert a fresh Queued entry
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

      // ── Log summary + stamp queued_at ─────────────────────────────────────
      const parts = [];
      if (queued  > 0) parts.push(`${queued} new`);
      if (retried > 0) parts.push(`${retried} retried`);
      if (skipped > 0) parts.push(`${skipped} already handled`);

      if (queued > 0 || retried > 0) {
        console.log(`[Scheduler] ✅ Template #${templateId} → ${parts.join(', ')} → "${batchName}"`);
      } else {
        console.log(`[Scheduler] ⏭  Template #${templateId} — all ${skipped} worker(s) already handled`);
      }

      // Always stamp queued_at after first processing pass (queued, retried, OR all-skipped).
      // This snapshot-locks the template so workers added AFTER this point never
      // receive a message that was intended for the batch at an earlier time.
      await db.execute(
        `UPDATE message_templates SET queued_at = NOW() WHERE id = ?`,
        [templateId]
      );
    }

  } catch (err) {
    console.error('[Scheduler] ❌ Error:', err.message);
  }
}

module.exports = { setDB, runScheduler };
