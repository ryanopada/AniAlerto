<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

$isLocal = false;
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) { $isLocal = true; }
if (isset($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], 'localhost') !== false) { $isLocal = true; }

if ($isLocal) {
    $conn = new mysqli("localhost", "root", "", "anialerto");
} else {
    $conn = new mysqli("localhost", "u268935662_anialerto123", "AniAlerto123", "u268935662_AniAlerto");
}

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

function safeRows($conn, $sql) {
    $res = $conn->query($sql);
    if (!$res || $res === true) return [];
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    return $rows;
}

function getCropStage($plantingDate, $compareDate = null) {
    if (!$plantingDate) return "Unknown";
    $p = strtotime($plantingDate);
    $c = $compareDate ? strtotime($compareDate) : time();
    $diff = ($c - $p) / (60 * 60 * 24);
    if ($diff < 0) return "Land Preparation";
    if ($diff <= 15) return "Planting";
    if ($diff <= 60) return "Irrigating";
    if ($diff <= 90) return "Fertilizing";
    return "Harvesting";
}

$batch_id   = isset($_GET['batch_id']) ? intval($_GET['batch_id']) : 0;
$worker_id  = isset($_GET['worker_id']) ? intval($_GET['worker_id']) : 0;
$start_date = isset($_GET['start_date']) ? $conn->real_escape_string($_GET['start_date']) : '';
$end_date   = isset($_GET['end_date']) ? $conn->real_escape_string($_GET['end_date']) : '';

$task_conds = ["1=1"];
if ($batch_id > 0) $task_conds[] = "st.batch_id = $batch_id";
if ($start_date)   $task_conds[] = "DATE(st.due_date) >= '$start_date'";
if ($end_date)     $task_conds[] = "DATE(st.due_date) <= '$end_date'";
$task_where = implode(" AND ", $task_conds);

$log_conds = ["1=1"];
if ($worker_id > 0) $log_conds[] = "sl.worker_id = $worker_id";
if ($start_date)    $log_conds[] = "DATE(sl.created_at) >= '$start_date'";
if ($end_date)      $log_conds[] = "DATE(sl.created_at) <= '$end_date'";
$log_where = implode(" AND ", $log_conds);

$export_log_conds = $log_conds;
if ($batch_id > 0) $export_log_conds[] = "st.batch_id = $batch_id";
$export_log_where = implode(" AND ", $export_log_conds);

$report_type = isset($_GET['report_type']) ? $_GET['report_type'] : 'all';

