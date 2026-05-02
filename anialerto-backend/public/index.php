<?php
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Helpers.php';
require_once __DIR__ . '/../src/SmsGateway.php';

$config = require __DIR__ . '/../config/config.php';
header('Access-Control-Allow-Origin: ' . $config['CORS_ORIGIN']);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';
$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$resource = $parts[0] ?? '';
$id = isset($parts[1]) ? (int)$parts[1] : null;

try {
    switch ($resource) {
        case 'auth':
            if (($parts[1] ?? '') === 'login' && $method === 'POST') {
                $body = read_json_body();
                require_fields($body, ['username', 'password']);
                $stmt = $pdo->prepare('SELECT id, username, password_hash, full_name, role FROM admins WHERE username = ? LIMIT 1');
                $stmt->execute([$body['username']]);
                $admin = $stmt->fetch();
                if (!$admin || !password_verify($body['password'], $admin['password_hash'])) {
                    Response::error('Invalid username or password', 401);
                }
                unset($admin['password_hash']);
                Response::json(['message' => 'Login successful', 'admin' => $admin]);
            }
            break;

        case 'dashboard':
            if ($method === 'GET') {
                $stats = [
                    'active_batches' => (int)$pdo->query("SELECT COUNT(*) FROM farm_batches WHERE status = 'Active'")->fetchColumn(),
                    'active_workers' => (int)$pdo->query("SELECT COUNT(*) FROM workers WHERE status = 'Active'")->fetchColumn(),
                    'queued_sms' => (int)$pdo->query("SELECT COUNT(*) FROM sms_queue WHERE status = 'Queued'")->fetchColumn(),
                    'sent_today' => (int)$pdo->query("SELECT COUNT(*) FROM sms_logs WHERE DATE(sent_at) = CURDATE()")->fetchColumn(),
                    'pending_tasks' => (int)$pdo->query("SELECT COUNT(*) FROM scheduled_tasks WHERE status = 'Pending'")->fetchColumn(),
                    'delayed_tasks' => (int)$pdo->query("SELECT COUNT(*) FROM scheduled_tasks WHERE status = 'Delayed'")->fetchColumn(),
                ];
                Response::json($stats);
            }
            break;

        case 'batches':
            handleBatches($pdo, $method, $id);
            break;

        case 'workers':
            handleWorkers($pdo, $method, $id);
            break;

        case 'templates':
            handleTemplates($pdo, $method, $id);
            break;

        case 'commands':
            handleCommands($pdo, $method, $id);
            break;

        case 'sms-logs':
            if ($method === 'GET') {
                $stmt = $pdo->query(
                    "SELECT sl.*, w.name AS worker_name, fb.name AS batch_name
                     FROM sms_logs sl
                     LEFT JOIN workers w ON w.id = sl.worker_id
                     LEFT JOIN scheduled_tasks st ON st.id = sl.task_id
                     LEFT JOIN farm_batches fb ON fb.id = st.batch_id
                     ORDER BY sl.created_at DESC LIMIT 200"
                );
                Response::json($stmt->fetchAll());
            }
            break;

        case 'manual-sms':
            if ($method === 'POST') {
                $body = read_json_body();
                require_fields($body, ['phone', 'message']);
                $phone = normalize_phone($body['phone']);
                $stmt = $pdo->prepare(
                    "INSERT INTO sms_queue (phone, message, status, attempts, created_at)
                     VALUES (?, ?, 'Queued', 0, NOW())"
                );
                $stmt->execute([$phone, $body['message']]);
                Response::json(['message' => 'SMS queued successfully', 'queue_id' => (int)$pdo->lastInsertId()], 201);
            }
            break;
    }

    Response::error('Route not found', 404);
} catch (Throwable $e) {
    Response::error('Server error', 500, ['details' => $e->getMessage()]);
}

function handleBatches(PDO $pdo, string $method, ?int $id): void
{
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM farm_batches WHERE id = ?');
            $stmt->execute([$id]);
            Response::json($stmt->fetch() ?: []);
        }
        Response::json($pdo->query('SELECT * FROM farm_batches ORDER BY created_at DESC')->fetchAll());
    }

    if ($method === 'POST') {
        $b = read_json_body();
        require_fields($b, ['name', 'location', 'planting_date', 'area', 'variety', 'status']);
        $stmt = $pdo->prepare(
            'INSERT INTO farm_batches (name, location, planting_date, area, variety, status, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$b['name'], $b['location'], $b['planting_date'], $b['area'], $b['variety'], $b['status'], $b['notes'] ?? null]);
        Response::json(['id' => (int)$pdo->lastInsertId(), 'message' => 'Batch created'], 201);
    }

    if ($method === 'PUT' && $id) {
        $b = read_json_body();
        $stmt = $pdo->prepare(
            'UPDATE farm_batches SET name=?, location=?, planting_date=?, area=?, variety=?, status=?, notes=?, updated_at=NOW() WHERE id=?'
        );
        $stmt->execute([$b['name'], $b['location'], $b['planting_date'], $b['area'], $b['variety'], $b['status'], $b['notes'] ?? null, $id]);
        Response::json(['message' => 'Batch updated']);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare('DELETE FROM farm_batches WHERE id=?');
        $stmt->execute([$id]);
        Response::json(['message' => 'Batch deleted']);
    }
}

