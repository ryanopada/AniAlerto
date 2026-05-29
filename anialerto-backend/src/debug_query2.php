<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$q = $db->query("
    SELECT sq.*, st.template_id 
    FROM sms_queue sq
    LEFT JOIN scheduled_tasks st ON sq.task_id = st.id
    ORDER BY sq.created_at DESC
    LIMIT 10
");
$data = $q->fetchAll(PDO::FETCH_ASSOC);

echo "Recent SMS Queue:\n";
print_r($data);

$q2 = $db->query("
    SELECT * FROM scheduled_tasks ORDER BY created_at DESC LIMIT 5
");
$data2 = $q2->fetchAll(PDO::FETCH_ASSOC);

echo "\nRecent Tasks:\n";
print_r($data2);
?>
