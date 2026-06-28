<?php
require 'Database.php';
$db = (new Database())->getConnection();

// First, let's see what dates ACTUALLY exist in the database!
$stmt = $db->query("SELECT DATE(created_at) as d, count(*) as c FROM sms_logs GROUP BY d ORDER BY d DESC");
$dates = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Dates in DB:\n";
print_r($dates);

// Second, let's run the exact custom query
$where = "sl.direction = 'Outbound' AND sl.sent_at IS NOT NULL AND sl.message NOT LIKE 'Reminder!%'";
$where .= " AND DATE(sl.created_at) >= ? AND DATE(sl.created_at) <= ?";
$params = ['2026-06-12', '2026-06-28'];

$stmt = $db->prepare("SELECT COUNT(*) as total FROM sms_logs sl WHERE $where");
$stmt->execute($params);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nCount with custom date filter:\n";
print_r($result);
?>
