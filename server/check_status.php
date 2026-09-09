<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg';
$db   = 'training_management';
$port = 3307;

$mysqli = new mysqli($host, $user, $pass, $db, $port);
if ($mysqli->connect_error) {
    die("Connect Error: " . $mysqli->connect_error . "\n");
}

echo "=== DANH SACH 27 BANG TRONG TRAINING_MANAGEMENT ===\n";
$res = $mysqli->query("SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = 'training_management' ORDER BY TABLE_NAME");
$tables = [];
while ($row = $res->fetch_array()) {
    $tables[] = $row[0];
}

foreach ($tables as $t) {
    $cntRes = $mysqli->query("SELECT COUNT(*) as c FROM `$t`");
    $cnt = $cntRes ? $cntRes->fetch_assoc()['c'] : 0;
    printf("%-25s : %d ban ghi\n", $t, $cnt);
}
