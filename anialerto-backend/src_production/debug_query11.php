<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM sms_queue ORDER BY id DESC LIMIT 10");
echo "Latest SMS:\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
