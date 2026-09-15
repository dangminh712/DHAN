<?php
$host = '127.0.0.1'; $user = 'root'; $pass = '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg'; $db = 'training_management'; $port = 3307;
$mysqli = new mysqli($host, $user, $pass, $db, $port);
$res = $mysqli->query('SELECT id, original_name, storage_path, mime_type, file_size FROM files');
$storageRoot = realpath(__DIR__ . '/../Storage');
echo "Storage root: $storageRoot\n";
while ($row = $res->fetch_assoc()) {
    $rel = $row['storage_path'];
    $norm = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
    if (stripos($norm, 'Storage' . DIRECTORY_SEPARATOR) === 0) {
        $norm = substr($norm, strlen('Storage' . DIRECTORY_SEPARATOR));
    }
    $full = $storageRoot . DIRECTORY_SEPARATOR . $norm;
    $exists = file_exists($full) ? 'EXISTS (' . filesize($full) . 'b)' : 'MISSING';
    echo "ID {$row['id']}: {$row['original_name']} -> {$row['storage_path']} -> $exists\n";
}
