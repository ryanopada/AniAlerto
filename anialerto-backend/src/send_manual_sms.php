<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

// GET - return workers list for the dropdown
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT w.id, w.name, w.phone, w.status, w.assignedBatch
            FROM workers w
            WHERE w.status = 'Active'
            ORDER BY w.name ASC
        ");
        $stmt->execute();
        $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $batchStmt = $db->prepare("
            SELECT fb.id, fb.name 
            FROM farm_batches fb 
            WHERE fb.status = 'Active'
            ORDER BY fb.name ASC
        ");
        $batchStmt->execute();
        $batches = $batchStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['workers' => $workers, 'batches' => $batches]);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
        http_response_code(500);
    }
    exit;
}

// POST - send SMS
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $sendTo = $input['send_to'] ?? '';       // 'all', 'batch', 'individual'
    $batchId = $input['batch_id'] ?? null;
    $workerIds = $input['worker_ids'] ?? [];  // array of worker IDs
    $message = trim($input['message'] ?? '');

    if (empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'Message cannot be empty']);
        http_response_code(400);
        exit;
    }

    try {
        $workers = [];

        if ($sendTo === 'all') {
            $stmt = $db->prepare("SELECT id, name, phone FROM workers WHERE status = 'Active'");
            $stmt->execute();
            $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($sendTo === 'batch' && $batchId) {
            $stmt = $db->prepare("
                SELECT w.id, w.name, w.phone FROM workers w
                JOIN batch_workers bw ON w.id = bw.worker_id
                WHERE bw.batch_id = :bid AND w.status = 'Active'
            ");
            $stmt->execute(['bid' => $batchId]);
            $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($sendTo === 'individual' && !empty($workerIds)) {
            $placeholders = implode(',', array_fill(0, count($workerIds), '?'));
            $stmt = $db->prepare("SELECT id, name, phone FROM workers WHERE id IN ($placeholders) AND status = 'Active'");
            $stmt->execute($workerIds);
            $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        if (empty($workers)) {
            echo json_encode(['status' => 'error', 'message' => 'No active workers found for selected target']);
            exit;
        }

        $queued = 0;
        $details = [];

        foreach ($workers as $w) {
            $personalMsg = str_replace('{worker_name}', $w['name'], $message);

            $qStmt = $db->prepare("
                INSERT INTO sms_queue (task_id, worker_id, phone, message, status, created_at) 
                VALUES (NULL, :wid, :phone, :msg, 'Queued', NOW())
            ");
            $qStmt->execute([
                'wid' => $w['id'],
                'phone' => $w['phone'],
                'msg' => $personalMsg
            ]);
            $queued++;
            $details[] = "{$w['name']} ({$w['phone']})";
        }

        echo json_encode([
            'status' => 'success',
            'message' => "{$queued} SMS queued successfully. The SMS worker will send them automatically.",
            'queued' => $queued,
            'recipients' => $details
        ]);

    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed: ' . $e->getMessage()]);
        http_response_code(500);
    }
}
?>
