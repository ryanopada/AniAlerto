<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM sms_queue WHERE task_id = 5");
echo "SMS Queue for Task 5:\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
