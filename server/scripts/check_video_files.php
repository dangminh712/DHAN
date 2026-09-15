<?php
$m = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
$res = $m->query('SELECT id, original_name, stored_name, storage_path, file_size FROM files WHERE file_type = "VIDEO"');
while ($r = $res->fetch_assoc()) {
    echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}
