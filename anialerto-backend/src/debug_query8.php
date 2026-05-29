<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("SELECT * FROM farm_batches WHERE id = 21");
echo "Farm Batch 21:\n";
print_r($q->fetchAll(PDO::FETCH_ASSOC));
?>
