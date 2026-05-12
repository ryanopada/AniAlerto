<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "anialerto";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    http_response_code(500);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone     = trim($_POST['phone']   ?? 'Unknown');
    $message   = trim($_POST['message'] ?? '');
    $worker_id = isset($_POST['worker_id']) ? (int)$_POST['worker_id'] : null;

    // --- Normalize phone to +639xx format ---
    $cleanPhone = preg_replace('/[\s\-().]/', '', $phone);
    if (preg_match('/^09\d{9}$/', $cleanPhone)) {
        $cleanPhone = '+63' . substr($cleanPhone, 1);
    }

    // --- Detect command keyword ---
    $knownCommands = ['DONE', 'DELAY', 'HELP', 'PEST', 'UOD'];
    $upperMsg = strtoupper(trim($message));
    $command  = null;
    foreach ($knownCommands as $cmd) {
        if (strpos($upperMsg, $cmd) === 0) {
            $command = $cmd;
            break;
        }
    }

    // --- If worker_id not provided, look it up by phone ---
    if (!$worker_id) {
        $altPhone = strpos($cleanPhone, '+63') === 0
            ? '0' . substr($cleanPhone, 3)
            : '+63' . substr($cleanPhone, 1);
        $wStmt = $conn->prepare("SELECT id FROM workers WHERE (phone=? OR phone=?) AND status='Active' LIMIT 1");
        $wStmt->bind_param("ss", $cleanPhone, $altPhone);
        $wStmt->execute();
        $wRes = $wStmt->get_result();
        if ($wRow = $wRes->fetch_assoc()) {
            $worker_id = (int)$wRow['id'];
        }
        $wStmt->close();
    }

    // --- Registered-worker gate ---
    // Only messages from Active, registered workers are processed.
    // Unregistered numbers are silently rejected — no data is stored.
    $isRegistered = ($worker_id !== null);

    // --- Registered-worker gate: reject unregistered numbers entirely ---
    // Non-registered numbers are not stored anywhere in the system.
    if (!$isRegistered) {
        echo json_encode(["success" => false, "message" => "Unregistered number — message ignored", "registered" => false]);
        http_response_code(403);
        $conn->close();
        exit;
    }

    // --- Insert into inbound_messages (registered workers only) ---
    $stmt1 = $conn->prepare(
        "INSERT INTO inbound_messages (phone, message, command, received_at, processed_at)
         VALUES (?, ?, ?, NOW(), NOW())"
    );
    $stmt1->bind_param("sss", $cleanPhone, $message, $command);
    $inboundOk = $stmt1->execute();
    $stmt1->close();

    // --- Insert into sms_logs ---
    $stmt2 = $conn->prepare(
        "INSERT INTO sms_logs (worker_id, phone, message, direction, status, response_text, received_at, created_at)
         VALUES (?, ?, ?, 'Inbound', 'Received', ?, NOW(), NOW())"
    );
    $stmt2->bind_param("isss", $worker_id, $cleanPhone, $message, $command);
    $logsOk = $stmt2->execute();
    $stmt2->close();

    if ($inboundOk && $logsOk) {
        echo json_encode(["success" => true, "message" => "Inbound SMS recorded", "command" => $command]);
    } else {
        echo json_encode(["error" => "DATABASE_ERROR: " . $conn->error]);
        http_response_code(500);
    }
} else {
    echo json_encode(["info" => "Send a POST request with phone and message fields."]);
}

$conn->close();
?>