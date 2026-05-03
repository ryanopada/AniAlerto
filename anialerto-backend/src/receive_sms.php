<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain; charset=UTF-8");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "anialerto";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'] ?? 'Unknown';
    $message = $_POST['message'] ?? '';
    $worker_id = isset($_POST['worker_id']) ? (int)$_POST['worker_id'] : 0;
    
    $sql = "INSERT INTO sms_logs (worker_id, phone, message, direction, status, created_at) 
            VALUES (?, ?, ?, 'Inbound', 'Received', NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iss", $worker_id, $phone, $message);
    
    if ($stmt->execute()) {
        echo "SUCCESS: Log recorded in AniAlerto";
    } else {
        echo "DATABASE_ERROR: " . $conn->error;
    }
    
    $stmt->close();
} else {
    echo "WAITING_FOR_DATA: Please send a POST request from the SIM800C.";
}

$conn->close();
?>