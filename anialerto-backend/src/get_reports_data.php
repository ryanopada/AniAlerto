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

$status_sql = "SELECT COALESCE(response_text, 'Pending') as name, COUNT(*) as value FROM sms_logs GROUP BY response_text";
$status_result = $conn->query($status_sql);
$status_data = [];
while($row = $status_result->fetch_assoc()) {
    $status_data[] = ["name" => $row['name'], "value" => (int)$row['value']];
}

$volume_sql = "SELECT DATE(created_at) as date, COUNT(*) as count FROM sms_logs GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7";
$volume_result = $conn->query($volume_sql);
$volume_data = [];
while($row = $volume_result->fetch_assoc()) {
    $volume_data[] = ["date" => $row['date'], "count" => (int)$row['count']];
}

$summary_sql = "SELECT 
    COUNT(*) as total,
    COUNT(DISTINCT worker_id) as activeWorkers,
    SUM(CASE WHEN response_text = 'DONE' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN response_text = 'HELP' THEN 1 ELSE 0 END) as help_requests
    FROM sms_logs";
$summary_result = $conn->query($summary_sql)->fetch_assoc();

$total = (int)$summary_result['total'];
$completed = (int)$summary_result['completed'];

echo json_encode([
    "statusDistribution" => $status_data,
    "dailyVolume" => $volume_data,
    "summary" => [
        "total" => $total,
        "activeWorkers" => (int)$summary_result['activeWorkers'],
        "completed" => $completed,
        "helpRequests" => (int)$summary_result['help_requests'],
        "completionRate" => $total > 0 ? round(($completed / $total) * 100) : 0
    ]
]);

$conn->close();
?>