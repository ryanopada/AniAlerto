<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM sms_queue WHERE task_id IS NULL AND message LIKE 'AniAlerto [TESTING 10]: try%'");
echo "Matches:\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
