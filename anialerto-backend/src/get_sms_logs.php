<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "anialerto";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$sql = "SELECT id, worker_id, phone, message, direction, status, response_text, sent_at, received_at 
        FROM sms_logs 
        ORDER BY created_at DESC";

$result = $conn->query($sql);
$logs = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $logs[] = [
            "id" => $row['id'],
            "worker_id" => $row['worker_id'],
            "phone" => $row['phone'],
            "message" => $row['message'],
            "direction" => $row['direction'],
            "status" => $row['status'],
            "response_text" => $row['response_text'],
            "sent_at" => $row['sent_at'],
            "received_at" => $row['received_at']
        ];
    }
}

echo json_encode($logs);
$conn->close();
?>