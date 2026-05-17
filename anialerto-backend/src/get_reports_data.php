<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "root", "", "anialerto");
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// Safe query helper — returns [] instead of crashing on failure
function safeRows($conn, $sql) {
    $res = $conn->query($sql);
    if (!$res || $res === true) return [];
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    return $rows;
}

// ── 1. Daily volume (last 14 days) ───────────────────────────────────────────
$volRows = safeRows($conn, "
    SELECT DATE(created_at) AS date, COUNT(*) AS cnt
    FROM   sms_logs
    WHERE  direction = 'Outbound'
    GROUP  BY DATE(created_at)
    ORDER  BY date DESC
    LIMIT  14
");
$volume = [];
foreach ($volRows as $r) {
    $volume[] = ["date" => $r['date'], "count" => (int)$r['cnt']];
}

// ── 2. Per-worker engagement breakdown ───────────────────────────────────────
$wRows = safeRows($conn, "
    SELECT
        w.id, w.name, w.phone,
        COUNT(sl.id)                                                     AS total_sent,
        SUM(CASE WHEN sl.response_text = 'DONE'  THEN 1 ELSE 0 END)    AS done_count,
        SUM(CASE WHEN sl.response_text = 'DELAY' THEN 1 ELSE 0 END)    AS delay_count,
        SUM(CASE WHEN sl.response_text = 'HELP'  THEN 1 ELSE 0 END)    AS help_count,
        SUM(CASE WHEN sl.response_text = 'PEST'  THEN 1 ELSE 0 END)    AS pest_count,
        SUM(CASE WHEN sl.response_text IS NULL   THEN 1 ELSE 0 END)    AS pending_count
    FROM   workers w
    LEFT JOIN sms_logs sl
           ON w.id = sl.worker_id AND sl.direction = 'Outbound'
    WHERE  w.status = 'Active'
    GROUP  BY w.id, w.name, w.phone
    ORDER  BY total_sent DESC
");
$workers = [];
foreach ($wRows as $r) {
    $workers[] = [
        "name"          => $r['name'],
        "phone"         => $r['phone'],
        "total_sent"    => (int)$r['total_sent'],
        "done_count"    => (int)$r['done_count'],
        "delay_count"   => (int)$r['delay_count'],
        "help_count"    => (int)$r['help_count'],
        "pest_count"    => (int)$r['pest_count'],
        "pending_count" => (int)$r['pending_count'],
    ];
}

// ── 3. Summary — derived from worker data (avoids a fragile aggregate query) ─
$total       = array_sum(array_column($workers, 'total_sent'));
$completed   = array_sum(array_column($workers, 'done_count'));
$delayed     = array_sum(array_column($workers, 'delay_count'));
$helpReqs    = array_sum(array_column($workers, 'help_count'));
$pestRpts    = array_sum(array_column($workers, 'pest_count'));
$pending     = array_sum(array_column($workers, 'pending_count'));
$activeWkrs  = count(array_filter($workers, fn($w) => $w['total_sent'] > 0));

// Fallback: if worker table is empty, count from sms_logs directly
if ($total === 0 && count($volume) > 0) {
    $total = array_sum(array_column($volume, 'count'));
}

// ── 4. Response/status distribution ─────────────────────────────────────────
$distRows = safeRows($conn, "
    SELECT COALESCE(response_text, 'Pending') AS name, COUNT(*) AS value
    FROM   sms_logs
    WHERE  direction = 'Outbound'
    GROUP  BY response_text
    ORDER  BY value DESC
");
$distribution = [];
foreach ($distRows as $r) {
    $distribution[] = [
        "name"    => $r['name'],
        "value"   => (int)$r['value'],
        "percent" => $total > 0 ? round(((int)$r['value'] / $total) * 100, 1) : 0,
    ];
}

// ── 5. Pest alerts (graceful — table/columns may differ) ─────────────────────
$pestAlerts = [];
$tblCheck = $conn->query("SHOW TABLES LIKE 'pest_alerts'");
if ($tblCheck && $tblCheck->num_rows > 0) {
    $colRes = $conn->query("SHOW COLUMNS FROM pest_alerts");
    $cols = [];
    if ($colRes) {
        while ($c = $colRes->fetch_assoc()) $cols[] = $c['Field'];
    }

    $dateCol = in_array('reported_at', $cols) ? 'pa.reported_at'
             : (in_array('created_at',  $cols) ? 'pa.created_at' : 'NULL');
    $wIdCol  = in_array('worker_id', $cols) ? 'pa.worker_id' : 'NULL';
    $bIdCol  = in_array('batch_id',  $cols) ? 'pa.batch_id'  : 'NULL';
    $stCol   = in_array('status',    $cols) ? 'pa.status'    : "'-'";

    $joinW = $wIdCol !== 'NULL' ? "LEFT JOIN workers     w  ON w.id  = $wIdCol" : "";
    $joinB = $bIdCol !== 'NULL' ? "LEFT JOIN farm_batches fb ON fb.id = $bIdCol" : "";

    $pestSql = "
        SELECT
            $dateCol                                          AS reported_at,
            " . ($wIdCol !== 'NULL' ? "w.name"  : "'-'") . " AS worker_name,
            " . ($wIdCol !== 'NULL' ? "w.phone" : "'-'") . " AS phone,
            " . ($bIdCol !== 'NULL' ? "fb.name" : "'-'") . " AS batch_name,
            $stCol AS status
        FROM pest_alerts pa
        $joinW $joinB
        ORDER BY $dateCol DESC
        LIMIT 20
    ";
    $pestAlerts = safeRows($conn, $pestSql);
}

echo json_encode([
    "summary" => [
        "total"          => $total,
        "activeWorkers"  => $activeWkrs,
        "completed"      => $completed,
        "delayed"        => $delayed,
        "helpRequests"   => $helpReqs,
        "pestReports"    => $pestRpts,
        "pending"        => $pending,
        "completionRate" => $total > 0 ? round(($completed / $total) * 100) : 0,
    ],
    "dailyVolume"        => $volume,
    "statusDistribution" => $distribution,
    "workerEngagement"   => $workers,
    "pestAlerts"         => $pestAlerts,
    "generatedAt"        => date("Y-m-d H:i:s"),
]);

$conn->close();
?>