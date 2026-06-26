<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

$knownCommands = ['DONE', 'DELAY', 'HELP', 'PEST']; // UOD removed

try {
    // Fetch unprocessed inbound messages from registered workers only
    $stmt = $db->prepare(
        "SELECT im.id, im.phone, im.message, im.command
         FROM inbound_messages im
         WHERE im.processed_at IS NULL
         ORDER BY im.received_at ASC"
    );
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($messages as $msg) {
        $phone     = $msg['phone'];
        $replyText = strtoupper(trim($msg['message']));
        $command   = $msg['command'] ?? null;
        $msgId     = $msg['id'];

        // Resolve command if not already stored
        if (!$command) {
            foreach ($knownCommands as $cmd) {
                if (strpos($replyText, $cmd) === 0) { $command = $cmd; break; }
            }
        }

        // Resolve worker by phone (last-10-digit match)
        $digits = preg_replace('/\D+/', '', $phone);
        $key10  = strlen($digits) >= 10 ? substr($digits, -10) : $digits;
        $wStmt  = $db->prepare(
            "SELECT w.id, w.name FROM workers w
             WHERE w.status = 'Active'
               AND (w.phone = :p1
                    OR RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(w.phone,'+',''),' ',''),'-',''),'(',''),')',''),10) = :key)
             LIMIT 1"
        );
        $wStmt->execute([':p1' => $phone, ':key' => $key10]);
        $worker = $wStmt->fetch(PDO::FETCH_ASSOC);

        if (!$worker) {
            // Not a registered worker — mark processed and skip
            $db->prepare("UPDATE inbound_messages SET processed_at=NOW() WHERE id=:id")
               ->execute([':id' => $msgId]);
            continue;
        }

        $workerId   = $worker['id'];
        $workerName = $worker['name'];

        // Invalid command — mark processed, no task update
        if (!$command || !in_array($command, $knownCommands)) {
            $db->prepare("UPDATE inbound_messages SET processed_at=NOW() WHERE id=:id")
               ->execute([':id' => $msgId]);
            continue;
        }

        // Get latest pending task
        $tStmt = $db->prepare(
            "SELECT st.id, st.batch_id, mt.category, fb.name AS batch_name
             FROM scheduled_tasks st
             JOIN batch_workers bw ON st.batch_id = bw.batch_id
             LEFT JOIN message_templates mt ON st.template_id = mt.id
             LEFT JOIN farm_batches fb ON st.batch_id = fb.id
             WHERE bw.worker_id = :wid AND st.status = 'Pending'
             ORDER BY st.due_date DESC LIMIT 1"
        );
        $tStmt->execute([':wid' => $workerId]);
        $task = $tStmt->fetch(PDO::FETCH_ASSOC);

        if ($task) {
            $taskId    = $task['id'];
            $category  = $task['category'] ?? 'General';
            $batchName = $task['batch_name'] ?? '';

            if ($command === 'DONE') {
                $db->prepare("UPDATE scheduled_tasks SET status='Completed', completed_at=NOW(), updated_at=NOW() WHERE id=:tid")
                   ->execute([':tid' => $taskId]);
            } elseif ($command === 'DELAY') {
                $db->prepare("UPDATE scheduled_tasks SET status='Delayed', updated_at=NOW() WHERE id=:tid")
                   ->execute([':tid' => $taskId]);
                // Harvest delay admin alert
                if ($category === 'Harvest') {
                    $alertMsg = "Harvest DELAY from {$workerName} ({$phone}) in {$batchName}. Task #{$taskId}.";
                    $db->prepare("INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, is_read, created_at) VALUES ('DELAY', :wid, :wname, :phone, :tid, :msg, 0, NOW())")
                       ->execute([':wid' => $workerId, ':wname' => $workerName, ':phone' => $phone, ':tid' => $taskId, ':msg' => $alertMsg]);
                }
            } elseif ($command === 'HELP') {
                $db->prepare("UPDATE scheduled_tasks SET status='NeedsHelp', updated_at=NOW() WHERE id=:tid")
                   ->execute([':tid' => $taskId]);
                $batchInfo = $batchName ? " in {$batchName}" : '';
                $alertMsg  = "{$workerName} ({$phone}) needs HELP with {$category}{$batchInfo} (Task #{$taskId}).";
                $db->prepare("INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, is_read, created_at) VALUES ('HELP', :wid, :wname, :phone, :tid, :msg, 0, NOW())")
                   ->execute([':wid' => $workerId, ':wname' => $workerName, ':phone' => $phone, ':tid' => $taskId, ':msg' => $alertMsg]);
            } elseif ($command === 'PEST') {
                // PEST: do NOT change task status
                $db->prepare("INSERT INTO pest_alerts (worker_id, phone, batch_id, task_id, status, reported_at) VALUES (:wid, :phone, :bid, :tid, 'Open', NOW())")
                   ->execute([':wid' => $workerId, ':phone' => $phone, ':bid' => $task['batch_id'], ':tid' => $taskId]);
                $batchInfo = $batchName ? " in {$batchName}" : '';
                $alertMsg  = "PEST report from {$workerName} ({$phone}){$batchInfo}. Task #{$taskId}. Urgent.";
                $db->prepare("INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, is_read, created_at) VALUES ('PEST', :wid, :wname, :phone, :tid, :msg, 0, NOW())")
                   ->execute([':wid' => $workerId, ':wname' => $workerName, ':phone' => $phone, ':tid' => $taskId, ':msg' => $alertMsg]);
            }
        }

        // Mark processed
        $db->prepare("UPDATE inbound_messages SET processed_at=NOW() WHERE id=:id")
           ->execute([':id' => $msgId]);
    }

    echo "Processing complete: " . count($messages) . " message(s) checked.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>