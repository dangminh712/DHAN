<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg';
$db   = 'training_management';
$port = 3307;

$mysqli = new mysqli($host, $user, $pass, $db, $port);
$mysqli->set_charset("utf8mb4");

$sql = "-- ====================================================================\n";
$sql .= "-- SEED DATA TOAN DIEN CHO TOAN BO 27 BANG training_management\n";
$sql .= "-- Mat khau mac dinh: T04@Security2026!\n";
$sql .= "-- Ngay cap nhat: 2026-09-09\n";
$sql .= "-- ====================================================================\n\n";
$sql .= "USE `training_management`;\nSET FOREIGN_KEY_CHECKS = 0;\n\n";

$tables = [
    'roles', 'permissions', 'role_permissions', 'classification_levels',
    'organizational_units', 'classes', 'subjects', 'users',
    'teacher_subjects', 'student_classes', 'user_clearance_levels',
    'files', 'file_versions', 'file_permissions', 'lectures',
    'lecture_files', 'lecture_permissions', 'watch_history',
    'learning_progress', 'download_logs', 'audit_logs', 'security_alerts',
    'user_sessions', 'user_mfa', 'notifications', 'retention_policies',
    'system_settings'
];

foreach ($tables as $t) {
    $res = $mysqli->query("SELECT * FROM `$t`");
    if (!$res || $res->num_rows == 0) continue;
    $sql .= "-- TABLE: $t ({$res->num_rows} records)\n";
    $fields = [];
    while ($f = $res->fetch_field()) {
        $fields[] = "`{$f->name}`";
    }
    $fList = implode(", ", $fields);

    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $vals = [];
        foreach ($row as $k => $v) {
            if ($v === null) {
                $vals[] = "NULL";
            } elseif (is_numeric($v)) {
                $vals[] = $v;
            } else {
                $vals[] = "'" . $mysqli->real_escape_string($v) . "'";
            }
        }
        $rows[] = "(" . implode(", ", $vals) . ")";
    }
    $sql .= "INSERT INTO `$t` ($fList) VALUES\n" . implode(",\n", $rows) . "\nON DUPLICATE KEY UPDATE `id`=`id`;\n\n";
}

$sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
file_put_contents(__DIR__ . '/seed_training_management.sql', $sql);
echo "Exported full seed SQL to server/seed_training_management.sql (" . strlen($sql) . " bytes)\n";
