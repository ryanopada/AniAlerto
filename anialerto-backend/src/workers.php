<?php
require_once 'Response.php';
require_once 'Helpers.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$host = "localhost";
$db_name = "u268935662_AniAlerto";
$username = "u268935662_anialerto123";
$password = "AniAlerto123";
$conn = new mysqli($host, $username, $password, $db_name);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $batch_filter = isset($_GET['batch_id']) ? intval($_GET['batch_id']) : 0;

        // Join batch_workers + farm_batches to include each worker's current batch assignment.
        // GROUP BY w.id so that workers in multiple batches still return a single row.
        $sql = "SELECT w.id, w.name, w.phone, w.status, w.unresponsive, w.missed_response_count,
                       GROUP_CONCAT(bw.batch_id) AS batch_ids,
                       GROUP_CONCAT(fb.name SEPARATOR ', ') AS batch_names
                FROM workers w
                LEFT JOIN batch_workers bw ON w.id  = bw.worker_id
                LEFT JOIN farm_batches  fb ON fb.id = bw.batch_id";

        if ($batch_filter > 0) {
            $sql .= " WHERE w.id IN (SELECT worker_id FROM batch_workers WHERE batch_id = $batch_filter)";
        }

        $sql .= " GROUP BY w.id, w.name, w.phone, w.status
                  ORDER BY w.id DESC";

        $result = $conn->query($sql);
        $workers = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $batchIds = !empty($row['batch_ids']) ? explode(',', $row['batch_ids']) : [];
                $workers[] = [
                    'id'                    => $row['id'],
                    'name'                  => $row['name'],
                    'phone'                 => $row['phone'],
                    'status'                => $row['status'],
                    'unresponsive'          => $row['unresponsive'],
                    'missed_response_count' => $row['missed_response_count'],
                    'batchIds'              => $batchIds,
                    'assignedBatches'       => $row['batch_names'] ?: '-',
                ];
            }
        }
        echo json_encode($workers);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        $name = sanitize_string($data['name']);
        if (empty($name)) {
            Response::error("Name cannot be empty.", 400);
        }

        $phone = normalize_phone($data['phone']);
        validate_phone($data['phone']);

        $chk = $conn->prepare("SELECT id FROM workers WHERE phone = ?");
        $chk->bind_param("s", $phone);
        $chk->execute();
        if ($chk->get_result()->num_rows > 0) {
            Response::error("Phone number is already registered.", 400);
        }
        $chk->close();

        $stmt = $conn->prepare("INSERT INTO workers (name, phone, status) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $phone, $data['status']);

        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            // Assign to batches if selected
            if (!empty($data['batchIds']) && is_array($data['batchIds'])) {
                $s2 = $conn->prepare("INSERT INTO batch_workers (worker_id, batch_id) VALUES (?, ?)");
                foreach ($data['batchIds'] as $bId) {
                    $s2->bind_param("ii", $newId, $bId);
                    $s2->execute();
                }
                $s2->close();
            }
            echo json_encode(["status" => "success", "id" => $newId]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        $stmt->close();
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        // Handle Reactivation Endpoint
        if (isset($_GET['action']) && $_GET['action'] === 'reactivate') {
            if (!isset($data['id'])) {
                echo json_encode(["status" => "error", "message" => "Missing ID"]);
                break;
            }
            $stmt = $conn->prepare("UPDATE workers SET unresponsive = 0 WHERE id = ?");
            $stmt->bind_param("i", $data['id']);
            if ($stmt->execute()) {
                echo json_encode(["status" => "reactivated"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
            $stmt->close();
            break;
        }

        if (!isset($data['id'])) {
            echo json_encode(["status" => "error", "message" => "Missing ID"]);
            break;
        }

        $name = sanitize_string($data['name']);
        if (empty($name)) {
            Response::error("Name cannot be empty.", 400);
        }

        $phone = normalize_phone($data['phone']);
        validate_phone($data['phone']);

        $chk = $conn->prepare("SELECT id FROM workers WHERE phone = ? AND id != ?");
        $chk->bind_param("si", $phone, $data['id']);
        $chk->execute();
        if ($chk->get_result()->num_rows > 0) {
            Response::error("Phone number is already registered to another worker.", 400);
        }
        $chk->close();

        // 1. Update the worker's basic fields (name, phone, status only — no batch column here)
        $stmt = $conn->prepare("UPDATE workers SET name=?, phone=?, status=? WHERE id=?");
        $stmt->bind_param("sssi", $name, $phone, $data['status'], $data['id']);

        if (!$stmt->execute()) {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
            break;
        }
        $stmt->close();

        // 2. Replace the batch assignment in batch_workers
        $del = $conn->prepare("DELETE FROM batch_workers WHERE worker_id=?");
        $del->bind_param("i", $data['id']);
        $del->execute();
        $del->close();

        if (!empty($data['batchIds']) && is_array($data['batchIds'])) {
            $ins = $conn->prepare("INSERT INTO batch_workers (worker_id, batch_id) VALUES (?, ?)");
            foreach ($data['batchIds'] as $bId) {
                $ins->bind_param("ii", $data['id'], $bId);
                $ins->execute();
            }
            $ins->close();
        }

        echo json_encode(["status" => "updated"]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            break;
        }

        $id = $_GET['id'];

        // Remove batch assignments first (FK safety)
        $del = $conn->prepare("DELETE FROM batch_workers WHERE worker_id=?");
        $del->bind_param("i", $id);
        $del->execute();
        $del->close();

        $stmt = $conn->prepare("DELETE FROM workers WHERE id=?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "deleted"]);
        }
        $stmt->close();
        break;

    // PATCH — toggle status only (Active ↔ Inactive), no other fields required
    case 'PATCH':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id']) || !isset($data['status'])) {
            echo json_encode(["status" => "error", "message" => "Missing id or status"]);
            break;
        }

        $allowed = ['Active', 'Inactive'];
        if (!in_array($data['status'], $allowed)) {
            echo json_encode(["status" => "error", "message" => "Invalid status value"]);
            break;
        }

        $stmt = $conn->prepare("UPDATE workers SET status=? WHERE id=?");
        $stmt->bind_param("si", $data['status'], $data['id']);
        if ($stmt->execute()) {
            echo json_encode(["status" => "updated", "newStatus" => $data['status']]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        $stmt->close();
        break;
}

$conn->close();
?>