function handleWorkers(PDO $pdo, string $method, ?int $id): void
{
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM workers WHERE id = ?');
            $stmt->execute([$id]);
            Response::json($stmt->fetch() ?: []);
        }
        Response::json($pdo->query('SELECT * FROM workers ORDER BY created_at DESC')->fetchAll());
    }

    if ($method === 'POST') {
        $w = read_json_body();
        require_fields($w, ['name', 'phone', 'status']);
        $phone = normalize_phone($w['phone']);
        $stmt = $pdo->prepare(
            'INSERT INTO workers (name, phone, email, address, status, date_joined, emergency_contact, emergency_phone, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $w['name'], $phone, $w['email'] ?? null, $w['address'] ?? null, $w['status'],
            $w['date_joined'] ?? date('Y-m-d'), $w['emergency_contact'] ?? null, $w['emergency_phone'] ?? null
        ]);
        $workerId = (int)$pdo->lastInsertId();
        if (!empty($w['batch_id'])) {
            $link = $pdo->prepare('INSERT IGNORE INTO batch_workers (batch_id, worker_id, created_at) VALUES (?, ?, NOW())');
            $link->execute([(int)$w['batch_id'], $workerId]);
        }
        Response::json(['id' => $workerId, 'message' => 'Worker created'], 201);
    }

    if ($method === 'PUT' && $id) {
        $w = read_json_body();
        $phone = normalize_phone($w['phone']);
        $stmt = $pdo->prepare(
            'UPDATE workers SET name=?, phone=?, email=?, address=?, status=?, emergency_contact=?, emergency_phone=?, updated_at=NOW() WHERE id=?'
        );
        $stmt->execute([$w['name'], $phone, $w['email'] ?? null, $w['address'] ?? null, $w['status'], $w['emergency_contact'] ?? null, $w['emergency_phone'] ?? null, $id]);
        Response::json(['message' => 'Worker updated']);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare('DELETE FROM workers WHERE id=?');
        $stmt->execute([$id]);
        Response::json(['message' => 'Worker deleted']);
    }
}

function handleTemplates(PDO $pdo, string $method, ?int $id): void
{
    if ($method === 'GET') {
        Response::json($pdo->query('SELECT * FROM message_templates ORDER BY days_after_planting ASC')->fetchAll());
    }

    if ($method === 'POST') {
        $t = read_json_body();
        require_fields($t, ['name', 'category', 'message', 'days_after_planting']);
        $stmt = $pdo->prepare(
            'INSERT INTO message_templates (name, category, message, trigger_type, days_after_planting, expected_responses, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $t['name'], $t['category'], $t['message'], $t['trigger_type'] ?? 'days_after_planting',
            (int)$t['days_after_planting'], json_encode($t['expected_responses'] ?? []), !empty($t['active']) ? 1 : 0
        ]);
        Response::json(['id' => (int)$pdo->lastInsertId(), 'message' => 'Template created'], 201);
    }

    if ($method === 'PUT' && $id) {
        $t = read_json_body();
        $stmt = $pdo->prepare(
            'UPDATE message_templates SET name=?, category=?, message=?, trigger_type=?, days_after_planting=?, expected_responses=?, active=?, updated_at=NOW() WHERE id=?'
        );
        $stmt->execute([
            $t['name'], $t['category'], $t['message'], $t['trigger_type'] ?? 'days_after_planting',
            (int)$t['days_after_planting'], json_encode($t['expected_responses'] ?? []), !empty($t['active']) ? 1 : 0, $id
        ]);
        Response::json(['message' => 'Template updated']);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare('DELETE FROM message_templates WHERE id=?');
        $stmt->execute([$id]);
        Response::json(['message' => 'Template deleted']);
    }
}

function handleCommands(PDO $pdo, string $method, ?int $id): void
{
    if ($method === 'GET') {
        Response::json($pdo->query('SELECT * FROM command_responses ORDER BY command ASC')->fetchAll());
    }

    if ($method === 'POST') {
        $c = read_json_body();
        require_fields($c, ['command', 'description', 'action']);
        $stmt = $pdo->prepare('INSERT INTO command_responses (command, description, color, action, created_at) VALUES (?, ?, ?, ?, NOW())');
        $stmt->execute([strtoupper($c['command']), $c['description'], $c['color'] ?? 'blue', $c['action']]);
        Response::json(['id' => (int)$pdo->lastInsertId(), 'message' => 'Command response created'], 201);
    }

    if ($method === 'PUT' && $id) {
        $c = read_json_body();
        $stmt = $pdo->prepare('UPDATE command_responses SET command=?, description=?, color=?, action=?, updated_at=NOW() WHERE id=?');
        $stmt->execute([strtoupper($c['command']), $c['description'], $c['color'] ?? 'blue', $c['action'], $id]);
        Response::json(['message' => 'Command response updated']);
    }

    if ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare('DELETE FROM command_responses WHERE id=?');
        $stmt->execute([$id]);
        Response::json(['message' => 'Command response deleted']);
    }
}
