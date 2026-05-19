<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$conn = new mysqli("localhost", "root", "", "anialerto");
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    http_response_code(500); exit;
}

// ── Auto-create alerts table (idempotent) ────────────────────────────────────
$conn->query("
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
// Migrate existing tables — safe to run every request
$conn->query("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS done_reply VARCHAR(255) DEFAULT NULL");

// ── Valid commands (UOD removed) ──────────────────────────────────────────────
$knownCommands = ['DONE', 'DELAY', 'HELP', 'PEST'];

// ── Auto-reply messages ───────────────────────────────────────────────────────
$autoReplies = [
    'INVALID' => "Invalid reply. Please reply only with DONE, DELAY, HELP, or PEST.\n\nMali ang sagot. Mangyaring sumagot lamang ng DONE, DELAY, HELP, o PEST.",
    'DONE'    => "Task completion recorded. Thank you for updating AniAlerto.\n\nNaitala ang pagkumpleto ng gawain. Salamat sa pag-update sa AniAlerto.",
    'DELAY'   => "Delay recorded. A follow-up reminder will be sent to the worker.\n\nNaitala ang pagkaantala. Magpapadala ng follow-up na paalala sa manggagawa.",
    'PEST'    => "Pest incident recorded. Please inspect the affected area and prepare pesticide spraying if necessary.\n\nNaitala ang insidente ng peste. Mangyaring suriin ang apektadong lugar at ihanda ang pagpa-spray ng pesticide kung kinakailangan.",
    'HELP'    => [
        'Irrigation'   => "Irrigation Help: Check water source, irrigation path, and schedule.\n\nTulong sa Patubig: Suriin ang pinagmulan ng tubig, landas ng patubig, at iskedyul.",
        'Fertilization'=> "Fertilizer Help: Apply the recommended amount evenly across the field.\n\nTulong sa Abono: Ilapat ang inirerekomendang dami nang pantay-pantay sa bukid.",
        'Pest Control' => "Spray Help: Wear protective equipment and apply spray evenly.\n\nTulong sa Pag-spray: Magsuot ng proteksiyon at mag-spray nang pantay-pantay.",
        'Harvest'      => "Harvest Help: Ensure crops are mature and prepare harvesting tools.\n\nTulong sa Ani: Tiyaking hinog na ang pananim at ihanda ang mga kagamitan sa pag-aani.",
        'General'      => "Help received. Please wait for further instructions from our team.\n\nNatanggap ang tulong. Mangyaring maghintay ng karagdagang tagubilin mula sa aming koponan.",
    ],
];

// ── Helper: queue a reply via sms_queue ───────────────────────────────────────
function queueSMS($conn, $phone, $message, $workerId = null) {
    $s = $conn->prepare(
        "INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at)
         VALUES (NULL, ?, ?, ?, 'Queued', NOW())"
    );
    $s->bind_param("iss", $workerId, $phone, $message);
    $s->execute(); $s->close();
}

// ── Helper: create admin alert ────────────────────────────────────────────────
function createAlert($conn, $type, $workerId, $workerName, $phone, $taskId, $message) {
    $s = $conn->prepare(
        "INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, NOW())"
    );
    $s->bind_param("sissss", $type, $workerId, $workerName, $phone, $taskId, $message);
    $s->execute(); $s->close();
}

// ── Helper: get admin phone ───────────────────────────────────────────────────
function getAdminPhone($conn) {
    $r = $conn->query("SELECT phone FROM admins WHERE phone IS NOT NULL AND phone != '' LIMIT 1");
    $row = $r ? $r->fetch_assoc() : null;
    return $row ? $row['phone'] : null;
}

// ── Helper: latest pending task for worker ────────────────────────────────────
function getTaskContext($conn, $workerId) {
    $s = $conn->prepare(
        "SELECT st.id, st.batch_id, mt.category, fb.name AS batch_name
         FROM scheduled_tasks st
         JOIN batch_workers bw ON st.batch_id = bw.batch_id
         LEFT JOIN message_templates mt ON st.template_id = mt.id
         LEFT JOIN farm_batches fb ON st.batch_id = fb.id
         WHERE bw.worker_id = ? AND st.status = 'Pending'
         ORDER BY st.due_date DESC LIMIT 1"
    );
    $s->bind_param("i", $workerId);
    $s->execute();
    $r = $s->get_result()->fetch_assoc();
    $s->close();
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone     = trim($_POST['phone']   ?? 'Unknown');
    $message   = trim($_POST['message'] ?? '');
    $worker_id = isset($_POST['worker_id']) ? (int)$_POST['worker_id'] : null;

    // ── Normalize phone ───────────────────────────────────────────────────────
    $cleanPhone = preg_replace('/[\s\-().]/', '', $phone);
    if (preg_match('/^09\d{9}$/', $cleanPhone)) {
        $cleanPhone = '+63' . substr($cleanPhone, 1);
    }

    // ── Detect command ────────────────────────────────────────────────────────
    $upperMsg = strtoupper(trim($message));
    $command  = null;
    foreach ($knownCommands as $cmd) {
        if (strpos($upperMsg, $cmd) === 0) { $command = $cmd; break; }
    }

    // ── Resolve worker_id if not provided ────────────────────────────────────
    $digits = preg_replace('/\D+/', '', $cleanPhone);
    $key10  = strlen($digits) >= 10 ? substr($digits, -10) : $digits;
    $alt    = strpos($cleanPhone, '+63') === 0
                ? '0' . substr($cleanPhone, 3)
                : (strpos($cleanPhone, '0') === 0 ? '+63' . substr($cleanPhone, 1) : $cleanPhone);

    if (!$worker_id) {
        $ws = $conn->prepare(
            "SELECT id, name FROM workers WHERE status='Active'
               AND (phone=? OR phone=?
                    OR RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'+',''),' ',''),'-',''),'(',''),')',''),10)=?)
             LIMIT 1"
        );
        $ws->bind_param("sss", $cleanPhone, $alt, $key10);
        $ws->execute();
        $wr = $ws->get_result()->fetch_assoc();
        $ws->close();
        if ($wr) { $worker_id = (int)$wr['id']; $workerName = $wr['name']; }
    }

    // ── Reject unregistered numbers ───────────────────────────────────────────
    if (!$worker_id) {
        echo json_encode(["success" => false, "message" => "Unregistered number — ignored"]);
        http_response_code(403); $conn->close(); exit;
    }

    // Fetch worker name if not already set
    if (empty($workerName)) {
        $wn = $conn->query("SELECT name FROM workers WHERE id={$worker_id} LIMIT 1");
        $workerName = ($wn && $r = $wn->fetch_assoc()) ? $r['name'] : 'Unknown';
    }

    // ── Invalid reply gate ────────────────────────────────────────────────────
    if ($command === null) {
        // Log for audit only
        $s = $conn->prepare("INSERT INTO inbound_messages (phone, message, command, received_at, processed_at) VALUES (?, ?, NULL, NOW(), NOW())");
        $s->bind_param("ss", $cleanPhone, $message); $s->execute(); $s->close();
        // Queue invalid reply SMS
        queueSMS($conn, $cleanPhone, $autoReplies['INVALID'], $worker_id);
        echo json_encode(["success" => false, "message" => "Invalid command — auto-reply queued", "command" => null]);
        $conn->close(); exit;
    }

    // ── Store in inbound_messages (audit only) ───────────────────────────────
    $s = $conn->prepare("INSERT INTO inbound_messages (phone, message, command, received_at, processed_at) VALUES (?, ?, ?, NOW(), NOW())");
    $s->bind_param("sss", $cleanPhone, $message, $command); $s->execute(); $s->close();

    // ── Update the matching outbound sms_logs row in-place ────────────────────
    // No new Inbound row — the existing outbound row is mutated to carry the reply.
    $s = $conn->prepare(
        "UPDATE sms_logs
            SET response_text = ?,
                received_at   = NOW(),
                status        = 'Replied'
          WHERE direction  = 'Outbound'
            AND status    != 'Replied'
            AND (
              worker_id = ?
              OR phone  = ?
              OR phone  = ?
              OR RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,'+',''),' ',''),'-',''),'(',''),')',''),10) = ?
            )
          ORDER BY created_at DESC
          LIMIT 1"
    );
    $s->bind_param("sissss", $command, $worker_id, $cleanPhone, $alt, $key10);
    $s->execute(); $s->close();

    // ── Dispatch command ──────────────────────────────────────────────────────
    $task      = getTaskContext($conn, $worker_id);
    $taskId    = $task ? $task['id']         : null;
    $batchId   = $task ? $task['batch_id']   : null;
    $category  = $task ? ($task['category'] ?? 'General') : 'General';
    $batchName = $task ? ($task['batch_name'] ?? '') : '';
    $adminPhone = getAdminPhone($conn);

    if ($command === 'DONE') {
        if ($task) {
            $s = $conn->prepare("UPDATE scheduled_tasks SET status='Completed', completed_at=NOW(), updated_at=NOW() WHERE id=?");
            $s->bind_param("i", $taskId); $s->execute(); $s->close();
        }

        // ★ Update open DELAY alert: record done_reply & update message (admin must manually dismiss)
        $doneEN  = "Worker {$workerName} replied DONE for {$category} task" . ($batchName ? " in {$batchName}" : '') . ($taskId ? " (Task #{$taskId})" : '') . ".";
        $doneTL  = "Sumagot ng DONE si {$workerName} para sa gawain ng {$category}" . ($batchName ? " sa {$batchName}" : '') . ($taskId ? " (Gawain #{$taskId})" : '') . ".";
        $doneMsg = $doneEN . "\n\n" . $doneTL;
        if ($taskId) {
            $s = $conn->prepare("UPDATE alerts SET done_reply=?, message=? WHERE type='DELAY' AND worker_id=? AND task_id=? AND is_read=0");
            $s->bind_param("ssii", $workerName, $doneMsg, $worker_id, $taskId);
        } else {
            $s = $conn->prepare("UPDATE alerts SET done_reply=?, message=? WHERE type='DELAY' AND worker_id=? AND is_read=0 ORDER BY created_at DESC LIMIT 1");
            $s->bind_param("ssi", $workerName, $doneMsg, $worker_id);
        }
        $s->execute(); $s->close();

        queueSMS($conn, $cleanPhone, $autoReplies['DONE'], $worker_id);
    }

    elseif ($command === 'DELAY') {
        if ($task) {
            $s = $conn->prepare("UPDATE scheduled_tasks SET status='Delayed', updated_at=NOW() WHERE id=?");
            $s->bind_param("i", $taskId); $s->execute(); $s->close();
        }
        queueSMS($conn, $cleanPhone, $autoReplies['DELAY'], $worker_id);

        $urgent = in_array($category, ['Irrigation', 'Pest Control']) ? 'URGENT: ' : '';
        $instrEN = [
            'Irrigation'    => 'Check water source & irrigation lines.',
            'Fertilization' => 'Apply fertilizer evenly across the field.',
            'Pest Control'  => 'Inspect area, wear protective gear, and spray evenly.',
            'Harvest'       => 'Ensure crops are mature and prepare harvesting tools.',
            'General'       => 'Complete your assigned task as soon as possible.',
        ];
        $instrTL = [
            'Irrigation'    => 'Suriin ang tubig at linya ng patubig.',
            'Fertilization' => 'Mag-apply ng pataba nang pantay sa bukid.',
            'Pest Control'  => 'Suriin ang lugar, magsuot ng proteksyon, mag-spray.',
            'Harvest'       => 'Tiyaking hinog na. Ihanda ang mga kagamitan.',
            'General'       => 'Kumpletuhin ang gawain sa lalong madaling panahon.',
        ];
        $iEN   = $instrEN[$category] ?? $instrEN['General'];
        $iTL   = $instrTL[$category] ?? $instrTL['General'];
        $ctx   = $batchName ? " in {$batchName}" : '';
        $ctxTL = $batchName ? " sa {$batchName}" : '';
        $followUp  = "{$urgent}AniAlerto Reminder: Your {$category} task{$ctx} is delayed. {$iEN} Reply DONE when finished.";
        $followUp .= "\n\n{$urgent}AniAlerto Paalala: Naantala ang iyong {$category} na gawain{$ctxTL}. {$iTL} Sumagot ng DONE kapag tapos.";
        queueSMS($conn, $cleanPhone, $followUp, $worker_id);

        // Create a dashboard checklist alert for DELAY (checkable by admin — does NOT auto-clear on DONE)
        $batchInfo = $batchName ? " in {$batchName}" : '';
        $msg  = "{$workerName} ({$cleanPhone}) reported DELAY on {$category} task{$batchInfo}" . ($taskId ? " (Task #{$taskId})" : '') . ".";
        $msg .= "\n\nNag-ulat ng DELAY si {$workerName} ({$cleanPhone}) sa gawain ng {$category}{$batchInfo}" . ($taskId ? " (Gawain #{$taskId})" : '') . ". Magpapadala ng follow-up na paalala.";
        createAlert($conn, 'DELAY', $worker_id, $workerName, $cleanPhone, $taskId, $msg);

        // Harvest additionally gets an admin SMS
        if ($category === 'Harvest' && $adminPhone) {
            queueSMS($conn, $adminPhone, "AniAlerto Alert: {$workerName} reported HARVEST DELAY in {$batchName}. Task #{$taskId}. Follow up immediately.\n\nAniAlerto Alerto: Nag-ulat ng HARVEST DELAY si {$workerName} sa {$batchName}. Gawain #{$taskId}. Mag-follow up agad.");
        }
    }

    elseif ($command === 'HELP') {
        if ($task) {
            $s = $conn->prepare("UPDATE scheduled_tasks SET status='NeedsHelp', updated_at=NOW() WHERE id=?");
            $s->bind_param("i", $taskId); $s->execute(); $s->close();
        }
        $helpMsg = $autoReplies['HELP'][$category] ?? $autoReplies['HELP']['General'];
        queueSMS($conn, $cleanPhone, $helpMsg, $worker_id);

        $batchInfo = $batchName ? " in {$batchName}" : '';
        $msg  = "{$workerName} ({$cleanPhone}) needs HELP with {$category}{$batchInfo}" . ($taskId ? " (Task #{$taskId})" : '') . ".";
        $msg .= "\n\nHumihingi ng HELP si {$workerName} ({$cleanPhone}) para sa {$category}{$batchInfo}" . ($taskId ? " (Gawain #{$taskId})" : '') . ". Mangyaring tulungan agad.";
        createAlert($conn, 'HELP', $worker_id, $workerName, $cleanPhone, $taskId, $msg);
        if ($adminPhone) queueSMS($conn, $adminPhone, "AniAlerto: {$workerName} needs HELP on {$category} task{$batchInfo}. Phone: {$cleanPhone}.\n\nAniAlerto: Humihingi ng HELP si {$workerName} sa {$category}{$batchInfo}. Telepono: {$cleanPhone}.");
    }

    elseif ($command === 'PEST') {
        $s = $conn->prepare("INSERT INTO pest_alerts (worker_id, phone, batch_id, task_id, status, reported_at) VALUES (?, ?, ?, ?, 'Open', NOW())");
        $s->bind_param("isii", $worker_id, $cleanPhone, $batchId, $taskId); $s->execute(); $s->close();

        $batchInfo = $batchName ? " in {$batchName}" : '';
        $msg  = "PEST report from {$workerName} ({$cleanPhone}){$batchInfo}. Urgent inspection required.";
        $msg .= "\n\nUlat ng PEST mula kay {$workerName} ({$cleanPhone}){$batchInfo}. Kailangan ng agarang inspeksyon.";
        createAlert($conn, 'PEST', $worker_id, $workerName, $cleanPhone, $taskId, $msg);
        if ($adminPhone) queueSMS($conn, $adminPhone, "AniAlerto URGENT: {$workerName} reported PEST{$batchInfo}. Immediate inspection required. Phone: {$cleanPhone}.\n\nAniAlerto URGENT: Nag-ulat ng PEST si {$workerName}{$batchInfo}. Kailangan ng agarang inspeksyon. Telepono: {$cleanPhone}.");
        queueSMS($conn, $cleanPhone, $autoReplies['PEST'], $worker_id);
        // Task status NOT changed for PEST
    }

    echo json_encode(["success" => true, "command" => $command, "message" => "Reply processed"]);
}

$conn->close();
?>
