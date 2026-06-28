<?php
$dateFilter = 'custom';
$dateFrom = '2026-06-12';
$dateTo = '2026-06-28';
$search = '';
$where  = \"sl.direction = 'Outbound' AND sl.sent_at IS NOT NULL AND sl.message NOT LIKE 'Reminder!%'\";
$params = [];
switch ($dateFilter) {
    case 'custom':
        if ($dateFrom) { $where .= \" AND DATE(sl.created_at) >= ?\"; $params[] = $dateFrom; }
        if ($dateTo)   { $where .= \" AND DATE(sl.created_at) <= ?\"; $params[] = $dateTo;   }
        break;
}
if ($search !== '') {
    $like = '%' . $search . '%';
    $where .= \" AND (sl.phone LIKE ? OR sl.message LIKE ?)\";
    $params[] = $like; $params[] = $like;
}
echo $where . \"\n\";
print_r($params);
?>
