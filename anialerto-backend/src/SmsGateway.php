<?php
final class SmsGateway
{
    public function send(string $phone, string $message): array
    {
        $config = require __DIR__ . '/../config/config.php';
        $driver = $config['SMS_DRIVER'] ?? 'log';

        if ($driver === 'gammu_cli') {
            return $this->sendUsingGammuCli($phone, $message);
        }

        // Development mode: simulate success without using the modem.
        error_log('[AniAlerto SMS LOG] To: ' . $phone . ' Message: ' . $message);
        return [
            'success' => true,
            'provider_ref' => 'LOG-' . date('YmdHis') . '-' . random_int(1000, 9999),
            'raw_response' => 'Logged only; no GSM modem used.',
        ];
    }

    private function sendUsingGammuCli(string $phone, string $message): array
    {
        // Requires Gammu installed and configured on the server.
        // Test first in terminal: gammu sendsms TEXT +639XXXXXXXXX -text "Test"
        $cmd = sprintf(
            'gammu sendsms TEXT %s -text %s 2>&1',
            escapeshellarg($phone),
            escapeshellarg($message)
        );
        exec($cmd, $output, $exitCode);
        $raw = implode("\n", $output);

        return [
            'success' => $exitCode === 0,
            'provider_ref' => 'GAMMU-' . date('YmdHis'),
            'raw_response' => $raw,
        ];
    }
}
