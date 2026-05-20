<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

// ── Auto-create alerts table (idempotent) ────────────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS alerts (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        type        VARCHAR(20)  NOT NULL,
        worker_id   INT          DEFAULT NULL,
        worker_name VARCHAR(150) DEFAULT NULL,
        phone       VARCHAR(30)  DEFAULT NULL,
        task_id     INT          DEFAULT NULL,
        message     TEXT         DEFAULT NULL,
        done_reply  VARCHAR(255) DEFAULT NULL,
        is_read     TINYINT      NOT NULL DEFAULT 0,
        created_at  DATETIME     NOT NULL DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
// Migrate existing tables
try { $db->exec("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS done_reply VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) { /* column may already exist */ }

try {
    // ── POST: mark alert as resolved ─────────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Bulk mark all as read
        if (!empty($input['mark_all'])) {
            $db->exec("UPDATE alerts SET is_read=1 WHERE is_read=0");
            echo json_encode(['success' => true, 'action' => 'mark_all']);
            exit;
        }

        // Single alert resolve
        if (!empty($input['id'])) {
            $db->prepare("UPDATE alerts SET is_read=1 WHERE id=:id")
               ->execute([':id' => $input['id']]);
            // Return updated count so the bell updates instantly
            $cnt = (int)$db->query("SELECT COUNT(*) FROM alerts WHERE is_read=0")->fetchColumn();
            echo json_encode(['success' => true, 'unread_count' => $cnt]);
            exit;
        }
    }

    // ── GET: return ONLY unread alerts ───────────────────────────────────────
    // max_age_hours: default 48 — stale test/old alerts stay hidden.
    //                pass 0 to see all-time unread.
    $limit      = isset($_GET['limit'])         ? max(1, min(200, (int)$_GET['limit'])) : 100;
    $maxAgeHrs  = isset($_GET['max_age_hours']) ? (int)$_GET['max_age_hours']           : 24;


    $ageSql = $maxAgeHrs > 0
        ? "AND created_at >= DATE_SUB(NOW(), INTERVAL :hrs HOUR)"
        : "";

    $stmt = $db->prepare(
        "SELECT id, type, worker_id, worker_name, phone, task_id, message, done_reply, is_read, created_at
           FROM alerts
          WHERE is_read = 0
            $ageSql
          ORDER BY created_at DESC
          LIMIT :lim"
    );
    if ($maxAgeHrs > 0) $stmt->bindValue(':hrs', $maxAgeHrs, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric fields
    foreach ($alerts as &$a) {
        $a['is_read']   = (int)$a['is_read'];
        $a['worker_id'] = $a['worker_id'] !== null ? (int)$a['worker_id'] : null;
        $a['task_id']   = $a['task_id']   !== null ? (int)$a['task_id']   : null;
        $a['done_reply'] = $a['done_reply'] ?? null;
    }
    unset($a);

    // Total unread across all time (for bell badge accuracy)
    $totalUnread = (int)$db->query("SELECT COUNT(*) FROM alerts WHERE is_read=0")->fetchColumn();

    echo json_encode([
        'alerts'       => $alerts,
        'unread_count' => $totalUnread,
    ]);


} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>