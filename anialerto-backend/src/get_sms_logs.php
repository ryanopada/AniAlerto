<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

try {
    // ── Query params ───────────────────────────────────────────────────────────
    $dateFilter = in_array($_GET['date_filter'] ?? '', ['today','7days','30days','custom'])
                  ? $_GET['date_filter']
                  : 'all';
    $dateFrom   = $_GET['date_from'] ?? null;  // YYYY-MM-DD
    $dateTo     = $_GET['date_to']   ?? null;  // YYYY-MM-DD
    $search     = trim($_GET['search'] ?? '');
    $page       = max(1, intval($_GET['page']     ?? 1));
    $perPage    = min(100, max(5, intval($_GET['per_page'] ?? 25)));
    $offset     = ($page - 1) * $perPage;

    // ── Build WHERE conditions ─────────────────────────────────────────────────
    $where  = "sl.direction = 'Outbound' AND sl.sent_at IS NOT NULL";
    $params = [];

    // Date filter (server-controlled values — safe to inline)
    switch ($dateFilter) {
        case 'today':
            $where .= " AND DATE(sl.created_at) = CURRENT_DATE";
            break;
        case '7days':
            $where .= " AND sl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case '30days':
            $where .= " AND sl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
        case 'custom':
            if ($dateFrom) { $where .= " AND DATE(sl.created_at) >= ?"; $params[] = $dateFrom; }
            if ($dateTo)   { $where .= " AND DATE(sl.created_at) <= ?"; $params[] = $dateTo;   }
            break;
    }

    // Search filter (phone or message)
    if ($search !== '') {
        $like = '%' . $search . '%';
        $where .= " AND (sl.phone LIKE ? OR sl.message LIKE ?)";
        $params[] = $like;
        $params[] = $like;
    }

    // ── Total count (for pagination) ───────────────────────────────────────────
    $countStmt = $db->prepare("SELECT COUNT(*) AS total FROM sms_logs sl WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // ── Main query ─────────────────────────────────────────────────────────────
    // Note: LIMIT/OFFSET are inlined as validated integers — MariaDB rejects them
    // as bound string parameters (''25' OFFSET '0'' syntax error).
    $stmt = $db->prepare("
        SELECT
            sl.id,
            sl.worker_id,
            COALESCE(
                (SELECT w.name FROM workers w WHERE w.id = sl.worker_id LIMIT 1),
                (SELECT w.name FROM workers w
                 WHERE RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(w.phone,'+',''),' ',''),'-',''),'(',''),')',''),10)
                     = RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sl.phone,'+',''),' ',''),'-',''),'(',''),')',''),10)
                 LIMIT 1)
            ) AS worker_name,
            sl.phone,
            sl.message,
            sl.direction,
            sl.status,
            sl.response_text,
            sl.sent_at,
            sl.received_at,
            sl.created_at
        FROM sms_logs sl
        WHERE $where
        ORDER BY sl.created_at DESC
        LIMIT $perPage OFFSET $offset
    ");
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ── Global summary stats (same filters, no pagination) ────────────────────
    // These power the cards — must reflect the WHOLE dataset, not just one page.
    $sumStmt = $db->prepare("
        SELECT
            COUNT(*)                                                                   AS total,
            SUM(CASE WHEN UPPER(TRIM(sl.response_text)) = 'DONE'  THEN 1 ELSE 0 END) AS done_count,
            SUM(CASE WHEN UPPER(TRIM(sl.response_text)) = 'DELAY' THEN 1 ELSE 0 END) AS delay_count,
            SUM(CASE WHEN UPPER(TRIM(sl.response_text)) = 'HELP'  THEN 1 ELSE 0 END) AS help_count,
            SUM(CASE WHEN UPPER(TRIM(sl.response_text)) = 'PEST'  THEN 1 ELSE 0 END) AS pest_count,
            SUM(CASE WHEN sl.response_text IS NULL                THEN 1 ELSE 0 END) AS pending_count
        FROM sms_logs sl WHERE $where
    ");
    $sumStmt->execute($params);
    $sum = $sumStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'data'        => $logs,
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
        'summary'     => [
            'total'   => (int)($sum['total']         ?? 0),
            'done'    => (int)($sum['done_count']    ?? 0),
            'delay'   => (int)($sum['delay_count']   ?? 0),
            'help'    => (int)($sum['help_count']    ?? 0),
            'pest'    => (int)($sum['pest_count']    ?? 0),
            'pending' => (int)($sum['pending_count'] ?? 0),
        ],
    ]);


} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>
