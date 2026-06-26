<?php
require_once 'Response.php';
require_once 'Helpers.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$host = "localhost";
$db_name = "u268935662_AniAlerto";
$username = "u268935662_anialerto123";
$password = "AniAlerto123";
$conn = new mysqli($host, $username, $password, $db_name);

if ($conn->connect_error) {
    Response::error("Connection failed: " . $conn->connect_error, 500);
}

$sql = "SELECT w.id, w.name, w.phone, w.status,
               COUNT(wtr.id) as total_tasks,
               SUM(CASE WHEN wtr.response_status = 'On-time' THEN 1 ELSE 0 END) as on_time,
               SUM(CASE WHEN wtr.response_status = 'Late Response' THEN 1 ELSE 0 END) as late,
               SUM(CASE WHEN wtr.response_status = 'Unresponsive' THEN 1 ELSE 0 END) as unresponsive
        FROM workers w
        LEFT JOIN worker_task_responses wtr ON w.id = wtr.worker_id
        GROUP BY w.id, w.name, w.phone, w.status
        ORDER BY w.name ASC";

$result = $conn->query($sql);
$analytics = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $analytics[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'phone' => $row['phone'],
            'status' => $row['status'],
            'total_tasks' => (int)$row['total_tasks'],
            'on_time' => (int)$row['on_time'],
            'late' => (int)$row['late'],
            'unresponsive' => (int)$row['unresponsive']
        ];
    }
}

echo json_encode($analytics);
$conn->close();
