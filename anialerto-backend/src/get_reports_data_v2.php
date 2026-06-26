<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "u268935662_anialerto123", "AniAlerto123", "u268935662_AniAlerto");
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

// 1. Farm Operations Overview
$taskCompletionRows = safeRows($conn, "
    SELECT st.status, COUNT(*) as cnt
    FROM scheduled_tasks st
    JOIN message_templates mt ON st.template_id = mt.id
    WHERE $task_where
    GROUP BY st.status
");
$farmOverview = ["assigned" => 0, "completed" => 0, "pending" => 0, "delayed" => 0, "cancelled" => 0, "rate" => 0];
foreach($taskCompletionRows as $r) {
    $status = ucfirst(strtolower($r['status']));
    $farmOverview["assigned"] += (int)$r['cnt'];
    if ($status === 'Completed') $farmOverview["completed"] += (int)$r['cnt'];
    if ($status === 'Pending') $farmOverview["pending"] += (int)$r['cnt'];
    if ($status === 'Delayed') $farmOverview["delayed"] += (int)$r['cnt'];
    if ($status === 'Cancelled') $farmOverview["cancelled"] += (int)$r['cnt'];
}
if ($farmOverview["assigned"] > 0) {
    $farmOverview["rate"] = round(($farmOverview["completed"] / $farmOverview["assigned"]) * 100);
}

// 2. Worker Performance Report
$workerMonitoringRows = safeRows($conn, "
    SELECT w.id, w.name, w.phone,
           COUNT(sl.id) as assigned,
           SUM(CASE WHEN sl.response_text = 'DONE' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN sl.response_text LIKE 'DELAY%' THEN 1 ELSE 0 END) as delayed,
           SUM(CASE WHEN sl.response_text LIKE 'HELP%' OR sl.response_text IN ('PEST', 'UOD') THEN 1 ELSE 0 END) as help_requests
    FROM workers w
    LEFT JOIN sms_logs sl ON w.id = sl.worker_id AND sl.direction = 'Outbound'
    WHERE w.status = 'Active' AND $log_where
    GROUP BY w.id, w.name, w.phone
");
$workersList = [];
foreach($workerMonitoringRows as $w) {
    $c = (int)$w['completed'];
    $a = (int)$w['assigned'];
    $rate = $a > 0 ? round(($c / $a) * 100) : 0;
    $workersList[] = [
        "id" => $w['id'], "name" => $w['name'], "phone" => $w['phone'],
        "assigned" => $a, "completed" => $c, "delayed" => (int)$w['delayed'], "help" => (int)$w['help_requests'],
        "rate" => $rate
    ];
}
usort($workersList, function($a, $b) { return $b['rate'] <=> $a['rate']; });
$topPerformers = array_slice($workersList, 0, 3);
usort($workersList, function($a, $b) { return $a['rate'] <=> $b['rate']; });
$attentionRequired = array_filter(array_slice($workersList, 0, 3), function($x) { return $x['assigned'] > 0; });
usort($workersList, function($a, $b) { return $b['delayed'] <=> $a['delayed']; });
$mostDelays = array_filter(array_slice($workersList, 0, 3), function($x) { return $x['delayed'] > 0; });
usort($workersList, function($a, $b) { return $b['help'] <=> $a['help']; });
$mostHelp = array_filter(array_slice($workersList, 0, 3), function($x) { return $x['help'] > 0; });
usort($workersList, function($a, $b) { return strcmp($a['name'], $b['name']); });

$workerPerformance = [
    "all" => $workersList,
    "top" => $topPerformers,
    "attention" => array_values($attentionRequired),
    "delays" => array_values($mostDelays),
    "helps" => array_values($mostHelp)
];

// 3. Farm Batch Progress Report
$batchProgressRows = safeRows($conn, "
    SELECT fb.id, fb.name, fb.planting_date, fb.status, fb.harvest_date,
           (SELECT COUNT(*) FROM message_templates WHERE batch_id = fb.id) as tasksTotal,
           (SELECT COUNT(*) FROM scheduled_tasks WHERE batch_id = fb.id AND status = 'Completed') as tasksCompleted
    FROM farm_batches fb
    WHERE fb.status != 'Harvested' OR (fb.status = 'Harvested' AND fb.harvest_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
");
$batchesList = [];
$completedBatches = [];
$behindBatches = [];
$stalledBatches = [];

foreach($batchProgressRows as $r) {
    $cropDay = null;
    if ($r['planting_date'] && $r['status'] != 'Harvested') {
        $diff = strtotime(date('Y-m-d')) - strtotime($r['planting_date']);
        $cropDay = max(0, floor($diff / (60 * 60 * 24)));
    }
    $total = (int)$r['tasksTotal'];
    $comp = (int)$r['tasksCompleted'];
    $prog = $total > 0 ? round(($comp / $total) * 100) : 0;
    
    $batch = [
        "id" => $r['id'], "name" => $r['name'], "status" => $r['status'],
        "cropDay" => $cropDay, "total" => $total, "completed" => $comp, "remaining" => $total - $comp,
        "progress" => $prog
    ];
    $batchesList[] = $batch;
    
    if ($prog === 100 || $r['status'] === 'Harvested') {
        $completedBatches[] = $batch;
    } else if ($r['status'] === 'Delayed') {
        $behindBatches[] = $batch;
    } else if ($prog < 10 && $cropDay > 10) {
        $stalledBatches[] = $batch;
    }
}
$batchProgress = [
    "all" => $batchesList,
    "completed" => $completedBatches,
    "behind" => $behindBatches,
    "stalled" => $stalledBatches
];

// 4. Operational Issues Report
$alertsQuery = "
    SELECT sl.response_text
    FROM sms_logs sl
    WHERE (sl.response_text IN ('HELP', 'PEST', 'UOD') 
       OR sl.response_text LIKE 'HELP:%' 
       OR sl.response_text LIKE 'HELP_CUSTOM:%' 
       OR sl.response_text LIKE 'DELAY:%') 
      AND sl.direction = 'Outbound' 
      AND $log_where
";
$allAlerts = safeRows($conn, $alertsQuery);

$opIssues = [
    "totalDelays" => 0, "totalHelp" => 0, "totalPest" => 0, "totalEmergency" => 0,
    "delayReasons" => [], "helpCategories" => [], "pestConcerns" => []
];

foreach($allAlerts as $a) {
    $txt = $a['response_text'];
    if ($txt === 'PEST' || $txt === 'UOD') {
        $opIssues["totalPest"]++;
        $opIssues["pestConcerns"]['Pest/Insect issue'] = ($opIssues["pestConcerns"]['Pest/Insect issue'] ?? 0) + 1;
    } else if (strpos($txt, 'HELP') === 0) {
        if (strpos($txt, 'HELP_CUSTOM') === 0) $opIssues["totalEmergency"]++;
        else $opIssues["totalHelp"]++;
        
        $reason = strpos($txt, ':') !== false ? trim(substr($txt, strpos($txt, ':')+1)) : 'General Help';
        $opIssues["helpCategories"][$reason] = ($opIssues["helpCategories"][$reason] ?? 0) + 1;
    } else if (strpos($txt, 'DELAY') === 0) {
        $opIssues["totalDelays"]++;
        $reason = strpos($txt, ':') !== false ? trim(substr($txt, strpos($txt, ':')+1)) : 'General Delay';
        $opIssues["delayReasons"][$reason] = ($opIssues["delayReasons"][$reason] ?? 0) + 1;
    }
}

arsort($opIssues["delayReasons"]);
arsort($opIssues["helpCategories"]);
arsort($opIssues["pestConcerns"]);
// Flatten to array of objects for easier React rendering
$flatReasons = []; foreach(array_slice($opIssues["delayReasons"], 0, 5, true) as $k=>$v) $flatReasons[] = ["name"=>$k, "count"=>$v];
$flatHelp = []; foreach(array_slice($opIssues["helpCategories"], 0, 5, true) as $k=>$v) $flatHelp[] = ["name"=>$k, "count"=>$v];
$flatPest = []; foreach(array_slice($opIssues["pestConcerns"], 0, 5, true) as $k=>$v) $flatPest[] = ["name"=>$k, "count"=>$v];

$opIssues["delayReasons"] = $flatReasons;
$opIssues["helpCategories"] = $flatHelp;
$opIssues["pestConcerns"] = $flatPest;

$upcoming_conds = ["1=1"];
if ($batch_id > 0) $upcoming_conds[] = "mt.batch_id = $batch_id";
if ($category)     $upcoming_conds[] = "mt.category = '$category'";
if ($start_date)   $upcoming_conds[] = "DATE(mt.scheduled_send_datetime) >= '$start_date'";
if ($end_date)     $upcoming_conds[] = "DATE(mt.scheduled_send_datetime) <= '$end_date'";
$upcoming_where = implode(" AND ", $upcoming_conds);

// 5. Upcoming Activities Report
$upcomingActivities = safeRows($conn, "
    SELECT mt.id, mt.name as taskName, fb.name as batchName, DATE(mt.scheduled_send_datetime) as due_date, mt.category,
           (SELECT COUNT(*) FROM message_recipients WHERE template_id = mt.id) as assigned_workers
    FROM message_templates mt
    LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
    WHERE mt.active = 1 AND mt.status IN ('Pending', 'Scheduled') AND mt.scheduled_send_datetime >= CURDATE() AND $upcoming_where
    ORDER BY mt.scheduled_send_datetime ASC
");
$upcoming = [
    "today" => [], "thisWeek" => [], "overdue" => [], "all" => []
];
$todayStr = date('Y-m-d');
$weekStr = date('Y-m-d', strtotime('+7 days'));

foreach($upcomingActivities as $a) {
    $upcoming["all"][] = $a;
    if ($a['due_date'] < $todayStr) {
        $upcoming["overdue"][] = $a;
    } else if ($a['due_date'] === $todayStr) {
        $upcoming["today"][] = $a;
    } else if ($a['due_date'] <= $weekStr) {
        $upcoming["thisWeek"][] = $a;
    }
}

// 6. Advisory Effectiveness Report
$advisoryEffectiveness = [
    "totalSent" => 0, "acknowledgedRate" => 0, "tasksCompleted" => 0, "tasksDelayed" => 0,
    "mostEffective" => [], "leastEffective" => []
];

$advisoryRows = safeRows($conn, "
    SELECT
        COUNT(*) as total_sent,
        SUM(CASE WHEN response_text = 'DONE' OR response_text LIKE 'DELAY%' OR response_text LIKE 'HELP%' OR response_text IN ('PEST', 'UOD') THEN 1 ELSE 0 END) as acknowledged,
        SUM(CASE WHEN response_text = 'DONE' THEN 1 ELSE 0 END) as tasksCompleted,
        SUM(CASE WHEN response_text LIKE 'DELAY%' THEN 1 ELSE 0 END) as tasksDelayed
    FROM sms_logs sl
    WHERE direction = 'Outbound' AND $log_where
");
if ($advisoryRows && count($advisoryRows) > 0) {
    $ar = $advisoryRows[0];
    $advisoryEffectiveness["totalSent"] = (int)$ar['total_sent'];
    $advisoryEffectiveness["tasksCompleted"] = (int)$ar['tasksCompleted'];
    $advisoryEffectiveness["tasksDelayed"] = (int)$ar['tasksDelayed'];
    $advisoryEffectiveness["acknowledgedRate"] = $ar['total_sent'] > 0 ? round(((int)$ar['acknowledged'] / (int)$ar['total_sent']) * 100) : 0;
}

$catQuery = safeRows($conn, "
    SELECT mt.category,
           COUNT(sl.id) as sent,
           SUM(CASE WHEN sl.response_text = 'DONE' THEN 1 ELSE 0 END) as done
    FROM sms_logs sl
    LEFT JOIN scheduled_tasks st ON sl.task_id = st.id
    LEFT JOIN message_templates mt ON st.template_id = mt.id
    WHERE sl.direction = 'Outbound' AND mt.category IS NOT NULL AND mt.category != '' AND $log_where
    GROUP BY mt.category
");
$catEffectiveness = [];
foreach($catQuery as $c) {
    $catEffectiveness[$c['category']] = $c['sent'] > 0 ? round(($c['done'] / $c['sent']) * 100) : 0;
}
arsort($catEffectiveness);
$advisoryEffectiveness["mostEffective"] = array_slice(array_keys($catEffectiveness), 0, 2);
asort($catEffectiveness);
$advisoryEffectiveness["leastEffective"] = array_slice(array_keys($catEffectiveness), 0, 2);

// 7. Management Summary
$managementSummary = [
    "activeBatches" => count($batchesList),
    "farmCompletionRate" => $farmOverview["rate"],
    "delayedActivities" => $opIssues["totalDelays"],
    "pestAlerts" => $opIssues["totalPest"],
    "attentionWorkers" => count($attentionRequired),
    "attentionBatches" => count($behindBatches) + count($stalledBatches),
    "recommendedActions" => []
];

if ($managementSummary["attentionWorkers"] > 0) {
    $wNames = implode(', ', array_map(function($w){ return $w['name']; }, array_slice($attentionRequired, 0, 2)));
    $managementSummary["recommendedActions"][] = "Review performance and provide assistance to: $wNames.";
}
if (count($behindBatches) > 0) {
    $bNames = implode(', ', array_map(function($b){ return $b['name']; }, array_slice($behindBatches, 0, 2)));
    $managementSummary["recommendedActions"][] = "Intervene in batches currently behind schedule: $bNames.";
}
if ($opIssues["totalDelays"] > 10 && count($opIssues["delayReasons"]) > 0) {
    $managementSummary["recommendedActions"][] = "High volume of delays detected. Review the most common delay reason: '" . $opIssues["delayReasons"][0]['name'] . "'.";
}
if ($opIssues["totalPest"] > 0) {
    $managementSummary["recommendedActions"][] = "Immediate pest control intervention required based on recent alerts.";
}
if (count($managementSummary["recommendedActions"]) === 0) {
    $managementSummary["recommendedActions"][] = "Farm is operating smoothly. Maintain current schedules.";
}


// Fetch Filter Options
$filterOptions = [
    "batches" => safeRows($conn, "SELECT id, name FROM farm_batches ORDER BY name"),
    "workers" => safeRows($conn, "SELECT id, name FROM workers WHERE status='Active' ORDER BY name"),
    "categories" => safeRows($conn, "SELECT DISTINCT category FROM message_templates WHERE category IS NOT NULL ORDER BY category")
];

echo json_encode([
    "farmOverview" => $farmOverview,
    "workerPerformance" => $workerPerformance,
    "batchProgress" => $batchProgress,
    "opIssues" => $opIssues,
    "upcoming" => $upcoming,
    "advisoryEffectiveness" => $advisoryEffectiveness,
    "managementSummary" => $managementSummary,
    "filterOptions" => $filterOptions
]);

$conn->close();
?>