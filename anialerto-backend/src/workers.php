<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
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
    $sql = "SELECT 
                id, 
                name, 
                phone, 
                status 
            FROM workers 
            ORDER BY id DESC";
    
    $result = $conn->query($sql);
    $workers = [];
    
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $row['assignedBatch'] = '-'; 
            $workers[] = $row;
        }
    }
    echo json_encode($workers);
    break;

    case 'POST':
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO workers (name, phone, status) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $data['name'], $data['phone'], $data['status']);
    
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id'])) {
            echo json_encode(["status" => "error", "message" => "Missing ID"]);
            break;
        }

        $stmt = $conn->prepare("UPDATE workers SET name=?, phone=?, assignedBatch=?, status=? WHERE id=?");
        $stmt->bind_param("ssssi", $data['name'], $data['phone'], $data['assignedBatch'], $data['status'], $data['id']);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "updated"]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            break;
        }

        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM workers WHERE id=?");
        $stmt->bind_param("i", $id);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "deleted"]);
        }
        break;
}

$conn->close();
?>