<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once 'Database.php';

try {
    $db = Database::getInstance();
    
    // Fetch pest reports with worker, batch, and pest advisory names
    $query = "
        SELECT 
            pa.id,
            pa.phone,
            pa.status,
            pa.notes,
            pa.reported_at,
            pa.completed_at,
            pa.advisory_sent,
            w.name AS worker_name,
            fb.name AS batch_name,
            pad.pest_name
        FROM pest_alerts pa
        LEFT JOIN workers w ON pa.worker_id = w.id
        LEFT JOIN farm_batches fb ON pa.batch_id = fb.id
        LEFT JOIN pest_advisories pad ON pa.pest_type_id = pad.id
        ORDER BY pa.reported_at DESC
    ";
    
    $stmt = $db->query($query);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $reports
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
