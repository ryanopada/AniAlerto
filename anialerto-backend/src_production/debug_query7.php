<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM message_recipients WHERE template_id = 41");
echo "Message Recipients for Template 41:\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
