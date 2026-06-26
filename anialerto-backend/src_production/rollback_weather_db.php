<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once 'Database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Revert stuck tasks
    $db->exec("UPDATE scheduled_tasks SET status = 'Pending' WHERE status = 'Weather_Hold'");

    // 2. Revert the ENUM
    $db->exec("ALTER TABLE scheduled_tasks MODIFY COLUMN status ENUM('Pending','Completed','Delayed','Cancelled') NOT NULL DEFAULT 'Pending'");

    // 3. Drop columns
    // Use try-catch blocks for drops in case they don't exist
    $queries = [
        "ALTER TABLE scheduled_tasks DROP COLUMN weather_reason",
        "ALTER TABLE message_templates DROP COLUMN is_weather_sensitive",
        "ALTER TABLE message_templates DROP COLUMN weather_rules",
        "ALTER TABLE farm_batches DROP COLUMN municipality"
    ];

    foreach ($queries as $q) {
        try {
            $db->exec($q);
        } catch (Exception $e) {
            // Ignore drop errors if columns don't exist
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Database successfully rolled back. Weather features removed.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
