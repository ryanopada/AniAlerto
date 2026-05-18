<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$results = [
    'tasks_created'   => 0,
    'sms_queued'      => 0,
    'sms_retried'     => 0,
    'templates_found' => 0,
    'details'         => []
];

// Reply guide appended to every scheduled SMS (mirrors scheduler.js)
$REPLY_GUIDE = "\n\nReply only: DONE, DELAY, HELP, PEST\nSumagot lamang ng: DONE, DELAY, HELP, PEST";

try {
    $nowDT   = date('Y-m-d H:i:s'); // Manila local time (XAMPP uses system clock)
    $nowDate = date('Y-m-d');

    // ── Find templates whose scheduled_send_datetime has arrived ────────────────
    $tStmt = $db->prepare("
        SELECT mt.*, fb.name AS batch_name
        FROM message_templates mt
        LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
        WHERE mt.active = 1
          AND mt.scheduled_send_datetime IS NOT NULL
          AND mt.scheduled_send_datetime <= :now
    ");
    $tStmt->execute([':now' => $nowDT]);
    $templates = $tStmt->fetchAll(PDO::FETCH_ASSOC);
    $results['templates_found'] = count($templates);

    foreach ($templates as $template) {
        $templateId = $template['id'];
        $rawMessage = $template['message'];
        $batchId    = $template['batch_id'];
        $batchName  = $template['batch_name'] ?? 'All Batches';
        $daysAfter  = $template['days_after_planting'] ?? 0;
        $msgPrefix  = substr($rawMessage, 0, 40);

        // ── Get target workers ──────────────────────────────────────────────────
        if ($batchId) {
            $wStmt = $db->prepare("
                SELECT w.id, w.phone, w.name
                FROM workers w
                JOIN batch_workers bw ON w.id = bw.worker_id
                WHERE bw.batch_id = :batchId AND w.status = 'Active'
            ");
            $wStmt->execute([':batchId' => $batchId]);
        } else {
            $wStmt = $db->prepare("SELECT id, phone, name FROM workers WHERE status = 'Active'");
            $wStmt->execute();
        }
        $workers = $wStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($workers)) {
            $results['details'][] = "No workers for template #{$templateId} ({$batchName})";
            continue;
        }

        // ── Reuse or create the scheduled_task row ──────────────────────────────
        // No DATE(created_at)=today restriction — we reuse across retry days.
        $taskId = null;
        if ($batchId) {
            $existStmt = $db->prepare("
                SELECT id FROM scheduled_tasks
                WHERE batch_id = :bid AND template_id = :tid
                LIMIT 1
            ");
            $existStmt->execute([':bid' => $batchId, ':tid' => $templateId]);
            $existRow = $existStmt->fetch(PDO::FETCH_ASSOC);

            if ($existRow) {
                $taskId = $existRow['id'];
            } else {
                try {
                    $taskStmt = $db->prepare("
                        INSERT INTO scheduled_tasks
                            (batch_id, template_id, due_date, status, created_at)
                        VALUES (:bid, :tid, :dueDate, 'Pending', NOW())
                    ");
                    $taskStmt->execute([
                        ':bid'     => $batchId,
                        ':tid'     => $templateId,
                        ':dueDate' => $nowDate,
                    ]);
                    $taskId = $db->lastInsertId();
                    $results['tasks_created']++;
                } catch (PDOException $e) {
                    $results['details'][] = "Task insert failed for template #{$templateId}: " . $e->getMessage();
                    continue;
                }
            }
        }

        foreach ($workers as $worker) {
            if (empty($worker['phone'])) continue;

            // ── Step 1: Skip if already active or sent (no DATE restriction!) ───
            // KEY FIX: removed AND DATE(st.created_at)=today — that caused the
            // scheduler to re-queue templates already sent on a prior day.
            $activeCheck = $db->prepare("
                SELECT COUNT(*) AS cnt FROM sms_queue sq
                WHERE sq.worker_id = :wid
                  AND sq.status IN ('Queued', 'Sending', 'Retry', 'Sent')
                  AND (
                    (sq.task_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM scheduled_tasks st
                        WHERE st.id = sq.task_id AND st.template_id = :tid
                    ))
                    OR
                    (sq.task_id IS NULL AND sq.message LIKE :prefix)
                  )
            ");
            $activeCheck->execute([':wid' => $worker['id'], ':tid' => $templateId, ':prefix' => $msgPrefix . '%']);
            if ($activeCheck->fetch(PDO::FETCH_ASSOC)['cnt'] > 0) {
                $results['details'][] = "Skip (active/sent): {$worker['name']} / template #{$templateId}";
                continue;
            }

            // ── Step 2: Reset a Failed row to Queued (retry, no duplicate row) ──
            $failedCheck = $db->prepare("
                SELECT id FROM sms_queue sq
                WHERE sq.worker_id = :wid
                  AND sq.status = 'Failed'
                  AND (
                    (sq.task_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM scheduled_tasks st
                        WHERE st.id = sq.task_id AND st.template_id = :tid
                    ))
                    OR
                    (sq.task_id IS NULL AND sq.message LIKE :prefix)
                  )
                ORDER BY created_at DESC LIMIT 1
            ");
            $failedCheck->execute([':wid' => $worker['id'], ':tid' => $templateId, ':prefix' => $msgPrefix . '%']);
            $failedRow = $failedCheck->fetch(PDO::FETCH_ASSOC);

            if ($failedRow) {
                $db->prepare("UPDATE sms_queue SET status='Queued', attempts=0, updated_at=NOW() WHERE id=:id")
                   ->execute([':id' => $failedRow['id']]);
                $results['sms_retried']++;
                $results['details'][] = "Retry reset: {$worker['name']} / template #{$templateId}";
                continue;
            }

            // ── Step 3: No existing row — insert a fresh Queued entry ────────────
            $finalMessage = str_replace(
                ['{batch_name}', '{crop_day}', '{worker_name}'],
                [$batchName, $daysAfter, $worker['name']],
                $rawMessage
            ) . $REPLY_GUIDE;

            $qStmt = $db->prepare("
                INSERT INTO sms_queue
                    (task_id, worker_id, phone, message, status, created_at)
                VALUES (:tid, :wid, :phone, :msg, 'Queued', NOW())
            ");
            $qStmt->execute([
                ':tid'   => $taskId,
                ':wid'   => $worker['id'],
                ':phone' => $worker['phone'],
                ':msg'   => $finalMessage,
            ]);
            $results['sms_queued']++;
            $results['details'][] = "Queued: {$worker['name']} ({$worker['phone']}) — template #{$templateId}";
        }
    }

    echo json_encode([
        'status'  => 'success',
        'message' => "Done. {$results['templates_found']} template(s) matched, "
                   . "{$results['sms_queued']} queued, {$results['sms_retried']} retried.",
        'data'    => $results,
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Scheduler error: ' . $e->getMessage()]);
    http_response_code(500);
}
?>
