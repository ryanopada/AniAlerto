// scheduler.js — checks for due message templates and queues their SMS
// Called by index.js on a 60-second loop (no external cron needed).

let db;
function setDB(connection) { db = connection; }

// Reply guide appended to every scheduled SMS (not to auto-replies)
const REPLY_GUIDE =
  '\n\nReply only: DONE, DELAY, HELP, PEST\nSumagot lamang ng: DONE, DELAY, HELP, PEST';

async function runScheduler() {
  try {
    // ⏰ VERY IMPORTANT: The Hostinger DB server has a completely mismatched clock (approx +18hr off relative to real world).
    // To bypass the broken DB clock, we generate explicit time strings using the LOCAL laptop's Node.js time.
    const localNow = new Date();
    const currentHour = localNow.getHours();
    const currentMinute = localNow.getMinutes();

    const pad = n => String(n).padStart(2, '0');
    const yyyy = localNow.getFullYear();
    const mm = pad(localNow.getMonth() + 1);
    const dd = pad(localNow.getDate());
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const localISOTime = `${todayStr} ${pad(localNow.getHours())}:${pad(localNow.getMinutes())}:${pad(localNow.getSeconds())}`;

    // ── Find active templates whose send time has arrived ──────────────────────
    // Skip: is_test=1 (test messages) and templates already stamped with queued_at
    // (meaning they were fully queued or an admin marked them as sent).
    // Uses the explicit local Node.js time instead of the DB's NOW()
    const [templates] = await db.execute(`
      SELECT mt.*, fb.name AS batch_name
      FROM message_templates mt
      LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
      WHERE mt.active = 1
        AND mt.is_test = 0
        AND mt.queued_at IS NULL
        AND mt.scheduled_send_datetime IS NOT NULL
        AND mt.scheduled_send_datetime <= ?
    `, [localISOTime]);

    if (templates.length > 0) {
      console.log(`[Scheduler] 🕐 ${templates.length} template(s) due — checking workers...`);

      for (const tmpl of templates) {
        const templateId = tmpl.id;
        const batchId    = tmpl.batch_id || null;
        const batchName  = tmpl.batch_name || 'All Batches';
        const rawMessage = tmpl.message;
        const daysAfter  = tmpl.days_after_planting ?? 0;
        
        const cleanRawForPrefix = rawMessage.replace(/^\s*AniAlerto(?: \[[^\]]+\])?:\s*/i, '');
        const prefixStr = (batchId && batchName !== 'All Batches') ? `AniAlerto [${batchName}]: ` : 'AniAlerto: ';
        const msgPrefix = (prefixStr + cleanRawForPrefix).slice(0, 40); // used for task_id-less dedup

        // ── Get target workers via snapshot-first approach ──────────────────
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
          workers = snapshotRows;
          console.log(`[Scheduler] 📋 Template #${templateId} — snapshot: ${workers.length} recipient(s)`);

        } else if (batchId) {
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
            const [rows] = await db.execute(`
              SELECT w.id, w.phone, w.name
              FROM workers w
              JOIN batch_workers bw ON w.id = bw.worker_id
              WHERE bw.batch_id = ? AND w.status = 'Active'
            `, [batchId]);
            eligibleRows = rows;
            console.log(`[Scheduler] 📸 Template #${templateId} — auto-snapshot (legacy): ${rows.length} worker(s)`);
          }

          if (eligibleRows.length > 0) {
            for (const r of eligibleRows) {
              await db.execute(`INSERT IGNORE INTO message_recipients (template_id, worker_id) VALUES (?, ?)`, [templateId, r.id]);
            }
            workers = eligibleRows;
          }
        } else {
          const [rows] = await db.execute(`
            SELECT id, phone, name FROM workers WHERE status = 'Active'
          `);
          if (rows.length > 0) {
            for (const r of rows) {
              await db.execute(`INSERT IGNORE INTO message_recipients (template_id, worker_id) VALUES (?, ?)`, [templateId, r.id]);
            }
            workers = rows;
            console.log(`[Scheduler] 📸 Template #${templateId} — auto-snapshot (all-batch): ${rows.length} worker(s)`);
          }
        }

        if (workers.length === 0) {
          await db.execute(
            `UPDATE message_templates SET queued_at = ? WHERE id = ?`, [localISOTime, templateId]
          );
          console.log(`[Scheduler] 🔒 Template #${templateId} locked — no workers at due time, new workers will NOT receive it.`);
          continue;
        }

        // ── Reuse or create the scheduled_task row ─────────────────────────────
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
                VALUES (?, ?, ?, 'Pending', ?)
              `, [batchId, templateId, todayStr, localISOTime]);
              taskId = taskRes.insertId;
            } catch (e) {
              console.error(`[Scheduler] ❌ Task insert failed for template #${templateId}:`, e.message);
              continue;
            }
          }
        }

        // ── Per-worker dedup + retry logic ────────────────────────────────────
        let queued = 0, retried = 0, skipped = 0;

        for (const w of workers) {
          if (!w.phone) continue;

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
            continue; 
          }

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
            await db.execute(
              `UPDATE sms_queue SET status='Queued', attempts=0, updated_at=NOW() WHERE id=?`,
              [failedEntry[0].id]
            );
            console.log(`[Scheduler] 🔄 Retry reset for ${w.name} (template #${templateId})`);
            retried++;
            continue;
          }

          const finalMsg = prefixStr + cleanRawForPrefix
            .replace('{batch_name}',  batchName)
            .replace('{crop_day}',    daysAfter)
            .replace('{worker_name}', w.name)
            + REPLY_GUIDE;

          await db.execute(`
            INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at)
            VALUES (?, ?, ?, ?, 'Queued', ?)
          `, [taskId, w.id, w.phone, finalMsg, localISOTime]);

          if (taskId) {
            await db.execute(`
              INSERT INTO escalation_tracking (worker_id, task_id, status)
              SELECT ?, ?, 'Pending'
              WHERE NOT EXISTS (
                SELECT 1 FROM escalation_tracking WHERE worker_id=? AND task_id=?
              )
            `, [w.id, taskId, w.id, taskId]);
          }

          queued++;
        }

        const parts = [];
        if (queued  > 0) parts.push(`${queued} new`);
        if (retried > 0) parts.push(`${retried} retried`);
        if (skipped > 0) parts.push(`${skipped} already handled`);

        if (queued > 0 || retried > 0) {
          console.log(`[Scheduler] ✅ Template #${templateId} → ${parts.join(', ')} → "${batchName}"`);
        } else {
          console.log(`[Scheduler] ⏭  Template #${templateId} — all ${skipped} worker(s) already handled`);
        }

        await db.execute(
          `UPDATE message_templates SET queued_at = ? WHERE id = ?`,
          [localISOTime, templateId]
        );
      }
    }

    // ── Phase 2: Response Escalation Workflow ─────────────────────────────

    // 1. Unresponsive Detection & First Follow-Up (5:01 PM)
    if (currentHour >= 17 && (currentHour > 17 || currentMinute >= 1)) { // 5:01 PM onwards until Midnight
      const [r1Tasks] = await db.execute(`
        SELECT et.id as tracking_id, et.worker_id, et.task_id, w.phone, w.name as worker_name, fb.name as batch_name, mt.category
        FROM escalation_tracking et
        JOIN workers w ON et.worker_id = w.id
        JOIN scheduled_tasks st ON et.task_id = st.id
        JOIN farm_batches fb ON st.batch_id = fb.id
        LEFT JOIN message_templates mt ON st.template_id = mt.id
        WHERE et.status = 'Pending' 
          AND et.reminder_count = 0 
          AND st.due_date = ?
          AND w.unresponsive = 0
      `, [todayStr]);
      
      for (const t of r1Tasks) {
        // Tag worker Unresponsive immediately at 5:01 PM
        await db.execute(`UPDATE workers SET unresponsive=1, missed_response_count = missed_response_count + 1 WHERE id=?`, [t.worker_id]);
        await db.execute(`UPDATE escalation_tracking SET status='Unresponsive', reminder_count=1, last_reminder_at=? WHERE id=?`, [localISOTime, t.tracking_id]);

        // Send 1st reminder
        const category = t.category || 'task';
        const msg = `Reminder! We noticed you haven't responded to the ${category} schedule for ${t.batch_name}. Are there any concerns? Reply DONE, DELAY, HELP, or PEST.`;
        await db.execute(`INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at) VALUES (?, ?, ?, ?, 'Queued', ?)`, [t.task_id, t.worker_id, t.phone, msg, localISOTime]);
        
        const alertMsg = `Farmer ${t.worker_name} (ID: ${t.worker_id}) failed to respond by 5:00 PM. Marked as Unresponsive.`;
        await db.execute(`INSERT INTO alerts (type, worker_id, worker_name, message, is_read, created_at) VALUES ('UNRESPONSIVE', ?, ?, ?, 0, ?)`, [t.worker_id, t.worker_name, alertMsg, localISOTime]);
        console.log(`[Scheduler] 🚨 Tagged worker #${t.worker_id} as Unresponsive at 5:01 PM and queued 1st reminder`);
      }
    }

    // 2. Multi-Escalation Scheduling (6:00 AM & 4:30 PM)
    const isMorningTrigger = currentHour >= 6 && currentHour < 16;
    const isAfternoonTrigger = (currentHour === 16 && currentMinute >= 30) || currentHour >= 17;

    if (isMorningTrigger || isAfternoonTrigger) {
      const cutoffTime = isMorningTrigger ? `${todayStr} 00:00:00` : `${todayStr} 16:30:00`;
      
      const [escalateTasks] = await db.execute(`
        SELECT et.id as tracking_id, et.worker_id, et.task_id, w.phone, fb.name as batch_name, mt.category
        FROM escalation_tracking et
        JOIN workers w ON et.worker_id = w.id
        JOIN scheduled_tasks st ON et.task_id = st.id
        JOIN farm_batches fb ON st.batch_id = fb.id
        LEFT JOIN message_templates mt ON st.template_id = mt.id
        WHERE et.status = 'Unresponsive'
          AND et.last_reminder_at < ?
      `, [cutoffTime]);
      
      for (const t of escalateTasks) {
        const category = t.category || 'task';
        const msg = `Reminder! We noticed you haven't responded to the ${category} schedule for ${t.batch_name}. Are there any concerns? Reply DONE, DELAY, HELP, or PEST.`;
        await db.execute(`INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at) VALUES (?, ?, ?, ?, 'Queued', ?)`, [t.task_id, t.worker_id, t.phone, msg, localISOTime]);
        await db.execute(`UPDATE escalation_tracking SET reminder_count = reminder_count + 1, last_reminder_at=? WHERE id=?`, [localISOTime, t.tracking_id]);
        console.log(`[Scheduler] ⏰ Queued follow-up reminder for unresponsive worker #${t.worker_id} (Task ${t.task_id})`);
      }
    }

    // 3. Daily Sweeper (5:00 PM) for Worker Analytics
    if (currentHour >= 17) {
      const [missingResponses] = await db.execute(`
        SELECT mr.task_id, mr.worker_id
        FROM (
          SELECT st.id AS task_id, w.id AS worker_id
          FROM scheduled_tasks st
          JOIN batch_workers bw ON st.batch_id = bw.batch_id
          JOIN workers w ON bw.worker_id = w.id
          WHERE st.due_date = ?
            AND w.status = 'Active'
        ) mr
        LEFT JOIN worker_task_responses wtr ON mr.task_id = wtr.task_id AND mr.worker_id = wtr.worker_id
        WHERE wtr.id IS NULL
      `, [todayStr]);

      for (const row of missingResponses) {
        try {
          await db.execute(`
            INSERT IGNORE INTO worker_task_responses (task_id, worker_id, response_status, action_taken, responded_at)
            VALUES (?, ?, 'Unresponsive', 'NONE', NULL)
          `, [row.task_id, row.worker_id]);
        } catch(e) {}
      }
      if (missingResponses.length > 0) {
        console.log(`[Scheduler] 🌙 Sweeper: Seeded ${missingResponses.length} empty responses for analytics.`);
      }
    }


    // 5. 3-Day Delay Auto-Reset Sweeper (Runs daily at Midnight)
    if (currentHour === 0 || currentHour === 17) { // run at midnight or 5 PM to ensure it catches
      const [oldDelays] = await db.execute(`
        SELECT a.id, a.task_id, a.worker_id 
        FROM alerts a
        WHERE a.type = 'DELAY' AND a.is_read = 0
          AND a.created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
      `);
      
      for (const alert of oldDelays) {
        await db.execute('UPDATE alerts SET is_read = 1, done_reply = ? WHERE id = ?', ['Auto-Reset (3 Days)', alert.id]);
        console.log(`[Scheduler] ♻️ Auto-reset Delay Alert ${alert.id} (older than 3 days)`);
        
        // Find batch to recalculate
        let batchId = null;
        if (alert.task_id) {
          const [t] = await db.execute('SELECT batch_id FROM scheduled_tasks WHERE id=?', [alert.task_id]);
          if (t.length) batchId = t[0].batch_id;
        } else {
          const [b] = await db.execute('SELECT batch_id FROM batch_workers WHERE worker_id=?', [alert.worker_id]);
          if (b.length) batchId = b[0].batch_id;
        }
        
        if (batchId) {
          // Trigger recalculation logic inline (simplified version of recalculateBatchStatus)
          const [bRows] = await db.execute('SELECT status FROM farm_batches WHERE id = ?', [batchId]);
          if (bRows.length && bRows[0].status !== 'Harvested') {
            const [activeAlerts] = await db.execute(`
              SELECT a.type, a.delay_reason
              FROM alerts a
              LEFT JOIN scheduled_tasks st ON a.task_id = st.id
              LEFT JOIN batch_workers bw ON a.worker_id = bw.worker_id
              WHERE (st.batch_id = ? OR bw.batch_id = ?) AND a.is_read = 0
              ORDER BY a.created_at DESC
            `, [batchId, batchId]);

            let newStatus = 'Healthy';
            if (activeAlerts.some(a => a.type === 'PEST')) {
              newStatus = 'Pest-Infested';
            } else {
              const delayAlert = activeAlerts.find(a => a.type === 'DELAY');
              if (delayAlert) {
                if (delayAlert.delay_reason === 'Matinding Init') newStatus = 'Heat-Stressed';
                else if (delayAlert.delay_reason === 'Malakas na Ulan at Posibleng Pagbaha') newStatus = 'Water-Logged';
                else newStatus = 'Delayed';
              }
            }
            await db.execute('UPDATE farm_batches SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, batchId]);
          }
        }
      }
    }

    // 6. 120-Day Harvest Trigger Sweeper (Runs daily at 6 AM)
    if (currentHour === 6) {
      // Find batches exactly 120 days old or older, not harvested, and no harvest template sent yet
      const [harvestBatches] = await db.execute(`
        SELECT id, name FROM farm_batches 
        WHERE status != 'Harvested' 
          AND planting_date <= DATE_SUB(CURDATE(), INTERVAL 120 DAY)
      `);
      
      for (const batch of harvestBatches) {
        // Ensure no harvest template already scheduled
        const [existing] = await db.execute(`
          SELECT id FROM message_templates 
          WHERE batch_id = ? AND category = 'Harvest'
        `, [batch.id]);
        
        if (existing.length === 0) {
          const msg = `AniAlerto: Harvest Time for ${batch.name}! It has been 120 days since planting. Please reply DONE when the harvest is complete.\n\nOras na para anihin ang ${batch.name}. Mag-reply ng DONE kapag tapos na ang pag-aani.`;
          
          await db.execute(`
            INSERT INTO message_templates 
            (name, category, message, trigger_type, days_after_planting, active, batch_id, scheduled_time, scheduled_send_datetime, is_test, created_at)
            VALUES (?, 'Harvest', ?, 'days_after_planting', 120, 1, ?, '06:00:00', NOW(), 0, NOW())
          `, [`Harvest Trigger (${batch.name})`, msg, batch.id]);
          
          console.log(`[Scheduler] 🌾 Scheduled Harvest Message for batch ${batch.id} (${batch.name})`);
        }
      }
    }

  } catch (err) {
    console.error('[Scheduler] ❌ Error:', err.message);
  }
}

module.exports = { setDB, runScheduler };
