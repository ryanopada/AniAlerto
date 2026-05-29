<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM sms_queue WHERE message LIKE 'try%'");
echo "Matches for 'try%':\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
