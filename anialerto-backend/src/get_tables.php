<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();
$q = $db->query("SHOW TABLES");
print_r($q->fetchAll(PDO::FETCH_COLUMN));
?>
