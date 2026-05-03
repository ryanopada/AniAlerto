<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "anialerto");

$batch_count = $conn->query("SELECT COUNT(*) as total FROM farm_batches")->fetch_assoc()['total'];
$worker_count = $conn->query("SELECT COUNT(*) as total FROM workers")->fetch_assoc()['total'];
$msg_today = $conn->query("SELECT COUNT(*) as total FROM sms_logs WHERE DATE(created_at) = CURDATE()")->fetch_assoc()['total'];

$res = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN response_text = 'DONE' THEN 1 ELSE 0 END) as done FROM sms_logs")->fetch_assoc();
$rate = $res['total'] > 0 ? round(($res['done'] / $res['total']) * 100) : 0;

$trends = [];
$trend_res = $conn->query("SELECT DATE(created_at) as date, COUNT(*) as count FROM sms_logs GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7");
while($row = $trend_res->fetch_assoc()) { $trends[] = $row; }

echo json_encode([
    "counts" => [
        "batches" => $batch_count,
        "workers" => $worker_count,
        "messages_today" => $msg_today,
        "completion_rate" => $rate
    ],
    "trends" => array_reverse($trends),
    "batchStatus" => [
        ["name" => "Active", "value" => (int)$batch_count, "color" => "#8acb88"]
    ]
]);
?>