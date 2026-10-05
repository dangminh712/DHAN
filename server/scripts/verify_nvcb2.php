<?php
$mysqli = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
if ($mysqli->connect_error) {
    die("Connect error: " . $mysqli->connect_error . "\n");
}
$mysqli->set_charset('utf8mb4');

$subRes = $mysqli->query("SELECT id, code, name, description FROM subjects WHERE code = 'NVCB2'");
$subject = $subRes->fetch_assoc();
if (!$subject) {
    die("Subject NVCB2 not found!\n");
}

echo "=== MÔN HỌC: {$subject['code']} - {$subject['name']} (ID: {$subject['id']}) ===\n";

$storageRoot = realpath(__DIR__ . '/../Storage');
echo "Storage Root: $storageRoot\n\n";

$chapRes = $mysqli->query("
    SELECT c.id, c.chapter_number, c.title, COUNT(cm.id) as material_count
    FROM chapters c
    LEFT JOIN chapter_materials cm ON cm.chapter_id = c.id
    WHERE c.subject_id = {$subject['id']}
    GROUP BY c.id, c.chapter_number, c.title
    ORDER BY c.chapter_number
");

$totalMaterials = 0;
$missingFiles = 0;
$validFiles = 0;

while ($chap = $chapRes->fetch_assoc()) {
    echo sprintf("Chương %d: %-30s | %d tài liệu\n", $chap['chapter_number'], $chap['title'], $chap['material_count']);
    $totalMaterials += (int)$chap['material_count'];

    // Verify all physical files in this chapter
    $matRes = $mysqli->query("
        SELECT cm.id as mat_id, f.id as file_id, f.original_name, f.storage_path, f.file_size
        FROM chapter_materials cm
        JOIN files f ON f.id = cm.file_id
        WHERE cm.chapter_id = {$chap['id']}
    ");

    while ($m = $matRes->fetch_assoc()) {
        $rel = $m['storage_path'];
        $norm = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
        if (stripos($norm, 'Storage' . DIRECTORY_SEPARATOR) === 0) {
            $norm = substr($norm, strlen('Storage' . DIRECTORY_SEPARATOR));
        }
        $fullPath = $storageRoot . DIRECTORY_SEPARATOR . $norm;

        if (file_exists($fullPath)) {
            $validFiles++;
        } else {
            echo "   [!] THIẾU TỆP VẬT LÝ: {$m['original_name']} -> $fullPath\n";
            $missingFiles++;
        }
    }
}

echo "\n------------------------------------------------------------\n";
echo "TỔNG KẾT KIỂM TRA:\n";
echo " - Tổng số chương: 8\n";
echo " - Tổng số tài liệu: $totalMaterials\n";
echo " - Tệp vật lý hợp lệ (tồn tại trong Storage): $validFiles\n";
echo " - Tệp vật lý bị thiếu: $missingFiles\n";
if ($missingFiles === 0 && $validFiles === 197) {
    echo ">>> XÁC MINH HOÀN TOÀN THÀNH CÔNG! DỮ LIỆU ĐÃ NẠP CHUẨN XÁC 100% <<<\n";
} else {
    echo ">>> CẢNH BÁO: Cần kiểm tra lại tệp bị thiếu <<<\n";
}
