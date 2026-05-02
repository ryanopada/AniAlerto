<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "anialerto");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $sql = "SELECT * FROM message_templates ORDER BY id ASC";
    $result = $conn->query($sql);
    $templates = [];
    while($row = $result->fetch_assoc()) {
        // Decode JSON field for React
        $row['expected_responses'] = json_decode($row['expected_responses']);
        $templates[] = $row;
    }
    echo json_encode($templates);
} 
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $responses = json_encode($data['expected_responses']);
    
    if (isset($data['id'])) {
        // UPDATE existing template
        $stmt = $conn->prepare("UPDATE message_templates SET name=?, category=?, message=?, trigger_type=?, days_after_planting=?, expected_responses=?, active=? WHERE id=?");
        $stmt->bind_param("ssssisii", $data['name'], $data['category'], $data['message'], $data['trigger_type'], $data['days_after_planting'], $responses, $data['active'], $data['id']);
    } else {
        // INSERT new template
        $stmt = $conn->prepare("INSERT INTO message_templates (name, category, message, trigger_type, days_after_planting, expected_responses, active) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssisi", $data['name'], $data['category'], $data['message'], $data['trigger_type'], $data['days_after_planting'], $responses, $data['active']);
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
}
elseif ($method == 'DELETE') {
    $id = $_GET['id'];
    $conn->query("DELETE FROM message_templates WHERE id = $id");
    echo json_encode(["status" => "deleted"]);
}
$conn->close();
?>