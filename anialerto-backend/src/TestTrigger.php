<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();

// Backdate a batch to 15 days ago
$testDate = date('Y-m-d', strtotime('-15 days'));

try {
    // Updates the first active batch found to 'Day 15'
    $sql = "UPDATE farm_batches SET planting_date = :pdate, status = 'Active' WHERE status = 'Active' LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute(['pdate' => $testDate]);

    echo "Simulation Ready: One batch has been set to 15 days ago.<br>";
    echo "You can now run <strong>Scheduler.php</strong> to see it generate the SMS alert.";
} catch (Exception $e) {
    echo "Simulation Setup failed: " . $e->getMessage();
}
?>