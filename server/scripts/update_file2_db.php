<?php
$m = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
$m->query("UPDATE files SET file_size = 593061, checksum_sha256 = '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd' WHERE id = 2");
echo "Updated files table: affected = " . $m->affected_rows . "\n";
$res = $m->query("DESCRIBE file_versions");
while ($r = $res->fetch_assoc()) {
    echo $r['Field'] . "\n";
}
