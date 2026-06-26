<?php
require_once 'Database.php';
$database = new Database();
$db = $database->getConnection();
$db->exec("
CREATE TABLE IF NOT EXISTS system_commands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    command VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
");
echo "Table created successfully.";
?>
