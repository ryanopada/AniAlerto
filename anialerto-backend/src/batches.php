<?php
require_once 'Response.php';
require_once 'Helpers.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = new mysqli("localhost", "u268935662_anialerto123", "AniAlerto123", "u268935662_AniAlerto");

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
        $name = sanitize_string($data['name']);
        $location = sanitize_string($data['location']);
        $variety = sanitize_string($data['variety']);
        $area = sanitize_string($data['area']);
        $notes = sanitize_string($data['notes'] ?? '');
        $harvestDate = !empty($data['harvestDate']) ? $data['harvestDate'] : null;

        if (empty($name) || empty($location) || empty($variety)) {
            Response::error("Name, Location, and Variety are required.", 400);
        }

        validate_date($data['plantingDate']);
        if ($harvestDate) {
            validate_date($harvestDate);
            if (strtotime($harvestDate) < strtotime($data['plantingDate'])) {
                Response::error("Harvest Date cannot be earlier than Planting Date.", 400);
            }
        }

        $stmt = $conn->prepare(
            "INSERT INTO farm_batches (name, location, planting_date, harvest_date, area, variety, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssssss",
            $name,
            $location,
            $data['plantingDate'],
            $harvestDate,
            $area,
            $variety,
            $data['status'],
            $notes
        );

        if ($stmt->execute()) {
            $batchId = $conn->insert_id;
            $batchName = $data['name'];
            $plantingDateStr = $data['plantingDate'];
            
            try {
                $plantDate = new DateTime($plantingDateStr);
                
                // Automatically create Land Preparation messages
                if ($plantDate) {
                    $templates = [
                        [
                            "name" => "First Plowing",
                            "category" => "First Plowing",
                            "days_offset" => -14,
                            "msg" => "First Plowing for {batch_name} is scheduled. Ensure tractors and implements are checked."
                        ],
                        [
                            "name" => "Harrowing",
                            "category" => "Harrowing",
                            "days_offset" => -7,
                            "msg" => "Harrowing for {batch_name} is coming up. Please prepare the fields."
                        ],
                        [
                            "name" => "Plant Date Reminder",
                            "category" => "Plant Date / Planting",
                            "days_offset" => 0,
                            "msg" => "Today is the Plant Date for {batch_name}. Ensure all seeds and manpower are ready.\n\nNgayon ang araw ng pagtatanim para sa {batch_name}. Tiyaking handa na ang mga buto at tauhan."
                        ]
                    ];

                    $tStmt = $conn->prepare(
                        "INSERT INTO message_templates 
                        (name, category, message, trigger_type, days_after_planting, active, batch_id, scheduled_time, plant_date, scheduled_send_datetime, is_test, created_at)
                        VALUES (?, ?, ?, 'days_after_planting', ?, 1, ?, '06:00:00', ?, ?, 0, NOW())"
                    );

                    if ($tStmt) {
                        foreach ($templates as $t) {
                            $sendDT = clone $plantDate;
                            $sendDT->modify($t['days_offset'] . ' days');
                            $sendDTStr = $sendDT->format('Y-m-d') . ' 06:00:00';
                            $pdStr = $plantDate->format('Y-m-d');
                            
                            $tStmt->bind_param("sssiiss", $t['name'], $t['category'], $t['msg'], $t['days_offset'], $batchId, $pdStr, $sendDTStr);
                            $tStmt->execute();
                        }
                        $tStmt->close();
                    }
                }
            } catch (Exception $e) {
                // Ignore date parsing errors
            }

            echo json_encode(["status" => "success", "id" => $batchId]);
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

    $name = sanitize_string($data['name']);
    $location = sanitize_string($data['location']);
    $variety = sanitize_string($data['variety']);
    $area = sanitize_string($data['area']);
    $notes = sanitize_string($data['notes'] ?? '');
    $harvestDate = !empty($data['harvestDate']) ? $data['harvestDate'] : null;

    if (empty($name) || empty($location) || empty($variety)) {
        Response::error("Name, Location, and Variety are required.", 400);
    }

    validate_date($data['plantingDate']);
    if ($harvestDate) {
        validate_date($harvestDate);
        if (strtotime($harvestDate) < strtotime($data['plantingDate'])) {
            Response::error("Harvest Date cannot be earlier than Planting Date.", 400);
        }
    }

    $stmt = $conn->prepare(
        "UPDATE farm_batches 
         SET name=?, location=?, planting_date=?, harvest_date=?, area=?, variety=?, status=?, notes=?, updated_at=NOW() 
         WHERE id=?"
    );
    $stmt->bind_param("ssssssssi",
        $name,
        $location,
        $data['plantingDate'],
        $harvestDate,
        $area,
        $variety,
        $data['status'],
        $notes,
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