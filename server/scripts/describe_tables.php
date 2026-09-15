<?php
$mysqli = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
function descTable($mysqli, $table) {
    echo "=== DESCRIBE $table ===\n";
    $res = $mysqli->query("DESCRIBE $table");
    if (!$res) { echo "Error: " . $mysqli->error . "\n"; return; }
    while ($r = $res->fetch_assoc()) {
        echo sprintf("%-25s %-20s %-5s %-5s %s\n", $r['Field'], $r['Type'], $r['Null'], $r['Key'], $r['Default'] ?? 'NULL');
    }
}

descTable($mysqli, 'lectures');
descTable($mysqli, 'lecture_files');
descTable($mysqli, 'lecture_parts');
descTable($mysqli, 'quiz_questions');
descTable($mysqli, 'quiz_attempts');
