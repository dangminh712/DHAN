<?php
$mysqli = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
if ($mysqli->connect_error) {
    die("Connect error: " . $mysqli->connect_error . "\n");
}
$res = $mysqli->query('SHOW TABLES');
echo "=== TABLES IN training_management ===\n";
while ($row = $res->fetch_row()) {
    echo "- " . $row[0] . "\n";
}
