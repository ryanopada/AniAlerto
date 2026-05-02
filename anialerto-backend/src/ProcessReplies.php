<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Fetch unprocessed farmer replies
    $query = "SELECT * FROM inbound_messages WHERE processed_at IS NULL";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($messages as $msg) {
        $phone = $msg['phone'];
        $replyText = strtoupper(trim($msg['message'])); 
        $msgId = $msg['id'];

        // 2. Identify the worker by their phone number
        $workerQuery = "SELECT id FROM workers WHERE phone = :phone LIMIT 1";
        $wStmt = $db->prepare($workerQuery);
        $wStmt->execute(['phone' => $phone]);
        $worker = $wStmt->fetch(PDO::FETCH_ASSOC);

        if ($worker) {
            $workerId = $worker['id'];

            // 3. Find the most recent 'Pending' task for this farmer
            $taskQuery = "SELECT st.id FROM scheduled_tasks st
                          JOIN batch_workers bw ON st.batch_id = bw.batch_id
                          WHERE bw.worker_id = :wid AND st.status = 'Pending'
                          ORDER BY st.due_date DESC LIMIT 1";
            $tStmt = $db->prepare($taskQuery);
            $tStmt->execute(['wid' => $workerId]);
            $task = $tStmt->fetch(PDO::FETCH_ASSOC);

            if ($task) {
                $taskId = $task['id'];

                // 4. Update status based on rule-based keywords
                if ($replyText === 'DONE') {
                    $updateSql = "UPDATE scheduled_tasks SET status = 'Completed', completed_at = NOW() WHERE id = :tid";
                } elseif ($replyText === 'DELAY') {
                    $updateSql = "UPDATE scheduled_tasks SET status = 'Delayed' WHERE id = :tid";
                } else {
                    $updateSql = "UPDATE scheduled_tasks SET updated_at = NOW() WHERE id = :tid";
                }
                
                $uStmt = $db->prepare($updateSql);
                $uStmt->execute(['tid' => $taskId]);
            }
        }

        // 5. Mark as processed
        $markProcessed = "UPDATE inbound_messages SET processed_at = NOW() WHERE id = :id";
        $pStmt = $db->prepare($markProcessed);
        $pStmt->execute(['id' => $msgId]);
    }
    echo "Processing complete: All new farmer replies have been checked.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>