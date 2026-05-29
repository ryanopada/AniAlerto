<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

echo "--- Workers in Batch 21 ---\n";
$q = $db->query("
    SELECT w.id, w.name, w.phone 
    FROM workers w
    JOIN batch_workers bw ON w.id = bw.worker_id
    WHERE bw.batch_id = 21
");
print_r($q->fetchAll(PDO::FETCH_ASSOC));

echo "--- All batch_workers ---\n";
$q2 = $db->query("SELECT * FROM batch_workers");
print_r($q2->fetchAll(PDO::FETCH_ASSOC));
?>
