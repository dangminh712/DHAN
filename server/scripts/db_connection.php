<?php
// Reuse local configuration without duplicating credentials in maintenance scripts.
function dhan_db(): mysqli {
    $config = json_decode(file_get_contents(dirname(__DIR__) . '/appsettings.json'), true, 512, JSON_THROW_ON_ERROR);
    $connection = getenv('ConnectionStrings__DefaultConnection') ?: $config['ConnectionStrings']['DefaultConnection'];
    $parts = [];
    foreach (explode(';', $connection) as $entry) {
        if (str_contains($entry, '=')) { [$key, $value] = explode('=', $entry, 2); $parts[strtolower(trim($key))] = trim($value); }
    }
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli($parts['server'] ?? '127.0.0.1', $parts['user'] ?? $parts['user id'] ?? '', $parts['password'] ?? '', $parts['database'], (int)($parts['port'] ?? 3306));
    $db->set_charset('utf8mb4');
    return $db;
}
