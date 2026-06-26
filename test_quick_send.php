<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = json_decode('{"worker_id": 1, "message": "Test quick send"}', true);
require 'anialerto-backend/src/send_manual_sms.php';
?>
