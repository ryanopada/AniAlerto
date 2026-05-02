<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Scheduler.php';

try {
    $result = (new Scheduler())->run();
    echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, 'Scheduler error: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
