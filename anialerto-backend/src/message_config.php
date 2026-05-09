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

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Return templates joined with batch name for display
    $sql = "SELECT mt.*, fb.name AS batch_name
            FROM message_templates mt
            LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
            ORDER BY mt.id ASC";
    $result = $conn->query($sql);
    $templates = [];
    while ($row = $result->fetch_assoc()) {
        $row['expected_responses'] = json_decode($row['expected_responses']) ?? [];
        // Format scheduled_time for display (e.g., "06:00:00" -> "06:00")
        if ($row['scheduled_time']) {
            $row['scheduled_time'] = substr($row['scheduled_time'], 0, 5);
        }
        $templates[] = $row;
    }
    echo json_encode($templates);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $responses  = json_encode($data['expected_responses'] ?? []);
    $batchId    = !empty($data['batch_id']) ? intval($data['batch_id']) : null;
    $schedTime  = !empty($data['scheduled_time']) ? $data['scheduled_time'] . ':00' : '06:00:00';

    if (isset($data['id']) && $data['id']) {
        // UPDATE
        $stmt = $conn->prepare(
            "UPDATE message_templates
             SET name=?, category=?, message=?, trigger_type=?,
                 days_after_planting=?, expected_responses=?, active=?,
                 batch_id=?, scheduled_time=?
             WHERE id=?"
        );
        $stmt->bind_param(
            "ssssisissi",
            $data['name'], $data['category'], $data['message'],
            $data['trigger_type'], $data['days_after_planting'],
            $responses, $data['active'],
            $batchId, $schedTime, $data['id']
        );
    } else {
        // INSERT
        $stmt = $conn->prepare(
            "INSERT INTO message_templates
             (name, category, message, trigger_type, days_after_planting,
              expected_responses, active, batch_id, scheduled_time, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->bind_param(
            "ssssisiss",
            $data['name'], $data['category'], $data['message'],
            $data['trigger_type'], $data['days_after_planting'],
            $responses, $data['active'],
            $batchId, $schedTime
        );
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
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