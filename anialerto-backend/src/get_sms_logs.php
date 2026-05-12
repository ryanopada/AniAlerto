<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // INNER JOIN ensures only logs from registered, active workers are returned.
    // Inbound phone numbers may arrive in either +639xx or 09xx format;
    // the REPLACE() normalises both sides to the same local 09xx form for matching.
    $stmt = $db->prepare("
        SELECT
            sl.id,
            sl.worker_id,
            w.name        AS worker_name,
            sl.phone,
            sl.message,
            sl.direction,
            sl.status,
            sl.response_text,
            sl.sent_at,
            sl.received_at,
            sl.created_at
        FROM sms_logs sl
        INNER JOIN workers w ON (
            w.id = sl.worker_id
            OR REPLACE(REPLACE(w.phone, '+63', '0'), '+', '') =
               REPLACE(REPLACE(sl.phone,  '+63', '0'), '+', '')
        )
        WHERE w.status = 'Active'
        ORDER BY sl.created_at DESC
        LIMIT 500
    ");
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($logs);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>