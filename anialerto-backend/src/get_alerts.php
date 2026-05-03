<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM alerts ORDER BY created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute();

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));