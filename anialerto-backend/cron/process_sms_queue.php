<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/SmsGateway.php';

$pdo = Database::getConnection();
$gateway = new SmsGateway();

$stmt = $pdo->query("SELECT * FROM sms_queue WHERE status IN ('Queued', 'Retry') AND attempts < 3 ORDER BY created_at ASC LIMIT 20");
$messages = $stmt->fetchAll();
$processed = 0;

foreach ($messages as $sms) {
    $pdo->prepare("UPDATE sms_queue SET status='Sending', attempts=attempts+1, updated_at=NOW() WHERE id=?")->execute([$sms['id']]);
    $result = $gateway->send($sms['phone'], $sms['message']);

    $status = $result['success'] ? 'Sent' : 'Failed';
    $queueStatus = $result['success'] ? 'Sent' : 'Retry';

    // Only log to sms_logs for task/quick-send messages.
    // Auto-replies (skip_log=1) are sent but not tracked in SMS Monitoring.
    if (empty($sms['skip_log'])) {
        $pdo->prepare(
            "INSERT INTO sms_logs (queue_id, task_id, worker_id, phone, message, direction, status, provider_ref, raw_response, sent_at, created_at)
             VALUES (?, ?, ?, ?, ?, 'Outbound', ?, ?, ?, NOW(), NOW())"
        )->execute([
            $sms['id'], $sms['task_id'], $sms['worker_id'], $sms['phone'], $sms['message'],
            $status, $result['provider_ref'] ?? null, $result['raw_response'] ?? null
        ]);
    }

    $pdo->prepare("UPDATE sms_queue SET status=?, updated_at=NOW() WHERE id=?")->execute([$queueStatus, $sms['id']]);
    $processed++;
}

echo json_encode(['processed' => $processed], JSON_PRETTY_PRINT) . PHP_EOL;
