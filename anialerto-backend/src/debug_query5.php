<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

$wid = 30;
$tid = 41;
$prefix = 'AniAlerto%';

$activeCheck = $db->prepare("
    SELECT sq.* FROM sms_queue sq
    WHERE sq.worker_id = :wid
      AND sq.status IN ('Queued', 'Sending', 'Retry', 'Sent')
      AND (
        (sq.task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM scheduled_tasks st
            WHERE st.id = sq.task_id AND st.template_id = :tid
        ))
        OR
        (sq.task_id IS NULL AND sq.message LIKE :prefix)
      )
");
$activeCheck->execute([':wid' => $wid, ':tid' => $tid, ':prefix' => $prefix]);
echo "Matches for Worker $wid and Template $tid:\n";
print_r($activeCheck->fetchAll(PDO::FETCH_ASSOC));

$activeCheck2 = $db->prepare("
    SELECT sq.* FROM sms_queue sq
    WHERE sq.worker_id = :wid
      AND sq.status IN ('Queued', 'Sending', 'Retry', 'Sent')
      AND (sq.task_id IS NULL AND sq.message LIKE :prefix)
");
$activeCheck2->execute([':wid' => $wid, ':prefix' => 'AniAlerto%']);
echo "\nMatches for Task NULL and prefix AniAlerto%:\n";
print_r($activeCheck2->fetchAll(PDO::FETCH_ASSOC));
?>
