<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

try {
    // Execute PM2 restart
    // 2>&1 redirects stderr to stdout to capture any errors
    $output = shell_exec('pm2 restart anialerto-worker 2>&1');

    if ($output === null) {
        throw new Exception("Command failed or pm2 is not recognized. Is it in the system PATH?");
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'SMS Service Restarted Successfully'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to restart worker: ' . $e->getMessage()
    ]);
    http_response_code(500);
}
?>
