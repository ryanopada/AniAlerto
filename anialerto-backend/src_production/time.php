<?php
echo "PHP date: " . date('Y-m-d H:i:s') . "\n";
date_default_timezone_set('Asia/Manila');
echo "Manila date: " . date('Y-m-d H:i:s') . "\n";
$conn = new mysqli("localhost", "u268935662_anialerto123", "AniAlerto123", "u268935662_AniAlerto"); $conn->query("SET time_zone = '+08:00'");
$res = $conn->query("SELECT NOW() as db_now");
$row = $res->fetch_assoc();
echo "DB NOW: " . $row['db_now'] . "\n";
?>
