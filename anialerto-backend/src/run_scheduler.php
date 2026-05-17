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
    'templates_found' => 0,
    'details'         => []
];

try {
    // ── Find templates whose scheduled_send_datetime has arrived ────────────────
    // Match: date matches today AND hour matches current hour
    // This means the scheduler should be triggered at least once per hour (e.g. via cron or bat)
    $nowDate = date('Y-m-d');
    $nowHour = (int)date('H');
    $nowMin  = (int)date('i');

    $tStmt = $db->prepare("
        SELECT mt.*, fb.name AS batch_name
        FROM message_templates mt
        LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
        WHERE mt.active = 1
          AND mt.scheduled_send_datetime IS NOT NULL
          AND DATE(mt.scheduled_send_datetime)  = :today
          AND HOUR(mt.scheduled_send_datetime)  = :hour
          AND MINUTE(mt.scheduled_send_datetime) <= :minute
    ");
    $tStmt->execute([
        ':today'  => $nowDate,
        ':hour'   => $nowHour,
        ':minute' => $nowMin,
    ]);
    $templates = $tStmt->fetchAll(PDO::FETCH_ASSOC);
    $results['templates_found'] = count($templates);

    foreach ($templates as $template) {
        $templateId = $template['id'];
        $rawMessage = $template['message'];
        $batchId    = $template['batch_id'];
        $batchName  = $template['batch_name'] ?? 'All Batches';

        // ── Get target workers ──────────────────────────────────────────────────
        if ($batchId) {
            // Specific batch only
            $wStmt = $db->prepare("
                SELECT w.id, w.phone, w.name
                FROM workers w
                JOIN batch_workers bw ON w.id = bw.worker_id
                WHERE bw.batch_id = :batchId AND w.status = 'Active'
            ");
            $wStmt->execute([':batchId' => $batchId]);
        } else {
            // All active workers
            $wStmt = $db->prepare("
                SELECT id, phone, name FROM workers WHERE status = 'Active'
            ");
            $wStmt->execute();
        }
        $workers = $wStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($workers)) {
            $results['details'][] = "No workers found for template #{$templateId} ({$batchName})";
            continue;
        }

        foreach ($workers as $worker) {
            // Deduplicate: skip if already queued for this worker+template today
            $dupCheck = $db->prepare("
                SELECT COUNT(*) AS cnt FROM sms_queue sq
                WHERE sq.worker_id = :wid
                  AND EXISTS (
                      SELECT 1 FROM scheduled_tasks st
                      WHERE st.id = sq.task_id AND st.template_id = :tid
                        AND DATE(st.created_at) = :today
                  )
            ");
            $dupCheck->execute([':wid' => $worker['id'], ':tid' => $templateId, ':today' => $nowDate]);
            if ($dupCheck->fetch(PDO::FETCH_ASSOC)['cnt'] > 0) {
                $results['details'][] = "Skip dup: {$worker['name']} / template #{$templateId}";
                continue;
            }

            // Personalise message
            $daysAfter    = $template['days_after_planting'] ?? 0;
            $finalMessage = str_replace(
                ['{batch_name}', '{crop_day}', '{worker_name}'],
                [$batchName, $daysAfter, $worker['name']],
                $rawMessage
            );

            // Create scheduled_task row
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

            // Queue the SMS
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
            $results['details'][] = "Queued to {$worker['name']} ({$worker['phone']}) — template #{$templateId}";
        }
    }

    echo json_encode([
        'status'  => 'success',
        'message' => "Done. {$results['templates_found']} template(s) matched, {$results['sms_queued']} SMS queued.",
        'data'    => $results,
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Scheduler error: ' . $e->getMessage()]);
    http_response_code(500);
}
?>
