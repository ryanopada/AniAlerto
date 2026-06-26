<?php
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        Response::error('Invalid JSON body', 422);
    }
    return $data;
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
            Response::error("Missing required field: {$field}", 422);
        }
    }
}

function normalize_phone(string $phone): string
{
    $phone = preg_replace('/\s+|-/', '', trim($phone));
    if (str_starts_with($phone, '09')) {
        return '+63' . substr($phone, 1);
    }
    if (str_starts_with($phone, '639')) {
        return '+' . $phone;
    }
    return $phone;
}
