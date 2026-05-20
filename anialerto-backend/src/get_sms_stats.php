<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
error_reporting(0);

$conn = new mysqli('localhost', 'root', '', 'anialerto');
if ($conn->connect_error) { echo json_encode(['error' => $conn->connect_error]); exit; }

// ── Build the same WHERE/HAVING filter that get_sms_logs.php uses ─────────────
$where  = "direction = 'Outbound' AND sent_at IS NOT NULL";
$params = [];
$types  = '';

$dateFilter = $_GET['date_filter'] ?? 'all';
$dateFrom   = $_GET['date_from']   ?? '';
$dateTo     = $_GET['date_to']     ?? '';
$search     = trim($_GET['search'] ?? '');

switch ($dateFilter) {
    case 'today':
        $where .= " AND DATE(sent_at) = CURDATE()";
        break;
    case '7days':
        $where .= " AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
    case '30days':
        $where .= " AND sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
    case 'custom':
        if ($dateFrom) { $where .= " AND DATE(sent_at) >= ?"; $params[] = $dateFrom; $types .= 's'; }
        if ($dateTo)   { $where .= " AND DATE(sent_at) <= ?"; $params[] = $dateTo;   $types .= 's'; }
        break;
}

if ($search !== '') {
    $where   .= " AND (phone LIKE ? OR message LIKE ?)";
    $like     = "%{$search}%";
    $params[] = $like;
    $params[] = $like;
    $types   .= 'ss';
}

// ── Single aggregate query ────────────────────────────────────────────────────
$sql = "
    SELECT
        COUNT(*)                                                                AS total,
        SUM(CASE WHEN UPPER(TRIM(response_text)) = 'DONE'  THEN 1 ELSE 0 END) AS done_c,
        SUM(CASE WHEN UPPER(TRIM(response_text)) = 'DELAY' THEN 1 ELSE 0 END) AS delay_c,
        SUM(CASE WHEN UPPER(TRIM(response_text)) = 'HELP'  THEN 1 ELSE 0 END) AS help_c,
        SUM(CASE WHEN UPPER(TRIM(response_text)) = 'PEST'  THEN 1 ELSE 0 END) AS pest_c,
        SUM(CASE WHEN response_text IS NULL                THEN 1 ELSE 0 END) AS pending_c
    FROM sms_logs
    WHERE $where
";

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

echo json_encode([
    'total'   => (int)($row['total']     ?? 0),
    'done'    => (int)($row['done_c']    ?? 0),
    'delay'   => (int)($row['delay_c']  ?? 0),
    'help'    => (int)($row['help_c']   ?? 0),
    'pest'    => (int)($row['pest_c']   ?? 0),
    'pending' => (int)($row['pending_c'] ?? 0),
    'filter'  => $dateFilter,
    'ts'      => time(),
]);
$conn->close();
