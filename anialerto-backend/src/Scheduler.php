<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $batchQuery = "SELECT id, name, planting_date FROM farm_batches WHERE status = 'Active'";
    $stmt = $db->prepare($batchQuery);
    $stmt->execute();
    $activeBatches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($activeBatches as $batch) {
        $batchId = $batch['id'];
        $batchName = $batch['name'];
        $plantingDate = new DateTime($batch['planting_date']);
        $today = new DateTime();
        
        $interval = $today->diff($plantingDate);
        $daysAfterPlanting = $interval->days;

        $templateQuery = "SELECT id, message FROM message_templates 
                          WHERE trigger_type = 'days_after_planting' 
                          AND days_after_planting = :days 
                          AND active = 1";
        $tStmt = $db->prepare($templateQuery);
        $tStmt->bindParam(':days', $daysAfterPlanting);
        $tStmt->execute();
        $templates = $tStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($templates as $template) {
            $templateId = $template['id'];
            $rawMessage = $template['message'];

            $workerQuery = "SELECT w.id, w.phone, w.name FROM workers w
                            JOIN batch_workers bw ON w.id = bw.worker_id
                            WHERE bw.batch_id = :batch_id AND w.status = 'Active'";
            $wStmt = $db->prepare($workerQuery);
            $wStmt->bindParam(':batch_id', $batchId);
            $wStmt->execute();
            $workers = $wStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($workers as $worker) {
                $workerId = $worker['id'];
                $phoneNumber = $worker['phone'];
                
                $finalMessage = str_replace(
                    ['{batch_name}', '{crop_day}', '{worker_name}'], 
                    [$batchName, $daysAfterPlanting, $worker['name']], 
                    $rawMessage
                );

$taskSql = "INSERT INTO scheduled_tasks (batch_id, template_id, due_date, status, created_at) 
            VALUES (:bid, :tid, CURRENT_DATE, 'Pending', NOW())";
$taskStmt = $db->prepare($taskSql);

try {
    $taskStmt->execute(['bid' => $batchId, 'tid' => $templateId]);
    $taskId = $db->lastInsertId();
    echo "Successfully created task ID: $taskId <br>";
} catch (PDOException $e) {
    echo "Database Error creating task: " . $e->getMessage() . "<br>";
    $taskId = null;
}

                if ($taskId) {
                    $queueSql = "INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at) 
                                 VALUES (:tid, :wid, :phone, :msg, 'Queued', NOW())";
                    $qStmt = $db->prepare($queueSql);
                    $qStmt->execute([
                        'tid' => $taskId,
                        'wid' => $workerId,
                        'phone' => $phoneNumber,
                        'msg' => $finalMessage
                    ]);
                }
            }
        }
    }
    echo "Scheduler ran successfully. Check your sms_queue table.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>