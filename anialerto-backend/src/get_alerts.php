<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // Mark alert as read (POST with id)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!empty($input['id'])) {
            $db->prepare("UPDATE alerts SET is_read=1 WHERE id=:id")
               ->execute([':id' => $input['id']]);
            echo json_encode(['success' => true]);
            exit;
        }
    }

    // GET: return recent alerts
    $limit  = isset($_GET['limit'])  ? (int)$_GET['limit']  : 50;
    $unread = isset($_GET['unread']) && $_GET['unread'] === '1';

    $sql = "SELECT id, type, worker_id, worker_name, phone, task_id, message, is_read, created_at
            FROM alerts" . ($unread ? " WHERE is_read=0" : "") .
           " ORDER BY created_at DESC LIMIT :lim";

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Unread count
    $ucStmt = $db->query("SELECT COUNT(*) AS cnt FROM alerts WHERE is_read=0");
    $unreadCount = $ucStmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0;

    echo json_encode([
        'alerts'       => $alerts,
        'unread_count' => (int)$unreadCount,
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>