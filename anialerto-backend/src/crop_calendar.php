<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Get all active batches with planting info
    $batchStmt = $db->prepare("
        SELECT 
            fb.id,
            fb.name,
            fb.location,
            fb.planting_date,
            fb.area,
            fb.variety,
            fb.status,
            fb.harvest_date,
            fb.notes
        FROM farm_batches fb
        WHERE 1=1
        ORDER BY fb.planting_date DESC
    ");
    $batchStmt->execute();
    $batches = $batchStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all active message templates
    $templateStmt = $db->prepare("
        SELECT 
            id,
            name,
            category,
            message,
            days_after_planting,
            expected_responses,
            active,
            batch_id,
            scheduled_send_datetime
        FROM message_templates
        WHERE active = 1 AND (trigger_type = 'days_after_planting' OR scheduled_send_datetime IS NOT NULL)
        ORDER BY days_after_planting ASC, scheduled_send_datetime ASC
    ");
    $templateStmt->execute();
    $allTemplates = $templateStmt->fetchAll(PDO::FETCH_ASSOC);

    // Build timeline data for each batch
    $timeline = [];
    $today = new DateTime();

    foreach ($batches as $batch) {
        $plantingDate = new DateTime($batch['planting_date']);
        $daysSincePlanting = $today->diff($plantingDate)->days;
        
        // If planting date is in the future, days is negative
        if ($today < $plantingDate) {
            $daysSincePlanting = -$daysSincePlanting;
        }

        // Default harvest at 120 days
        $harvestDate = $batch['harvest_date'] 
            ? $batch['harvest_date'] 
            : (clone $plantingDate)->modify('+120 days')->format('Y-m-d');

        // Build SMS schedule for this batch
        $smsSchedule = [];
        foreach ($allTemplates as $template) {
            // Only include templates specifically assigned to this batch
            if (empty($template['batch_id']) || $template['batch_id'] != $batch['id']) {
                continue;
            }

            $dueDay = (int) $template['days_after_planting'];
            
            if (!empty($template['scheduled_send_datetime'])) {
                $dueDate = date('Y-m-d', strtotime($template['scheduled_send_datetime']));
                $status = 'upcoming';
                $todayDateStr = $today->format('Y-m-d');
                if ($todayDateStr > $dueDate) {
                    $status = 'sent';
                } elseif ($todayDateStr === $dueDate) {
                    $status = 'today';
                }
            } else {
                $dueDate = (clone $plantingDate)->modify("+{$dueDay} days")->format('Y-m-d');
                $status = 'upcoming';
                if ($daysSincePlanting > $dueDay) {
                    $status = 'sent';
                } elseif ($daysSincePlanting === $dueDay) {
                    $status = 'today';
                }
            }

            // Check if there is an actual task for this template + batch to get its exact status
            $checkStmt = $db->prepare("
                SELECT status FROM scheduled_tasks 
                WHERE batch_id = :bid AND template_id = :tid
                ORDER BY due_date DESC LIMIT 1
            ");
            $checkStmt->execute(['bid' => $batch['id'], 'tid' => $template['id']]);
            $taskData = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($taskData) {
                $status = strtolower($taskData['status']);
            }

            $smsSchedule[] = [
                'template_id' => $template['id'],
                'template_name' => $template['name'],
                'category' => $template['category'],
                'message' => $template['message'],
                'days_after_planting' => $dueDay,
                'due_date' => $dueDate,
                'status' => $status,
                'expected_responses' => json_decode($template['expected_responses'] ?? '[]')
            ];
        }

        // Get workers assigned to this batch
        $workerStmt = $db->prepare("
            SELECT w.id, w.name, w.phone, w.status
            FROM workers w
            JOIN batch_workers bw ON w.id = bw.worker_id
            WHERE bw.batch_id = :bid
        ");
        $workerStmt->execute(['bid' => $batch['id']]);
        $workers = $workerStmt->fetchAll(PDO::FETCH_ASSOC);

        $timeline[] = [
            'batch_id' => $batch['id'],
            'batch_name' => $batch['name'],
            'location' => $batch['location'],
            'variety' => $batch['variety'],
            'area' => $batch['area'],
            'status' => $batch['status'],
            'planting_date' => $batch['planting_date'],
            'harvest_date' => $harvestDate,
            'current_day' => max(0, $daysSincePlanting),
            'total_days' => 120,
            'progress_percent' => min(100, max(0, round(($daysSincePlanting / 120) * 100))),
            'sms_schedule' => $smsSchedule,
            'workers' => $workers,
            'notes' => $batch['notes']
        ];
    }

    echo json_encode([
        'timeline' => $timeline,
        'today' => $today->format('Y-m-d')
    ]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    http_response_code(500);
}
?>
