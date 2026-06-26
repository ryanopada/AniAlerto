<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

echo "--- Recent Message Templates ---\n";
$q = $db->query("SELECT * FROM message_templates ORDER BY id DESC LIMIT 5");
print_r($q->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Recent Scheduled Tasks ---\n";
$q2 = $db->query("SELECT * FROM scheduled_tasks ORDER BY id DESC LIMIT 5");
print_r($q2->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Recent SMS Queue ---\n";
$q3 = $db->query("SELECT * FROM sms_queue ORDER BY id DESC LIMIT 10");
print_r($q3->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- Batch Workers ---\n";
$q4 = $db->query("SELECT * FROM batch_workers ORDER BY id DESC LIMIT 10");
print_r($q4->fetchAll(PDO::FETCH_ASSOC));
?>
