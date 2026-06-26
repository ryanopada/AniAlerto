<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // 1. Cancel any mistaken pending messages in sms_queue so they don't send
    $queueStmt = $db->prepare("
        UPDATE sms_queue sq
        JOIN scheduled_tasks st ON sq.task_id = st.id
        JOIN message_templates mt ON st.template_id = mt.id
        SET sq.status = 'Failed', sq.updated_at = NOW()
        WHERE mt.scheduled_send_datetime < DATE_SUB(NOW(), INTERVAL 1 DAY)
          AND sq.status IN ('Queued', 'Sending', 'Retry')
    ");
    $queueStmt->execute();
    $cancelledQueue = $queueStmt->rowCount();

    // 2. Hide already sent mistaken messages from the UI (Dashboard & Monitoring)
    $logsStmt = $db->prepare("
        UPDATE sms_logs sl
        JOIN sms_queue sq ON sl.queue_id = sq.id
        JOIN scheduled_tasks st ON sq.task_id = st.id
        JOIN message_templates mt ON st.template_id = mt.id
        SET sl.direction = 'System-Hidden'
        WHERE sl.created_at > DATE_ADD(mt.scheduled_send_datetime, INTERVAL 2 DAY)
          AND sl.direction = 'Outbound'
    ");
    $logsStmt->execute();
    $hiddenLogs = $logsStmt->rowCount();

    echo json_encode([
        'status' => 'success',
        'message' => "Safely cancelled $cancelledQueue pending messages and hid $hiddenLogs sent messages from the UI.",
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
