<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$conn = new mysqli("localhost", "root", "", "anialerto");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

// Auto-add new columns if they don't exist yet (safe to run repeatedly)
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS batch_id INT(11) DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00'");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS plant_date DATE DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS scheduled_send_datetime DATETIME DEFAULT NULL");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $sql = "SELECT mt.*, fb.name AS batch_name
            FROM message_templates mt
            LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
            ORDER BY mt.id ASC";
    $result = $conn->query($sql);
    $templates = [];
    while ($row = $result->fetch_assoc()) {
        $row['expected_responses'] = json_decode($row['expected_responses']) ?? [];
        if ($row['scheduled_time']) {
            $row['scheduled_time'] = substr($row['scheduled_time'], 0, 5);
        }
        if ($row['scheduled_send_datetime']) {
            $row['scheduled_send_datetime'] = substr($row['scheduled_send_datetime'], 0, 16);
        }
        $templates[] = $row;
    }
    echo json_encode($templates);

} elseif ($method == 'POST') {
    $data      = json_decode(file_get_contents("php://input"), true);
    $responses = json_encode($data['expected_responses'] ?? []);
    $batchId   = !empty($data['batch_id']) ? intval($data['batch_id']) : null;
    $plantDate = !empty($data['plant_date']) ? $data['plant_date'] : null;

    // scheduled_send_datetime comes as "YYYY-MM-DDTHH:MM" from datetime-local input
    $sendDT    = null;
    if (!empty($data['scheduled_send_datetime'])) {
        // Normalize: replace 'T' separator and append seconds if missing
        $raw = str_replace('T', ' ', $data['scheduled_send_datetime']);
        $sendDT = (strlen($raw) === 16) ? $raw . ':00' : $raw;
    }

    // Extract HH:MM for scheduled_time from the datetime
    $schedTime = '06:00:00';
    if ($sendDT) {
        $schedTime = substr($sendDT, 11, 5) . ':00'; // "HH:MM:00"
    } elseif (!empty($data['scheduled_time'])) {
        $schedTime = $data['scheduled_time'] . ':00';
    }

    // Auto-compute days_after_planting from the two dates
    $daysAfter = 0;
    if ($plantDate && $sendDT) {
        $p = new DateTime($plantDate);
        $s = new DateTime($sendDT);
        $daysAfter = (int)$p->diff($s)->days;
    } elseif (isset($data['days_after_planting'])) {
        $daysAfter = intval($data['days_after_planting']);
    }

    $name        = $data['name']         ?? '';
    $category    = $data['category']     ?? 'General';
    $message     = $data['message']      ?? '';
    $triggerType = $data['trigger_type'] ?? 'days_after_planting';
    $active      = isset($data['active']) ? intval($data['active']) : 1;

    if (isset($data['id']) && $data['id']) {
        // UPDATE — 12 params: s,s,s,s,i,s,i,s,s,s,s,i
        $stmt = $conn->prepare(
            "UPDATE message_templates
             SET name=?, category=?, message=?, trigger_type=?,
                 days_after_planting=?, expected_responses=?, active=?,
                 batch_id=?, scheduled_time=?,
                 plant_date=?, scheduled_send_datetime=?
             WHERE id=?"
        );
        $id = intval($data['id']);
        $stmt->bind_param(
            "ssssisissssi",
            $name, $category, $message, $triggerType,
            $daysAfter, $responses, $active,
            $batchId, $schedTime,
            $plantDate, $sendDT, $id
        );
    } else {
        // INSERT — 11 params: s,s,s,s,i,s,i,s,s,s,s
        $stmt = $conn->prepare(
            "INSERT INTO message_templates
             (name, category, message, trigger_type, days_after_planting,
              expected_responses, active, batch_id, scheduled_time,
              plant_date, scheduled_send_datetime, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->bind_param(
            "ssssisissss",
            $name, $category, $message, $triggerType,
            $daysAfter, $responses, $active,
            $batchId, $schedTime,
            $plantDate, $sendDT
        );
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    $stmt->close();

} elseif ($method == 'DELETE') {
    $id = intval($_GET['id']);
    $conn->query("DELETE FROM message_templates WHERE id = $id");
    echo json_encode(["status" => "deleted"]);
}

$conn->close();
?>