// ==========================================
// CORE REPORT 1: ACTIVITY / OPERATIONAL
// ==========================================
$activityReport = null;
if ($report_type === 'all' || $report_type === 'activity') {
    $activityReport = [
        "context" => null,
        "taskExecution" => [ "assigned" => 0, "done" => 0, "delayedDone" => 0, "delay" => 0, "overdue" => 0 ],
        "smsAdvisoryLogs" => [ "sent" => 0, "failed" => 0, "pending" => 0 ],
        "workerResponses" => [ "done" => 0, "helpCount" => 0, "pest" => 0, "delay" => 0, "helpTypes" => [] ],
        "systemAlerts" => [ "missedTasks" => [], "failedSMS" => [], "unresponsive" => [] ],
        "timeline" => []
    ];
    
    // A. Farm & Crop Context
    if ($batch_id > 0) {
        $bc = safeRows($conn, "SELECT name, variety, planting_date FROM farm_batches WHERE id = $batch_id");
        if (count($bc) > 0) {
            $stage = getCropStage($bc[0]['planting_date']);
            $activityReport["context"] = ["name" => $bc[0]['name'], "variety" => $bc[0]['variety'], "plantingDate" => $bc[0]['planting_date'], "stage" => $stage];
        }
    }
    
    // B & C. Task Execution Monitoring & Task Status Breakdown
    $tasks = safeRows($conn, "SELECT st.id, st.status, st.due_date, st.completed_at, mt.name as task_name FROM scheduled_tasks st JOIN message_templates mt ON st.template_id = mt.id WHERE $task_where");
    foreach($tasks as $t) {
        $activityReport["taskExecution"]["assigned"]++;
        
        $tStatus = $t['status'];
        if ($t['status'] === 'Completed') {
            if ($t['completed_at'] && $t['due_date'] && date('Y-m-d', strtotime($t['completed_at'])) > date('Y-m-d', strtotime($t['due_date']))) {
                $activityReport["taskExecution"]["delayedDone"]++;
                $tStatus = "Late Finish";
            } else {
                $activityReport["taskExecution"]["done"]++;
                $tStatus = "On-Time";
            }
        } else if ($t['status'] === 'Delayed') {
            $activityReport["taskExecution"]["delay"]++;
            $tStatus = "Active Delay";
        } else if ($t['status'] === 'Pending' && $t['due_date'] < date('Y-m-d')) {
            $activityReport["taskExecution"]["overdue"]++;
            $activityReport["systemAlerts"]["missedTasks"][] = ["task" => $t['task_name'], "due" => $t['due_date']];
            $tStatus = "No Response";
        }
        $activityReport["assignedTasks"][] = [
            "task_name" => $t['task_name'],
            "due_date" => $t['due_date'],
            "status" => $tStatus
        ];
    }
    
    // D. SMS Advisory Logs
    $smsQueue = safeRows($conn, "SELECT status, COUNT(*) as cnt FROM sms_queue sq WHERE 1=1 GROUP BY status");
    foreach($smsQueue as $q) {
        $stat = strtolower($q['status']);
        if ($stat === 'sent') $activityReport["smsAdvisoryLogs"]["sent"] += (int)$q['cnt'];
        else if ($stat === 'failed') {
            $activityReport["smsAdvisoryLogs"]["failed"] += (int)$q['cnt'];
            $failedLogs = safeRows($conn, "SELECT phone_number, error_message FROM sms_queue WHERE status='Failed' LIMIT 5");
            foreach($failedLogs as $fl) $activityReport["systemAlerts"]["failedSMS"][] = $fl;
        }
        else $activityReport["smsAdvisoryLogs"]["pending"] += (int)$q['cnt'];
    }
    
    // E. Worker SMS Responses
    $workerResp = safeRows($conn, "SELECT response_text FROM sms_logs sl WHERE direction = 'Outbound' AND $log_where");
    foreach($workerResp as $r) {
        $txt = strtoupper($r['response_text'] ?? '');
        if ($txt === 'DONE') $activityReport["workerResponses"]["done"]++;
        else if (strpos($txt, 'HELP') === 0) {
            $activityReport["workerResponses"]["helpCount"]++;
            $type = trim(substr($txt, 5)) ?: "General";
            $activityReport["workerResponses"]["helpTypes"][$type] = ($activityReport["workerResponses"]["helpTypes"][$type] ?? 0) + 1;
        }
        else if (strpos($txt, 'PEST') === 0 || $txt === 'UOD') {
            $activityReport["workerResponses"]["pest"]++;
            $type = strpos($txt, 'PEST:') === 0 ? trim(substr($txt, 5)) : ($txt === 'UOD' ? 'Uod' : 'General');
            $activityReport["workerResponses"]["pestTypes"][$type] = ($activityReport["workerResponses"]["pestTypes"][$type] ?? 0) + 1;
        }
        else if (strpos($txt, 'DELAY') === 0) {
            $activityReport["workerResponses"]["delay"]++;
            $type = strpos($txt, 'DELAY:') === 0 ? trim(substr($txt, 6)) : "General";
            $activityReport["workerResponses"]["delayTypes"][$type] = ($activityReport["workerResponses"]["delayTypes"][$type] ?? 0) + 1;
        }
    }
    $htFlat = []; foreach($activityReport["workerResponses"]["helpTypes"] as $k=>$v) $htFlat[] = ["type"=>$k, "count"=>$v];
    $ptFlat = []; foreach($activityReport["workerResponses"]["pestTypes"] as $k=>$v) $ptFlat[] = ["type"=>$k, "count"=>$v];
    $dtFlat = []; foreach($activityReport["workerResponses"]["delayTypes"] as $k=>$v) $dtFlat[] = ["type"=>$k, "count"=>$v];
    
    $activityReport["workerResponses"]["helpTypes"] = $htFlat;
    $activityReport["workerResponses"]["pestTypes"] = $ptFlat;
    $activityReport["workerResponses"]["delayTypes"] = $dtFlat;
    
    // F. Response Tracking
    $activityReport["timeline"] = safeRows($conn, "SELECT sl.created_at as timestamp, w.name as workerName, sl.response_text as action FROM sms_logs sl JOIN workers w ON sl.worker_id = w.id WHERE sl.direction = 'Outbound' AND $log_where ORDER BY sl.created_at DESC LIMIT 20");
    // G. Unresponsive Workers (Live status)
    $unrespWorkers = safeRows($conn, "SELECT name FROM workers WHERE unresponsive = 1");
    foreach($unrespWorkers as $uw) {
        $activityReport["systemAlerts"]["unresponsive"][] = $uw['name'];
    }
}

