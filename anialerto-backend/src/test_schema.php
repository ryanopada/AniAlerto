try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=u268935662_AniAlerto;charset=utf8', 'root', '');
    $stmt = $db->query("SHOW CREATE TABLE sms_logs");
    print_r($stmt->fetchAll());
} catch (Exception $e) { echo $e->getMessage(); }
