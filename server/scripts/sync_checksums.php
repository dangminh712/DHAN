<?php
$host = '127.0.0.1'; $user = 'root'; $pass = '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg'; $db = 'training_management'; $port = 3307;
$mysqli = new mysqli($host, $user, $pass, $db, $port);
$storageRoot = realpath(__DIR__ . '/../Storage');
$res = $mysqli->query('SELECT id, storage_path FROM files');
$updated = 0;
while ($row = $res->fetch_assoc()) {
    $rel = $row['storage_path'];
    $norm = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rel);
    if (stripos($norm, 'Storage' . DIRECTORY_SEPARATOR) === 0) {
        $norm = substr($norm, strlen('Storage' . DIRECTORY_SEPARATOR));
    }
    $full = $storageRoot . DIRECTORY_SEPARATOR . $norm;
    if (file_exists($full)) {
        $size = filesize($full);
        $hash = hash_file('sha256', $full);
        $mysqli->query("UPDATE files SET file_size = $size, checksum_sha256 = '" . $mysqli->real_escape_string($hash) . "' WHERE id = {$row['id']}");
        $mysqli->query("UPDATE file_versions SET checksum_sha256 = '" . $mysqli->real_escape_string($hash) . "' WHERE file_id = {$row['id']}");
        $updated++;
    }
}
echo "Synced exact size & sha256 for $updated files.\n";
