<?php
echo "PHP date: " . date('Y-m-d H:i:s') . "\n";
date_default_timezone_set('Asia/Manila');
echo "Manila date: " . date('Y-m-d H:i:s') . "\n";
$conn = new mysqli("localhost", "root", "", "anialerto");
$res = $conn->query("SELECT NOW() as db_now");
$row = $res->fetch_assoc();
echo "DB NOW: " . $row['db_now'] . "\n";
?>
