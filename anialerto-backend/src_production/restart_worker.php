<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'Database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Insert the RESTART command for the local Node.js worker to pick up
    $stmt = $db->prepare("INSERT INTO system_commands (command, created_at) VALUES ('RESTART_WORKER', NOW())");
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'message' => 'Restart command sent. The local SMS Service will restart within 10 seconds.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send restart command: ' . $e->getMessage()
    ]);
    http_response_code(500);
}
?>
