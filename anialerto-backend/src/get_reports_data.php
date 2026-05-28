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

// Helpers
function safeRows($conn, $sql) {
    $res = $conn->query($sql);
    if (!$res || $res === true) return [];
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    return $rows;
}

// Filters
$batch_id   = isset($_GET['batch_id']) ? intval($_GET['batch_id']) : 0;
$worker_id  = isset($_GET['worker_id']) ? intval($_GET['worker_id']) : 0;
$category   = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
$start_date = isset($_GET['start_date']) ? $conn->real_escape_string($_GET['start_date']) : '';
$end_date   = isset($_GET['end_date']) ? $conn->real_escape_string($_GET['end_date']) : '';

// Base conditions for tasks
$task_conds = ["1=1"];
if ($batch_id > 0) $task_conds[] = "st.batch_id = $batch_id";
if ($category)     $task_conds[] = "mt.category = '$category'";
if ($start_date)   $task_conds[] = "st.due_date >= '$start_date'";
if ($end_date)     $task_conds[] = "st.due_date <= '$end_date'";
$task_where = implode(" AND ", $task_conds);

// Base conditions for logs
$log_conds = ["1=1"];
if ($worker_id > 0) $log_conds[] = "sl.worker_id = $worker_id";
if ($start_date)    $log_conds[] = "DATE(sl.created_at) >= '$start_date'";
if ($end_date)      $log_conds[] = "DATE(sl.created_at) <= '$end_date'";
$log_where = implode(" AND ", $log_conds);


