<?php
require_once __DIR__ . '/anialerto-backend/src/WeatherService.php';

echo "Testing WeatherService...\n";

// Replace with a valid API key in WeatherService.php before running this test.
$municipality = 'Mapandan, Pangasinan';
$rules = ['max_rain_mm' => 5.0, 'max_wind_kph' => 20];

$reason = "";
$isBad = WeatherService::isBadWeather($municipality, $rules, $reason);

echo "Municipality: $municipality\n";
echo "Is Bad Weather? " . ($isBad ? "YES" : "NO") . "\n";
if ($isBad) {
    echo "Reason: $reason\n";
} else {
    if ($reason === "Weather data unavailable.") {
        echo "Reason: $reason (Please check your API key or network connection)\n";
    } else {
        echo "Reason: Weather is clear/acceptable.\n";
    }
}
?>
