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
    // Resolve worker names by worker_id first, then by normalized phone key.
    // Also backfill outbound response_text/received_at from inbound_messages when
    // older outbound rows were not updated at insert time.
    $stmt = $db->prepare("
        SELECT
            sl.id,
            COALESCE(sl.worker_id, w_by_phone.id) AS worker_id,
            COALESCE(w_by_id.name, w_by_phone.name) AS worker_name,
            sl.phone,
            sl.message,
            sl.direction,
            sl.status,
            CASE
                WHEN sl.direction = 'Outbound' AND (sl.response_text IS NULL OR sl.response_text = '')
                THEN COALESCE(
                    (
                        SELECT COALESCE(NULLIF(im.command, ''), im.message)
                        FROM inbound_messages im
                        WHERE RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(im.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10) =
                              RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sl.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10)
                          AND im.received_at >= COALESCE(sl.sent_at, sl.created_at)
                        ORDER BY im.received_at ASC
                        LIMIT 1
                    ),
                    sl.response_text
                )
                ELSE sl.response_text
            END AS response_text,
            sl.sent_at,
            CASE
                WHEN sl.direction = 'Outbound' AND sl.received_at IS NULL
                THEN (
                    SELECT im.received_at
                    FROM inbound_messages im
                    WHERE RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(im.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10) =
                          RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sl.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10)
                      AND im.received_at >= COALESCE(sl.sent_at, sl.created_at)
                    ORDER BY im.received_at ASC
                    LIMIT 1
                )
                ELSE sl.received_at
            END AS received_at,
            sl.created_at
        FROM sms_logs sl
        LEFT JOIN workers w_by_id
            ON w_by_id.id = sl.worker_id
           AND w_by_id.status = 'Active'
        LEFT JOIN workers w_by_phone ON (
            RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(w_by_phone.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10) =
            RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sl.phone,          '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10)
            AND w_by_phone.status = 'Active'
        )
        WHERE w_by_id.id IS NOT NULL OR w_by_phone.id IS NOT NULL
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
