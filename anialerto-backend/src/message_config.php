<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$conn = new mysqli("localhost", "root", "", "anialerto");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

// Auto-add new columns if they don't exist yet (safe to run repeatedly)
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS batch_id INT(11) DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '06:00:00'");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS plant_date DATE DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS scheduled_send_datetime DATETIME DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_test TINYINT NOT NULL DEFAULT 0");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS queued_at DATETIME DEFAULT NULL");
$conn->query("ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()");

// Ensure batch_workers has created_at so the scheduler can filter by join date
$conn->query("ALTER TABLE batch_workers ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT NOW()");

// ── Create message_recipients snapshot table (safe to run every request) ─────
// Stores WHICH workers should receive each scheduled template at creation time.
// This prevents new workers added later from receiving old scheduled messages.
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

// ── GET: list all templates ──────────────────────────────────────────────────
if ($method == 'GET') {
    $sql = "SELECT mt.*, fb.name AS batch_name
            FROM message_templates mt
            LEFT JOIN farm_batches fb ON mt.batch_id = fb.id
            ORDER BY mt.id ASC";
    $result = $conn->query($sql);
    $templates = [];
    while ($row = $result->fetch_assoc()) {
        $row['expected_responses'] = json_decode($row['expected_responses']) ?? [];
        if ($row['scheduled_time']) {
            $row['scheduled_time'] = substr($row['scheduled_time'], 0, 5);
        }
        if ($row['scheduled_send_datetime']) {
            $row['scheduled_send_datetime'] = substr($row['scheduled_send_datetime'], 0, 16);
        }
        $templates[] = $row;
    }
    echo json_encode($templates);
    exit;
}

// ── POST: create or update a template ───────────────────────────────────────
if ($method == 'POST') {
    $data      = json_decode(file_get_contents("php://input"), true);
    $responses = json_encode($data['expected_responses'] ?? []);
    $batchId   = !empty($data['batch_id']) ? intval($data['batch_id']) : null;
    $plantDate = !empty($data['plant_date']) ? $data['plant_date'] : null;

    $sendDT = null;
    if (!empty($data['scheduled_send_datetime'])) {
        $raw    = str_replace('T', ' ', $data['scheduled_send_datetime']);
        $sendDT = (strlen($raw) === 16) ? $raw . ':00' : $raw;
    }

    $schedTime = '06:00:00';
    if ($sendDT) {
        $schedTime = substr($sendDT, 11, 5) . ':00';
    } elseif (!empty($data['scheduled_time'])) {
        $schedTime = $data['scheduled_time'] . ':00';
    }

    $daysAfter = 0;
    if ($plantDate && $sendDT) {
        $p = new DateTime($plantDate);
        $s = new DateTime($sendDT);
        $daysAfter = (int)$p->diff($s)->days;
    } elseif (isset($data['days_after_planting'])) {
        $daysAfter = intval($data['days_after_planting']);
    }

    $name        = $data['name']         ?? '';
    $category    = $data['category']     ?? 'General';
    $message     = $data['message']      ?? '';
    $triggerType = $data['trigger_type'] ?? 'days_after_planting';
    $active      = isset($data['active']) ? intval($data['active']) : 1;
    $isTest      = isset($data['is_test']) ? intval($data['is_test']) : 0;
    $isUpdate    = isset($data['id']) && $data['id'];

    if ($isUpdate) {
        $stmt = $conn->prepare(
            "UPDATE message_templates
             SET name=?, category=?, message=?, trigger_type=?,
                 days_after_planting=?, expected_responses=?, active=?,
                 batch_id=?, scheduled_time=?,
                 plant_date=?, scheduled_send_datetime=?, is_test=?
             WHERE id=?"
        );
        $id = intval($data['id']);
        $stmt->bind_param(
            "ssssisisssiii",
            $name, $category, $message, $triggerType,
            $daysAfter, $responses, $active,
            $batchId, $schedTime,
            $plantDate, $sendDT, $isTest, $id
        );
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO message_templates
             (name, category, message, trigger_type, days_after_planting,
              expected_responses, active, batch_id, scheduled_time,
              plant_date, scheduled_send_datetime, is_test, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        $stmt->bind_param(
            "ssssisissssi",
            $name, $category, $message, $triggerType,
            $daysAfter, $responses, $active,
            $batchId, $schedTime,
            $plantDate, $sendDT, $isTest
        );
    }

    if ($stmt->execute()) {
        $templateId = $isUpdate ? intval($data['id']) : $conn->insert_id;

        // ── Snapshot recipients at save time ──────────────────────────────────
        // This ensures that only workers active AT THE TIME THE TEMPLATE WAS SAVED
        // will receive it. New workers added later are explicitly excluded.
        if ($sendDT) {
            // On UPDATE: only snapshot if none exists yet — preserve the original
            // recipient list so new workers added later aren't included.
            $hasSnapshot = false;
            if ($isUpdate) {
                $chk = $conn->query("SELECT id FROM message_recipients WHERE template_id = $templateId LIMIT 1");
                $hasSnapshot = $chk && $chk->num_rows > 0;
            }

            if (!$hasSnapshot) {
                // New template or first-time snapshot: record current active workers
                $wQuery = "";
                if ($batchId) {
                    $wQuery = "SELECT w.id FROM workers w
                               JOIN batch_workers bw ON w.id = bw.worker_id
                               WHERE bw.batch_id = $batchId AND w.status = 'Active'";
                } else {
                    $wQuery = "SELECT id FROM workers WHERE status = 'Active'";
                }
                
                $wRes = $conn->query($wQuery);
                if ($wRes && $wRes->num_rows > 0) {
                    $ins = $conn->prepare(
                        "INSERT IGNORE INTO message_recipients (template_id, worker_id) VALUES (?, ?)"
                    );
                    while ($wRow = $wRes->fetch_assoc()) {
                        $ins->bind_param("ii", $templateId, $wRow['id']);
                        $ins->execute();
                    }
                    $ins->close();
                }
            }
        }

        echo json_encode(["status" => "success", "id" => $templateId]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// ── DELETE: remove template + its recipient snapshot ────────────────────────
if ($method == 'DELETE') {
    $id = intval($_GET['id']);
    $conn->query("DELETE FROM message_recipients WHERE template_id = $id");
    $conn->query("DELETE FROM message_templates WHERE id = $id");
    echo json_encode(["status" => "deleted"]);
    exit;
}

$conn->close();
?>