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

function sanitize_string($string): string
{
    if ($string === null) return '';
    return htmlspecialchars(strip_tags(trim($string)), ENT_QUOTES, 'UTF-8');
}

function validate_phone(string $phone): void
{
    $normalized = normalize_phone($phone);
    if (!preg_match('/^\+639\d{9}$/', $normalized)) {
        Response::error("Invalid phone number format. Must be a valid Philippine mobile number (e.g., 09123456789 or +639123456789).", 422);
    }
}

function validate_date(string $date): void
{
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        Response::error("Invalid date format. Use YYYY-MM-DD.", 422);
    }
}