// 1. Task Completion Report
$taskCompletionRows = safeRows($conn, "
    SELECT st.status, COUNT(*) as cnt
    FROM scheduled_tasks st
    JOIN message_templates mt ON st.template_id = mt.id
    WHERE $task_where
    GROUP BY st.status
");
$taskCompletion = ["Completed" => 0, "Pending" => 0, "Delayed" => 0, "Cancelled" => 0];
foreach($taskCompletionRows as $r) {
    $status = ucfirst(strtolower($r['status']));
    if (isset($taskCompletion[$status])) $taskCompletion[$status] = (int)$r['cnt'];
}


// 2. Worker Response Monitoring Report
$workerMonitoringRows = safeRows($conn, "
    SELECT w.id, w.name, w.phone,
           COUNT(sl.id) as total_sent,
           SUM(CASE WHEN sl.response_text = 'DONE' THEN 1 ELSE 0 END) as done_count,
           SUM(CASE WHEN sl.response_text = 'DELAY' THEN 1 ELSE 0 END) as delay_count,
           SUM(CASE WHEN sl.response_text IN ('HELP', 'PEST', 'UOD') THEN 1 ELSE 0 END) as help_count,
           AVG(CASE WHEN sl.received_at IS NOT NULL AND sl.sent_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, sl.sent_at, sl.received_at)
                    ELSE NULL END) as avg_response_time
    FROM workers w
    LEFT JOIN sms_logs sl ON w.id = sl.worker_id AND sl.direction = 'Outbound'
    WHERE w.status = 'Active' AND $log_where
    GROUP BY w.id, w.name, w.phone
    ORDER BY total_sent DESC
");
$workerMonitoring = [];
foreach($workerMonitoringRows as $r) {
    $workerMonitoring[] = [
        "id" => $r['id'],
        "name" => $r['name'],
        "phone" => $r['phone'],
        "total_sent" => (int)$r['total_sent'],
        "done_count" => (int)$r['done_count'],
        "delay_count" => (int)$r['delay_count'],
        "help_count" => (int)$r['help_count'],
        "avg_response_time" => $r['avg_response_time'] ? round($r['avg_response_time']) : null
    ];
}

// 3. Upcoming Farm Activities
$upcomingActivities = safeRows($conn, "
    SELECT st.id, mt.name as taskName, fb.name as batchName, st.due_date, mt.category
    FROM scheduled_tasks st
    JOIN message_templates mt ON st.template_id = mt.id
    JOIN farm_batches fb ON st.batch_id = fb.id
    WHERE st.status = 'Pending' AND st.due_date >= CURDATE() AND $task_where
    ORDER BY st.due_date ASC
    LIMIT 50
");

// 4. Pest and Emergency Alerts
$pestAlerts = safeRows($conn, "
    SELECT sl.id, w.name as workerName, sl.phone, sl.response_text as alertType, sl.received_at, sl.created_at
    FROM sms_logs sl
    LEFT JOIN workers w ON sl.worker_id = w.id
    WHERE sl.response_text IN ('HELP', 'PEST', 'UOD') AND $log_where
    ORDER BY COALESCE(sl.received_at, sl.created_at) DESC
    LIMIT 50
");

// 5. Farm Batch Progress
$batchProgressRows = safeRows($conn, "
    SELECT fb.id, fb.name, fb.planting_date, fb.status,
           COUNT(st.id) as tasksTotal,
           SUM(CASE WHEN st.status = 'Completed' THEN 1 ELSE 0 END) as tasksCompleted
    FROM farm_batches fb
    LEFT JOIN scheduled_tasks st ON fb.id = st.batch_id
    WHERE fb.status IN ('Active', 'Planning')
    GROUP BY fb.id, fb.name, fb.planting_date, fb.status
");
$batchProgress = [];
foreach($batchProgressRows as $r) {
    $cropDay = null;
    if ($r['planting_date'] && $r['status'] == 'Active') {
        $diff = strtotime(date('Y-m-d')) - strtotime($r['planting_date']);
        $cropDay = max(0, floor($diff / (60 * 60 * 24)));
    }
    $batchProgress[] = [
        "id" => $r['id'],
        "name" => $r['name'],
        "cropDay" => $cropDay,
        "status" => $r['status'],
        "tasksCompleted" => (int)$r['tasksCompleted'],
        "tasksTotal" => (int)$r['tasksTotal'],
        "progress" => $r['tasksTotal'] > 0 ? round(((int)$r['tasksCompleted'] / (int)$r['tasksTotal']) * 100) : 0
    ];
}

// 6. Worker Assignment Report
$workerAssignmentsRows = safeRows($conn, "
    SELECT w.id, w.name, bw.role, fb.name as batchName
    FROM workers w
    LEFT JOIN batch_workers bw ON w.id = bw.worker_id
    LEFT JOIN farm_batches fb ON bw.batch_id = fb.id
    WHERE w.status = 'Active'
    ORDER BY w.name ASC
");
$wMap = [];
foreach($workerAssignmentsRows as $r) {
    if (!isset($wMap[$r['id']])) {
        $wMap[$r['id']] = [
            "id" => $r['id'],
            "name" => $r['name'],
            "roles" => [],
            "batches" => []
        ];
    }
    if ($r['role'] && !in_array($r['role'], $wMap[$r['id']]['roles'])) {
        $wMap[$r['id']]['roles'][] = $r['role'];
    }
    if ($r['batchName'] && !in_array($r['batchName'], $wMap[$r['id']]['batches'])) {
        $wMap[$r['id']]['batches'][] = $r['batchName'];
    }
}
$workerAssignments = array_values($wMap);

// 7. Advisory Effectiveness
$advisoryRows = safeRows($conn, "
    SELECT
        COUNT(*) as total_sent,
        SUM(CASE WHEN response_text IN ('DONE', 'DELAY', 'HELP', 'PEST', 'UOD') THEN 1 ELSE 0 END) as acknowledged,
        SUM(CASE WHEN response_text = 'DELAY' THEN 1 ELSE 0 END) as total_delayed
    FROM sms_logs sl
    WHERE direction = 'Outbound' AND $log_where
");
$advisory = $advisoryRows[0] ?? ["total_sent"=>0, "acknowledged"=>0, "total_delayed"=>0];
$advisoryEffectiveness = [
    "totalSent" => (int)$advisory['total_sent'],
    "acknowledged" => (int)$advisory['acknowledged'],
    "delayed" => (int)$advisory['total_delayed']
];

// Fetch Filter Options
$filterOptions = [
    "batches" => safeRows($conn, "SELECT id, name FROM farm_batches ORDER BY name"),
    "workers" => safeRows($conn, "SELECT id, name FROM workers WHERE status='Active' ORDER BY name"),
    "categories" => safeRows($conn, "SELECT DISTINCT category FROM message_templates WHERE category IS NOT NULL ORDER BY category")
];

echo json_encode([
    "taskCompletion" => $taskCompletion,
    "workerMonitoring" => $workerMonitoring,
    "upcomingActivities" => $upcomingActivities,
    "pestAlerts" => $pestAlerts,
    "batchProgress" => $batchProgress,
    "workerAssignments" => $workerAssignments,
    "advisoryEffectiveness" => $advisoryEffectiveness,
    "filterOptions" => $filterOptions
]);

$conn->close();
?>