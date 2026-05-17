<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$host = "localhost";
$db_name = "anialerto";
$username = "root";
$password = "";
$conn = new mysqli($host, $username, $password, $db_name);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Join batch_workers + farm_batches to include each worker's current batch assignment.
        // GROUP BY w.id so that workers in multiple batches still return a single row.
        $sql = "SELECT w.id, w.name, w.phone, w.status,
                       MIN(bw.batch_id)  AS batch_id,
                       MIN(fb.name)      AS batch_name
                FROM workers w
                LEFT JOIN batch_workers bw ON w.id  = bw.worker_id
                LEFT JOIN farm_batches  fb ON fb.id = bw.batch_id
                GROUP BY w.id, w.name, w.phone, w.status
                ORDER BY w.id DESC";

        $result = $conn->query($sql);
        $workers = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $workers[] = [
                    'id'           => $row['id'],
                    'name'         => $row['name'],
                    'phone'        => $row['phone'],
                    'status'       => $row['status'],
                    'batch_id'     => $row['batch_id'],   // numeric id, null if unassigned
                    'batch_name'   => $row['batch_name'] ?: '-', // display name
                ];
            }
        }
        echo json_encode($workers);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $conn->prepare("INSERT INTO workers (name, phone, status) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['name'], $data['phone'], $data['status']);

        if ($stmt->execute()) {
            $newId = $conn->insert_id;
            // Assign to batch if one was selected
            if (!empty($data['batchId'])) {
                $s2 = $conn->prepare("INSERT INTO batch_workers (worker_id, batch_id) VALUES (?, ?)");
                $s2->bind_param("ii", $newId, $data['batchId']);
                $s2->execute();
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

        if (!isset($data['id'])) {
            echo json_encode(["status" => "error", "message" => "Missing ID"]);
            break;
        }

        // 1. Update the worker's basic fields (name, phone, status only — no batch column here)
        $stmt = $conn->prepare("UPDATE workers SET name=?, phone=?, status=? WHERE id=?");
        $stmt->bind_param("sssi", $data['name'], $data['phone'], $data['status'], $data['id']);

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

        if (!empty($data['batchId'])) {
            $ins = $conn->prepare("INSERT INTO batch_workers (worker_id, batch_id) VALUES (?, ?)");
            $ins->bind_param("ii", $data['id'], $data['batchId']);
            $ins->execute();
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