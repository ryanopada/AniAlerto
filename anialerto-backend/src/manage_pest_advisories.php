<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'Database.php';

try {
    $db = Database::getInstance();
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'create' || $action === 'update') {
        $id = $data['id'] ?? null;
        $option_number = $data['option_number'] ?? null;
        $pest_name = $data['pest_name'] ?? '';
        $advisory_en = $data['advisory_en'] ?? '';
        $advisory_tl = $data['advisory_tl'] ?? '';
        $is_active = $data['is_active'] ?? 1;

        if (!$option_number || !$pest_name || !$advisory_en || !$advisory_tl) {
            throw new Exception("Missing required fields.");
        }

        if ($action === 'create') {
            $stmt = $db->prepare("INSERT INTO pest_advisories (option_number, pest_name, advisory_en, advisory_tl, is_active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$option_number, $pest_name, $advisory_en, $advisory_tl, $is_active]);
        } else {
            $stmt = $db->prepare("UPDATE pest_advisories SET option_number=?, pest_name=?, advisory_en=?, advisory_tl=?, is_active=? WHERE id=?");
            $stmt->execute([$option_number, $pest_name, $advisory_en, $advisory_tl, $is_active, $id]);
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Pest advisory saved successfully.']);
    } else if ($action === 'toggle') {
        $id = $data['id'] ?? null;
        $is_active = $data['is_active'] ?? 0;
        
        $stmt = $db->prepare("UPDATE pest_advisories SET is_active=? WHERE id=?");
        $stmt->execute([$is_active, $id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Pest advisory status updated.']);
    } else {
        throw new Exception("Invalid action.");
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
