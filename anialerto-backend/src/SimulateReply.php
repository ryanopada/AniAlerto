<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

// --- CONFIGURATION ---
// Change this to the phone number of the worker you want to simulate
$farmerPhone = "+639123456789"; 
$replyMessage = "DONE";
// ---------------------

try {
    $sql = "INSERT INTO inbound_messages (phone, message, received_at) 
            VALUES (:phone, :message, NOW())";
    
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':phone', $farmerPhone);
    $stmt->bindParam(':message', $replyMessage);
    
    if($stmt->execute()) {
        echo "<h3>Simulation Successful!</h3>";
        echo "Farmer ($farmerPhone) sent: '$replyMessage'<br>";
        echo "Next step: Run <a href='ProcessReplies.php'>ProcessReplies.php</a> to update the task status.";
    }
} catch (Exception $e) {
    echo "Error simulating reply: " . $e->getMessage();
}
?>