// ==========================================
// CORE REPORT 2: ANALYTICAL / SUMMARY
// ==========================================
$analyticalReport = null;
if ($report_type === 'all' || $report_type === 'analytical') {
    $analyticalReport = [
        "systemEffectiveness" => [ "taskCompletionRate" => 0, "workerResponsivenessRate" => 0, "smsDeliverySuccessRate" => 0, "smsDelivery" => ["sent" => 0, "failed" => 0] ],
        "frequencyAnalysis" => [ "help" => [], "delay" => [], "pest" => [] ],
        "cropLifecycle" => [ "Land Preparation" => ["done"=>0,"delay"=>0,"pest"=>0], "Planting" => ["done"=>0,"delay"=>0,"pest"=>0], "Irrigating" => ["done"=>0,"delay"=>0,"pest"=>0], "Fertilizing" => ["done"=>0,"delay"=>0,"pest"=>0], "Harvesting" => ["done"=>0,"delay"=>0,"pest"=>0] ],
        "operationalInsights" => [ "affectedActivities" => [], "riskIndicators" => [] ],
        "workerRankings" => []
    ];
    
    // A. Core Performance Metrics
    $tq = safeRows($conn, "SELECT COUNT(*) as c FROM scheduled_tasks st JOIN message_templates mt ON st.template_id = mt.id WHERE $task_where");
    $totalTask = $tq[0]['c'] ?? 0;
    $dq = safeRows($conn, "SELECT COUNT(*) as c FROM scheduled_tasks st JOIN message_templates mt ON st.template_id = mt.id WHERE st.status='Completed' AND $task_where");
    $doneT = $dq[0]['c'] ?? 0;
    $sq = safeRows($conn, "SELECT status, COUNT(*) as c FROM sms_queue sq GROUP BY status");
    $totalQueue = 0; $sentQ = 0; $failedQ = 0;
    foreach($sq as $row) { 
        $totalQueue += $row['c']; 
        if (strtolower($row['status'])==='sent') $sentQ += $row['c']; 
        if (strtolower($row['status'])==='failed') $failedQ += $row['c'];
    }
    if ($totalTask > 0) $analyticalReport["systemEffectiveness"]["taskCompletionRate"] = round(($doneT / $totalTask) * 100);
    if ($totalQueue > 0) $analyticalReport["systemEffectiveness"]["smsDeliverySuccessRate"] = round(($sentQ / $totalQueue) * 100);
    $analyticalReport["systemEffectiveness"]["smsDelivery"]["sent"] = $sentQ;
    $analyticalReport["systemEffectiveness"]["smsDelivery"]["failed"] = $failedQ;

    // B. Frequency Analysis & Pest Stage Tracking
    $wrData = safeRows($conn, "SELECT sl.response_text, sl.created_at, w.name, mt.batch_id, fb.planting_date FROM sms_logs sl JOIN workers w ON sl.worker_id = w.id LEFT JOIN scheduled_tasks st ON sl.task_id = st.id LEFT JOIN message_templates mt ON st.template_id = mt.id LEFT JOIN farm_batches fb ON mt.batch_id = fb.id WHERE sl.direction = 'Outbound' AND $log_where");
    foreach($wrData as $r) {
        $txt = strtoupper($r['response_text'] ?? '');
        if (strpos($txt, 'HELP:') === 0) { $reason = trim(substr($txt, 5)) ?: "General"; $analyticalReport["frequencyAnalysis"]["help"][$reason] = ($analyticalReport["frequencyAnalysis"]["help"][$reason] ?? 0) + 1; }
        else if (strpos($txt, 'PEST') === 0 || $txt === 'UOD') { 
            $reason = strpos($txt, 'PEST:') === 0 ? trim(substr($txt, 5)) : ($txt === 'UOD' ? 'Uod' : 'General');
            $analyticalReport["frequencyAnalysis"]["pest"][$reason] = ($analyticalReport["frequencyAnalysis"]["pest"][$reason] ?? 0) + 1; 
            
            // Map pest occurrence to crop stage
            $stage = getCropStage($r['planting_date'] ?? date('Y-m-d', strtotime('-1 month')), $r['created_at']);
            if (isset($analyticalReport["cropLifecycle"][$stage])) {
                $analyticalReport["cropLifecycle"][$stage]["pest"]++;
            }
        }
        else if (strpos($txt, 'DELAY:') === 0) { $reason = trim(substr($txt, 6)) ?: "General"; $analyticalReport["frequencyAnalysis"]["delay"][$reason] = ($analyticalReport["frequencyAnalysis"]["delay"][$reason] ?? 0) + 1; }
    }
    $flatHelp = []; foreach($analyticalReport["frequencyAnalysis"]["help"] as $k=>$v) $flatHelp[] = ["category"=>$k, "count"=>$v];
    $flatPest = []; foreach($analyticalReport["frequencyAnalysis"]["pest"] as $k=>$v) $flatPest[] = ["category"=>$k, "count"=>$v];
    $flatDelay = []; foreach($analyticalReport["frequencyAnalysis"]["delay"] as $k=>$v) $flatDelay[] = ["category"=>$k, "count"=>$v];
    $analyticalReport["frequencyAnalysis"]["help"] = $flatHelp; $analyticalReport["frequencyAnalysis"]["pest"] = $flatPest; $analyticalReport["frequencyAnalysis"]["delay"] = $flatDelay;

    // C & D. Crop Lifecycle & Operational Insights
    $affectedAct = [];
    $allTasks = safeRows($conn, "SELECT st.status, st.completed_at, mt.category, fb.planting_date FROM scheduled_tasks st JOIN message_templates mt ON st.template_id = mt.id LEFT JOIN farm_batches fb ON st.batch_id = fb.id WHERE $task_where");
    foreach($allTasks as $t) {
        $stage = getCropStage($t['planting_date'], $t['completed_at'] ?: date('Y-m-d'));
        if (isset($analyticalReport["cropLifecycle"][$stage])) {
            if ($t['status'] === 'Completed') {
                $analyticalReport["cropLifecycle"][$stage]["done"]++;
            } else if ($t['status'] === 'Delayed' || $t['status'] === 'Pending') {
                $analyticalReport["cropLifecycle"][$stage]["delay"]++;
                $cat = $t['category'] ?: "Uncategorized";
                $affectedAct[$cat] = ($affectedAct[$cat] ?? 0) + 1;
            }
        }
    }
    $affFlat = []; foreach($affectedAct as $k=>$v) $affFlat[] = ["activity"=>$k, "delays"=>$v];
    usort($affFlat, function($a, $b) { return $b['delays'] <=> $a['delays']; });
    $analyticalReport["operationalInsights"]["affectedActivities"] = array_slice($affFlat, 0, 5);
    
    foreach($flatPest as $fp) {
        $analyticalReport["operationalInsights"]["riskIndicators"][] = "Pest Report: " . $fp['category'] . " (" . $fp['count'] . " occurrences)";
    }
    if (count($affFlat) > 0 && $affFlat[0]['delays'] > 5) $analyticalReport["operationalInsights"]["riskIndicators"][] = "Severe delays in " . $affFlat[0]['activity'];

    // E. Worker Performance Ranking
    $workersQuery = safeRows($conn, "
        SELECT w.id, w.name,
               SUM(CASE WHEN sl.direction = 'Outbound' THEN 1 ELSE 0 END) as workerReplied,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text = 'DONE' THEN 1 ELSE 0 END) as doneCount,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text LIKE 'DELAY%' THEN 1 ELSE 0 END) as delayCount,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text LIKE 'HELP%' THEN 1 ELSE 0 END) as helpCount,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text LIKE 'PEST%' THEN 1 ELSE 0 END) as pestCount
        FROM workers w
        LEFT JOIN sms_logs sl ON w.id = sl.worker_id AND ($log_where)
        WHERE w.status = 'Active'
        GROUP BY w.id, w.name
    ");
    // Also fetch sent count from sms_queue
    $qSent = safeRows($conn, "SELECT worker_id, COUNT(*) as c FROM sms_queue WHERE status='Sent' GROUP BY worker_id");
    $qSentMap = []; foreach($qSent as $qs) { $qSentMap[$qs['worker_id']] = (int)$qs['c']; }
    
    $workerRanks = []; $totalSystemSent = 0; $totalWorkerReplied = 0;
    foreach($workersQuery as $wq) {
        $sent = $qSentMap[$wq['id']] ?? 0; 
        $replied = (int)$wq['workerReplied'];
        $totalSystemSent += $sent; $totalWorkerReplied += $replied;
        $respRate = $sent > 0 ? round(($replied / $sent) * 100) : 0;
        if ($replied > $sent) $respRate = 100; // Cap at 100%
        $unresponsive = max(0, $sent - $replied);
        
        // Remove score calculation, just map data
        $workerRanks[] = ["id" => $wq['id'], "name" => $wq['name'], "sent" => $sent, "replied" => $replied, "responsiveness" => $respRate, "unresponsiveIncidents" => $unresponsive, "done" => $wq['doneCount'], "delay" => $wq['delayCount'], "help" => $wq['helpCount'], "pest" => $wq['pestCount']];
    }
    // Rank logic: Responsiveness Desc, Unresponsive Asc, Done Desc, Delay Asc
    usort($workerRanks, function($a, $b) { 
        if ($a['responsiveness'] !== $b['responsiveness']) return $b['responsiveness'] <=> $a['responsiveness'];
        if ($a['unresponsiveIncidents'] !== $b['unresponsiveIncidents']) return $a['unresponsiveIncidents'] <=> $b['unresponsiveIncidents'];
        if ($a['done'] !== $b['done']) return $b['done'] <=> $a['done'];
        return $a['delay'] <=> $b['delay'];
    });
    $analyticalReport["workerRankings"] = $workerRanks;
    if ($totalSystemSent > 0) $analyticalReport["systemEffectiveness"]["workerResponsivenessRate"] = round(($totalWorkerReplied / $totalSystemSent) * 100);
}

