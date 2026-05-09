<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$results = [
    'tasks_created'  => 0,
    'sms_queued'     => 0,
    'batches_checked'=> 0,
    'details'        => []
];

try {
    // Current hour for scheduled_time comparison (HH:00:00)
    $currentHour = date('H');

    // Get all active batches
    $stmt = $db->prepare("SELECT id, name, planting_date FROM farm_batches WHERE status = 'Active'");
    $stmt->execute();
    $activeBatches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $results['batches_checked'] = count($activeBatches);

    foreach ($activeBatches as $batch) {
        $batchId      = $batch['id'];
        $batchName    = $batch['name'];
        $plantingDate = new DateTime($batch['planting_date']);
        $today        = new DateTime();
        $daysAfterPlanting = (int)$today->diff($plantingDate)->days;

        // Fetch matching templates:
        //   - trigger must match today's day count
        //   - scheduled_time hour must match current hour
        //   - batch_id must be NULL (applies to all) OR match this batch
        $tStmt = $db->prepare("
            SELECT id, message, scheduled_time, batch_id
            FROM message_templates
            WHERE trigger_type = 'days_after_planting'
              AND days_after_planting = :days
              AND active = 1
              AND HOUR(scheduled_time) = :hour
              AND (batch_id IS NULL OR batch_id = :batchId)
        ");
        $tStmt->execute([
            ':days'    => $daysAfterPlanting,
            ':hour'    => $currentHour,
            ':batchId' => $batchId,
        ]);
        $templates = $tStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($templates as $template) {
            $templateId = $template['id'];
            $rawMessage = $template['message'];
            $schedTime  = $template['scheduled_time'];

            // Avoid duplicating tasks for the same batch+template today
            $existsStmt = $db->prepare("
                SELECT COUNT(*) as cnt FROM scheduled_tasks
                WHERE batch_id = :bid AND template_id = :tid AND due_date = CURRENT_DATE
            ");
            $existsStmt->execute([':bid' => $batchId, ':tid' => $templateId]);
            if ($existsStmt->fetch(PDO::FETCH_ASSOC)['cnt'] > 0) {
                $results['details'][] = "Skipped: {$batchName} / template #{$templateId} (already scheduled today)";
                continue;
            }

            // Get active workers in this batch
            $wStmt = $db->prepare("
                SELECT w.id, w.phone, w.name
                FROM workers w
                JOIN batch_workers bw ON w.id = bw.worker_id
                WHERE bw.batch_id = :batchId AND w.status = 'Active'
            ");
            $wStmt->execute([':batchId' => $batchId]);
            $workers = $wStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($workers as $worker) {
                $finalMessage = str_replace(
                    ['{batch_name}', '{crop_day}', '{worker_name}'],
                    [$batchName, $daysAfterPlanting, $worker['name']],
                    $rawMessage
                );

                // Create scheduled task
                try {
                    $taskStmt = $db->prepare("
                        INSERT INTO scheduled_tasks (batch_id, template_id, due_date, status, created_at)
                        VALUES (:bid, :tid, CURRENT_DATE, 'Pending', NOW())
                    ");
                    $taskStmt->execute([':bid' => $batchId, ':tid' => $templateId]);
                    $taskId = $db->lastInsertId();
                    $results['tasks_created']++;
                } catch (PDOException $e) {
                    $results['details'][] = "Skipped duplicate task for {$batchName}";
                    continue;
                }

                // Queue SMS
                $qStmt = $db->prepare("
                    INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at)
                    VALUES (:tid, :wid, :phone, :msg, 'Queued', NOW())
                ");
                $qStmt->execute([
                    ':tid'   => $taskId,
                    ':wid'   => $worker['id'],
                    ':phone' => $worker['phone'],
                    ':msg'   => $finalMessage,
                ]);
                $results['sms_queued']++;
                $results['details'][] = "Queued SMS to {$worker['name']} ({$worker['phone']}) for {$batchName} at {$schedTime}";
            }
        }
    }

    echo json_encode([
        'status'  => 'success',
        'message' => "Scheduler done. {$results['tasks_created']} task(s) created, {$results['sms_queued']} SMS queued.",
        'data'    => $results,
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Scheduler failed: ' . $e->getMessage()]);
    http_response_code(500);
}
?>
