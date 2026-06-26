<?php
final class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $status = 200, array $extra = []): void
    {
        // Use HTTP 200 for errors to prevent shared hosting providers (like Hostinger)
        // from intercepting 400/422 status codes and injecting HTML error pages.
        self::json(array_merge(['status' => 'error', 'message' => $message, 'error' => $message], $extra), $status);
    }
}
