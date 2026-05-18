<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$conn = new mysqli('localhost', 'root', '', 'anialerto');
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

// ── Auto-add columns if missing (safe to run every request) ─────────────────
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_test TINYINT NOT NULL DEFAULT 0");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS queued_at DATETIME DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()");
$conn->query("ALTER TABLE batch_workers ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()");

// ── Ensure message_recipients table exists ───────────────────────────────────
$conn->query("
    CREATE TABLE IF NOT EXISTS message_recipients (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        template_id INT NOT NULL,
        worker_id   INT NOT NULL,
        created_at  DATETIME DEFAULT NOW(),
        UNIQUE KEY unique_template_worker (template_id, worker_id)
    )
");

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list all scheduled (datetime-based) pending messages ────────────────
if ($method === 'GET') {
    $sql = "
        SELECT
            mt.id,
            mt.name,
            mt.category,
            mt.message,
            mt.scheduled_send_datetime,
            mt.active,
            mt.is_test,
            mt.queued_at,
            mt.batch_id,
            fb.name AS batch_name,
            (
                SELECT COUNT(*) FROM sms_queue sq
                WHERE sq.task_id IN (
                    SELECT id FROM scheduled_tasks WHERE template_id = mt.id
                )
            ) AS queued_count,
            (
                SELECT COUNT(*) FROM sms_queue sq
                WHERE sq.task_id IN (
                    SELECT id FROM scheduled_tasks WHERE template_id = mt.id
                ) AND sq.status = 'Sent'
            ) AS sent_count
        FROM message_templates mt
        LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
        WHERE mt.scheduled_send_datetime IS NOT NULL
        ORDER BY mt.scheduled_send_datetime DESC
    ";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    echo json_encode($rows);
    exit;
}

// ── POST: mark-as-sent or toggle is_test ────────────────────────────────────
if ($method === 'POST') {
    $data   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($data['id'] ?? 0);
    $action = $data['action'] ?? '';

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing id']);
        exit;
    }

    if ($action === 'mark_sent') {
        // Set queued_at = a past timestamp so the scheduler treats it as already processed,
        // and deactivate the template so it is completely skipped.
        $stmt = $conn->prepare(
            "UPDATE message_templates SET active = 0, queued_at = NOW() WHERE id = ?"
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();

        // Also cancel any Queued/Retry entries in sms_queue for this template
        $conn->query("
            UPDATE sms_queue SET status = 'Failed', updated_at = NOW()
            WHERE status IN ('Queued','Retry','Sending')
              AND task_id IN (SELECT id FROM scheduled_tasks WHERE template_id = $id)
        ");

        echo json_encode(['status' => 'success', 'message' => 'Template marked as sent and deactivated.']);
        exit;
    }

    if ($action === 'toggle_test') {
        $stmt = $conn->prepare(
            "UPDATE message_templates SET is_test = 1 - is_test WHERE id = ?"
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['status' => 'success']);
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
    exit;
}

// ── DELETE: permanently remove a scheduled message template ─────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing id']);
        exit;
    }

    // Cancel any pending queue entries first so FK constraints don't block
    $conn->query("
        UPDATE sms_queue SET status = 'Failed', updated_at = NOW()
        WHERE status IN ('Queued','Retry','Sending')
          AND task_id IN (SELECT id FROM scheduled_tasks WHERE template_id = $id)
    ");

    // Remove recipient snapshot for this template
    $conn->query("DELETE FROM message_recipients WHERE template_id = $id");

    $stmt = $conn->prepare("DELETE FROM message_templates WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['status' => 'deleted']);
    exit;
}

$conn->close();
?>
