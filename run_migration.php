<?php
require_once __DIR__ . '/anialerto-backend/src/Database.php';
$db = (new Database())->getConnection();
$sql = file_get_contents(__DIR__ . '/anialerto-backend/database/weather_migration.sql');
try {
    $db->exec($sql);
    echo "Migration successful.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
