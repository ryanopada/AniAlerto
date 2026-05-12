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

$phone = $_GET['phone'] ?? null;

if (!$phone) {
    echo json_encode(['error' => 'Phone number is required']);
    http_response_code(400);
    exit;
}

try {
    // --- Registered-worker gate ---
    // Reject the request immediately if the phone does not belong to an Active worker.
    $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
    $altPhone   = strpos($cleanPhone, '+63') === 0
        ? '0' . substr($cleanPhone, 3)
        : (strpos($cleanPhone, '0') === 0 ? '+63' . substr($cleanPhone, 1) : $cleanPhone);

    $check = $db->prepare(
        "SELECT id FROM workers WHERE (phone = ? OR phone = ?) AND status = 'Active' LIMIT 1"
    );
    $check->execute([$cleanPhone, $altPhone]);

    if (!$check->fetch()) {
        echo json_encode(['error' => 'Not a registered worker']);
        http_response_code(404);
        exit;
    }

    // Get outbound messages (sent TO the worker)
    $outbound = $db->prepare("
        SELECT 
            id,
            phone,
            message,
            'Sent' AS direction,
            status,
            created_at AS timestamp
        FROM sms_queue
        WHERE phone = :phone
        ORDER BY created_at DESC
    ");
    $outbound->execute(['phone' => $phone]);
    $outboundMessages = $outbound->fetchAll(PDO::FETCH_ASSOC);

    // Get inbound messages (received FROM the worker)
    // Build phone variants to match both +639xx and 09xx formats.
    $rawClean = preg_replace('/[^0-9]/', '', $phone);
    $variants = [$phone];

    if (strpos($rawClean, '63') === 0) {
        $variants[] = '+' . $rawClean;
        $variants[] = '0' . substr($rawClean, 2);
        $variants[] = $rawClean;
    } elseif (strpos($rawClean, '0') === 0) {
        $variants[] = '+63' . substr($rawClean, 1);
        $variants[] = '63' . substr($rawClean, 1);
        $variants[] = $rawClean;
    }

    $placeholders = implode(',', array_fill(0, count($variants), '?'));

    $inbound = $db->prepare("
        SELECT 
            id,
            phone,
            message,
            'Received' AS direction,
            COALESCE(command, 'No Command') AS status,
            received_at AS timestamp
        FROM inbound_messages
        WHERE phone IN ($placeholders)
        ORDER BY received_at DESC
    ");
    $inbound->execute($variants);
    $inboundMessages = $inbound->fetchAll(PDO::FETCH_ASSOC);

    // Merge and sort by timestamp (newest first)
    $allMessages = array_merge($outboundMessages, $inboundMessages);
    usort($allMessages, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Build summary stats
    $summary = [
        'total_sent' => count($outboundMessages),
        'total_received' => count($inboundMessages),
        'done_count' => count(array_filter($inboundMessages, fn($m) => strtoupper($m['status']) === 'DONE')),
        'delay_count' => count(array_filter($inboundMessages, fn($m) => strtoupper($m['status']) === 'DELAY')),
        'help_count' => count(array_filter($inboundMessages, fn($m) => strtoupper($m['status']) === 'HELP')),
    ];

    echo json_encode([
        'messages' => $allMessages,
        'summary' => $summary
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>
