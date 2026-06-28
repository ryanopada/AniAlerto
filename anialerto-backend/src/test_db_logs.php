<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=u268935662_AniAlerto;charset=utf8', 'root', '');
    $stmt = $db->query("SELECT id, direction, message, status, sent_at, created_at FROM sms_logs ORDER BY created_at DESC LIMIT 5");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) { echo $e->getMessage(); }
