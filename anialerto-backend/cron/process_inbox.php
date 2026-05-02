<?php
require_once __DIR__ . '/../src/Database.php';

// Starter processor for two-way replies.
// Insert incoming modem messages into inbound_messages, then run this script.
// If using Gammu SMSD, map messages from the Gammu inbox table into inbound_messages first.

$pdo = Database::getConnection();
$stmt = $pdo->query("SELECT * FROM inbound_messages WHERE processed_at IS NULL ORDER BY received_at ASC LIMIT 50");
$messages = $stmt->fetchAll();
$processed = 0;

foreach ($messages as $msg) {
    $command = strtoupper(trim(explode(' ', $msg['message'])[0] ?? ''));
    $workerStmt = $pdo->prepare('SELECT id FROM workers WHERE phone = ? LIMIT 1');
    $workerStmt->execute([$msg['phone']]);
    $worker = $workerStmt->fetch();
    $workerId = $worker['id'] ?? null;

    if ($workerId) {
        if ($command === 'DONE') {
            $pdo->prepare(
                "UPDATE scheduled_tasks st
                 INNER JOIN sms_queue sq ON sq.task_id = st.id
                 SET st.status = 'Completed', st.completed_at = NOW(), st.updated_at = NOW()
                 WHERE sq.worker_id = ? AND st.status IN ('Pending','Delayed')
                 ORDER BY st.due_date DESC LIMIT 1"
            )->execute([$workerId]);
        } elseif ($command === 'DELAY') {
            $pdo->prepare(
                "UPDATE scheduled_tasks st
                 INNER JOIN sms_queue sq ON sq.task_id = st.id
                 SET st.status = 'Delayed', st.updated_at = NOW()
                 WHERE sq.worker_id = ? AND st.status = 'Pending'
                 ORDER BY st.due_date DESC LIMIT 1"
            )->execute([$workerId]);
        } elseif ($command === 'HELP' || $command === 'PEST' || $command === 'UOD') {
            $reply = $command === 'HELP'
                ? 'AniAlerto HELP: Pakisunod ang task instruction. Kung may aberya, i-reply DELAY. Kung tapos na, i-reply DONE.'
                : 'AniAlerto PEST/UOD: I-check ang tanim at ihanda ang pang-spray. Hintayin ang instruction ng farm head kung malala ang infestation.';
            $pdo->prepare(
                "INSERT INTO sms_queue (worker_id, phone, message, status, attempts, created_at)
                 VALUES (?, ?, ?, 'Queued', 0, NOW())"
            )->execute([$workerId, $msg['phone'], $reply]);
        }
    }

    $pdo->prepare('UPDATE inbound_messages SET command=?, processed_at=NOW() WHERE id=?')->execute([$command, $msg['id']]);
    $processed++;
}

echo json_encode(['processed_inbound' => $processed], JSON_PRETTY_PRINT) . PHP_EOL;