// ==========================================
// CORE REPORT 3: EXPORT (DEEP DIVE)
// ==========================================
$exportReport = null;
if ($report_type === 'all' || $report_type === 'export') {
    $exportReport = [
        "metadata" => [ "generatedAt" => date('Y-m-d H:i:s'), "filtersUsed" => "Batch: " . ($batch_id ?: 'All') . " | Worker: " . ($worker_id ?: 'All') . " | Range: " . ($start_date ?: 'All Time') ],
        "profiles" => [ "workers" => [], "batchDetails" => null ],
        "aggregated" => [ "responsiveness" => 0, "doneCount" => 0, "delayCount" => 0, "unresponsiveCount" => 0 ],
        "timelineMatrix" => [ "Land Preparation" => 0, "Planting" => 0, "Irrigating" => 0, "Fertilizing" => 0, "Harvesting" => 0 ],
        "logs" => []
    ];
    
    // B. Profiles & Assignment Summary
    if ($batch_id > 0) {
        $bdet = safeRows($conn, "SELECT id, name, variety, planting_date FROM farm_batches WHERE id = $batch_id");
        if (count($bdet) > 0) {
            $wCnt = safeRows($conn, "SELECT COUNT(*) as c FROM batch_workers WHERE batch_id=$batch_id");
            $exportReport["profiles"]["batchDetails"] = [
                "id" => $bdet[0]['id'], "name" => $bdet[0]['name'], "cropType" => $bdet[0]['variety'],
                "plantingDate" => $bdet[0]['planting_date'], "stage" => getCropStage($bdet[0]['planting_date']),
                "totalWorkers" => $wCnt[0]['c']
            ];
        }
    }
    $wProfCond = "WHERE w.status='Active'";
    if ($worker_id > 0) $wProfCond .= " AND w.id=$worker_id";
    if ($batch_id > 0 && $worker_id == 0) {
        $profs = safeRows($conn, "SELECT w.name, w.phone_number, w.status FROM workers w JOIN batch_workers bw ON w.id = bw.worker_id $wProfCond AND bw.batch_id=$batch_id");
    } else {
        $profs = safeRows($conn, "SELECT name, phone_number, status FROM workers w $wProfCond");
    }
    $exportReport["profiles"]["workers"] = $profs;

    $exportReport["aggregated"] = [ "responsiveness" => 0 ];
    $exportReport["taskPerformance"] = [ "onTime" => 0, "delayedDone" => 0, "activeDelays" => 0, "unresponsive" => 0 ];

    // C & D. Aggregated Metrics & Task Performance
    $f_sent = 0; $f_replied = 0; $f_onTime = 0; $f_delayedDone = 0; $f_activeDelay = 0;
    
    $wQ2 = safeRows($conn, "
        SELECT w.id, 
               SUM(CASE WHEN sl.direction = 'Outbound' THEN 1 ELSE 0 END) as r, 
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text = 'DONE' AND DATE(sl.created_at) <= DATE(st.due_date) THEN 1 ELSE 0 END) as onTime,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text = 'DONE' AND DATE(sl.created_at) > DATE(st.due_date) THEN 1 ELSE 0 END) as delayedDone,
               SUM(CASE WHEN sl.direction = 'Outbound' AND sl.response_text LIKE 'DELAY%' THEN 1 ELSE 0 END) as activeDelay
        FROM workers w 
        LEFT JOIN sms_logs sl ON w.id = sl.worker_id AND ($log_where)
        LEFT JOIN scheduled_tasks st ON sl.task_id = st.id
        WHERE w.status = 'Active' 
        GROUP BY w.id
    ");

    $qSentEx = safeRows($conn, "SELECT worker_id, COUNT(*) as c FROM sms_queue WHERE status='Sent' GROUP BY worker_id");
    $qSentExMap = []; foreach($qSentEx as $qs) { $qSentExMap[$qs['worker_id']] = (int)$qs['c']; }

    foreach($wQ2 as $wq) {
        if ($worker_id > 0 && $wq['id'] != $worker_id) continue;
        if ($batch_id > 0) {
            $isAssigned = safeRows($conn, "SELECT 1 FROM batch_workers WHERE batch_id = $batch_id AND worker_id = " . $wq['id']);
            if (count($isAssigned) === 0) continue;
        }
        $f_sent += ($qSentExMap[$wq['id']] ?? 0); 
        $f_replied += (int)$wq['r']; 
        $f_onTime += (int)$wq['onTime']; $f_delayedDone += (int)$wq['delayedDone']; $f_activeDelay += (int)$wq['activeDelay'];
    }
    
    $respRate = $f_sent > 0 ? round(($f_replied / $f_sent) * 100) : 0;
    if ($f_replied > $f_sent) $respRate = 100;
    
    $exportReport["aggregated"]["responsiveness"] = $respRate;
    $exportReport["taskPerformance"]["onTime"] = $f_onTime;
    $exportReport["taskPerformance"]["delayedDone"] = $f_delayedDone;
    $exportReport["taskPerformance"]["activeDelays"] = $f_activeDelay;
    $exportReport["taskPerformance"]["unresponsive"] = max(0, $f_sent - $f_replied);

    // E. SMS Interaction Logs & F. Timeline Performance Matrix
    $deepLogs = safeRows($conn, "
        SELECT sl.id, sl.created_at, sl.worker_id, sl.task_id, w.name as workerName, sl.direction, sl.response_text, st.status, mt.name as taskName, fb.name as batchName, fb.planting_date
        FROM sms_logs sl
        LEFT JOIN workers w ON sl.worker_id = w.id
        LEFT JOIN scheduled_tasks st ON sl.task_id = st.id
        LEFT JOIN message_templates mt ON st.template_id = mt.id
        LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
        WHERE sl.direction = 'Outbound' AND $export_log_where
        ORDER BY sl.created_at DESC
        LIMIT 500
    ");
    
    foreach($deepLogs as &$dl) {
        // F. Timeline Matrix
        $stage = getCropStage($dl['planting_date'], $dl['created_at']);
        if (isset($exportReport["timelineMatrix"][$stage])) {
            $exportReport["timelineMatrix"][$stage]++;
        }
        
        // E. Latency Calculation
        $latencyStr = "N/A";
        if ($dl['task_id']) {
            $prevSys = safeRows($conn, "SELECT created_at FROM sms_logs WHERE direction='Inbound' AND worker_id={$dl['worker_id']} AND task_id={$dl['task_id']} AND created_at < '{$dl['created_at']}' ORDER BY created_at DESC LIMIT 1");
            if (count($prevSys) > 0) {
                $sysTime = strtotime($prevSys[0]['created_at']);
                $repTime = strtotime($dl['created_at']);
                $diffMin = round(($repTime - $sysTime) / 60);
                if ($diffMin < 60) $latencyStr = $diffMin . "m";
                else {
                    $hrs = floor($diffMin / 60);
                    $mins = $diffMin % 60;
                    $latencyStr = $hrs . "h " . $mins . "m";
                }
            }
        }
        $dl['latency'] = $latencyStr;
    }
    $exportReport["logs"] = $deepLogs;
}

$bwQ = safeRows($conn, "SELECT batch_id, worker_id FROM batch_workers");
$bwMap = []; foreach($bwQ as $bw) { $bwMap[$bw['batch_id']][] = $bw['worker_id']; }
$wQ = safeRows($conn, "SELECT id, name FROM workers WHERE status='Active' ORDER BY name");
$wMap = []; foreach($wQ as $w) { $wMap[$w['id']] = $w['name']; }

$filterOptions = [
    "batches" => safeRows($conn, "SELECT id, name FROM farm_batches ORDER BY name"),
    "batchWorkers" => $bwMap,
    "workersMap" => $wMap
];

echo json_encode([
    "activityReport" => $activityReport,
    "analyticalReport" => $analyticalReport,
    "exportReport" => $exportReport,
    "filterOptions" => $filterOptions
]);