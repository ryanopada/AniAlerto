<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->prepare("
        SELECT 
            im.id,
            im.phone,
            im.message,
            im.command,
            im.received_at,
            im.processed_at,
            w.name AS worker_name,
            w.id AS worker_id,
            w.assignedBatch AS batch_name
        FROM inbound_messages im
        INNER JOIN workers w ON (
            REPLACE(REPLACE(w.phone, '+63', '0'), '+', '') = REPLACE(REPLACE(im.phone, '+63', '0'), '+', '')
            OR w.phone = im.phone
        )
        WHERE w.status = 'Active'
        ORDER BY im.received_at DESC
        LIMIT 200
    ");
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build summary
    $summary = [
        'total' => count($messages),
        'done' => 0,
        'delay' => 0,
        'help' => 0,
        'other' => 0,
        'unprocessed' => 0
    ];

    foreach ($messages as $m) {
        $cmd = strtoupper(trim($m['command'] ?? ''));
        // Fall back to the message text if command column is empty
        if (!$cmd) {
            $words = preg_split('/\s+/', strtoupper(trim($m['message'] ?? '')));
            $cmd = $words[0] ?? '';
        }

        if ($cmd === 'DONE')        $summary['done']++;
        elseif ($cmd === 'DELAY')   $summary['delay']++;
        elseif ($cmd === 'HELP')    $summary['help']++;
        elseif (!$m['processed_at']) $summary['unprocessed']++;
        else                         $summary['other']++;
    }

    echo json_encode([
        'messages' => $messages,
        'summary' => $summary
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>
