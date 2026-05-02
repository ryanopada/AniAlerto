<?php
return [
    'DB_HOST' => '127.0.0.1',
    'DB_NAME' => 'anialerto',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'DB_CHARSET' => 'utf8mb4',

    // Development CORS origin. Change this to your frontend URL.
    'CORS_ORIGIN' => 'http://localhost:5173',

    // Options: log, gammu_cli
    'SMS_DRIVER' => 'log',

    // Use international PH format, e.g. +639123456789.
    'DEFAULT_SEND_TIME' => '08:00:00',
];
