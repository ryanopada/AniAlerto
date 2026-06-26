<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // We want to hide ALL automated messages created today from the UI.
    $today = date('Y-m-d'); // 2026-06-20
    
    // 1. Cancel from sms_queue
    $queueStmt = $db->prepare("
        UPDATE sms_queue 
        SET status = 'Failed', updated_at = NOW()
        WHERE DATE(created_at) = :today
          AND status IN ('Queued', 'Sending', 'Retry', 'Pending')
    ");
    $queueStmt->execute([':today' => $today]);
    $cancelledQueue = $queueStmt->rowCount();

    // 2. Hide from sms_logs (set direction to System-Hidden)
    $logsStmt = $db->prepare("
        UPDATE sms_logs 
        SET direction = 'System-Hidden'
        WHERE DATE(created_at) = :today
          AND direction = 'Outbound'
    ");
    $logsStmt->execute([':today' => $today]);
    $hiddenLogs = $logsStmt->rowCount();

    echo json_encode([
        'status' => 'success',
        'message' => "Safely cancelled $cancelledQueue pending messages and hid $hiddenLogs sent messages from today's UI.",
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
