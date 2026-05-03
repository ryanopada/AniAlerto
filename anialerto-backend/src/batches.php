<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
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
    $sql = "SELECT id, name, location, planting_date, area, variety, status, notes FROM farm_batches ORDER BY id DESC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit();
    }

    $batches = [];
    while($row = $result->fetch_assoc()) {
        $batches[] = $row;
    }
    echo json_encode($batches);
} 
elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!empty($data)) {
        $stmt = $conn->prepare("INSERT INTO farm_batches (name, location, planting_date, area, variety, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
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
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        $stmt->close();
    }
}
$conn->close();
?>