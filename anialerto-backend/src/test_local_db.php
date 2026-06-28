<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=u268935662_AniAlerto;charset=utf8', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $where = "direction = 'Outbound' AND sent_at IS NOT NULL AND created_at >= ? AND created_at <= ?";
    $params = ['2026-06-12 00:00:00', '2026-06-28 23:59:59'];
    $stmt = $db->prepare("SELECT COUNT(*) FROM sms_logs WHERE $where");
    $stmt->execute($params);
    print_r($stmt->fetchAll());
} catch (Exception $e) { echo $e->getMessage(); }
?>
