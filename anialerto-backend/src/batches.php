<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = new mysqli("localhost", "root", "", "anialerto");

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $sql = "SELECT id, name, location, planting_date, area, variety, status, notes
            FROM farm_batches ORDER BY id DESC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit();
    }

    $batches = [];
    while ($row = $result->fetch_assoc()) {
        $batches[] = $row;
    }
    echo json_encode($batches);

} elseif ($method == 'POST') {
    // Create a new batch
    $data = json_decode(file_get_contents("php://input"), true);

    if (!empty($data)) {
        $stmt = $conn->prepare(
            "INSERT INTO farm_batches (name, location, planting_date, area, variety, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssssss",
            $data['name'],
            $data['location'],
            $data['plantingDate'],
            $data['area'],
            $data['variety'],
            $data['status'],
            $data['notes']
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        $stmt->close();
    }

} elseif ($method == 'PUT') {
    // Update an existing batch in place
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id'])) {
        echo json_encode(["status" => "error", "message" => "Missing batch ID"]);
        exit();
    }

    $stmt = $conn->prepare(
        "UPDATE farm_batches
         SET name=?, location=?, planting_date=?, area=?, variety=?, status=?, notes=?
         WHERE id=?"
    );
    $stmt->bind_param("sssssssi",
        $data['name'],
        $data['location'],
        $data['plantingDate'],
        $data['area'],
        $data['variety'],
        $data['status'],
        $data['notes'],
        $data['id']
    );

    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    $stmt->close();
} elseif ($method == 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Missing batch ID"]);
        exit();
    }

    // Count workers currently assigned to this batch (for the response message)
    $wc = $conn->prepare("SELECT COUNT(*) AS cnt FROM batch_workers WHERE batch_id=?");
    $wc->bind_param("i", $id);
    $wc->execute();
    $workerCount = $wc->get_result()->fetch_assoc()['cnt'];
    $wc->close();

    // 1. Remove worker assignments
    $d1 = $conn->prepare("DELETE FROM batch_workers WHERE batch_id=?");
    $d1->bind_param("i", $id);
    $d1->execute();
    $d1->close();

    // 2. Detach any message templates linked to this batch
    //    (set batch_id = NULL so they become "All Batches" instead of disappearing)
    $d2 = $conn->prepare("UPDATE message_templates SET batch_id=NULL WHERE batch_id=?");
    $d2->bind_param("i", $id);
    $d2->execute();
    $d2->close();

    // 3. Delete the batch itself
    $d3 = $conn->prepare("DELETE FROM farm_batches WHERE id=?");
    $d3->bind_param("i", $id);
    if ($d3->execute()) {
        echo json_encode(["status" => "success", "unassigned_workers" => (int)$workerCount]);
    } else {
        echo json_encode(["status" => "error", "message" => $d3->error]);
    }
    $d3->close();
}

$conn->close();
?>