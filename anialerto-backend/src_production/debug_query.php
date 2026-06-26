<?php
require_once 'Database.php';
date_default_timezone_set('Asia/Manila');
$database = new Database();
$db = $database->getConnection();
$nowDT = date('Y-m-d H:i:s');
$q = $db->prepare("
    SELECT mt.id, mt.name, mt.scheduled_send_datetime, mt.active, DATE(mt.scheduled_send_datetime) as d, CURDATE() as cd, :now as n
    FROM message_templates mt
");
$q->execute([':now' => $nowDT]);
$all = $q->fetchAll(PDO::FETCH_ASSOC);

echo "All templates:\n";
print_r($all);

$tStmt = $db->prepare("
        SELECT mt.*, fb.name AS batch_name
        FROM message_templates mt
        LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
        WHERE mt.active = 1
          AND mt.scheduled_send_datetime IS NOT NULL
          AND mt.scheduled_send_datetime <= :now
    ");
$tStmt->execute([':now' => $nowDT]);
$matched = $tStmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nMatched:\n";
print_r($matched);
?>
