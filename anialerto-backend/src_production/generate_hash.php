<?php
// A simple utility script to generate bcrypt password hashes for phpMyAdmin
$password = $_GET['password'] ?? '';

if (empty($password)) {
    echo "<h1>Password Hash Generator</h1>";
    echo "<form method='GET'>";
    echo "<input type='text' name='password' placeholder='Enter password to hash' required style='padding: 8px; width: 300px;'>";
    echo "<button type='submit' style='padding: 8px 16px;'>Generate Hash</button>";
    echo "</form>";
    echo "<p>Type a password above to generate a secure Bcrypt hash for phpMyAdmin.</p>";
} else {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    echo "<h1>Hash Generated!</h1>";
    echo "<p><strong>Password:</strong> " . htmlspecialchars($password) . "</p>";
    echo "<p><strong>Copy this hash into phpMyAdmin's <code>password_hash</code> column:</strong></p>";
    echo "<textarea readonly style='width: 100%; height: 50px; font-family: monospace;'>" . htmlspecialchars($hash) . "</textarea>";
    echo "<br><br><a href='generate_hash.php'>Generate another</a>";
}
?>
