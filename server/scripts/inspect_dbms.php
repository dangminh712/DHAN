<?php
require_once __DIR__ . '/db_connection.php';
$db = dhan_db();
function rows(mysqli $db, string $sql): array { return $db->query($sql)->fetch_all(MYSQLI_ASSOC); }
$report = [];
$report['server'] = rows($db, 'SELECT VERSION() AS version, DATABASE() AS database_name')[0];
$report['tables'] = rows($db, "SELECT TABLE_NAME AS table_name, ENGINE AS engine, TABLE_ROWS AS estimated_rows, DATA_LENGTH AS data_bytes, INDEX_LENGTH AS index_bytes, DATA_FREE AS free_bytes FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
$report['indexes'] = rows($db, 'SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() GROUP BY TABLE_NAME,INDEX_NAME,NON_UNIQUE ORDER BY TABLE_NAME,INDEX_NAME');
$report['foreignKeys'] = rows($db, 'SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, REFERENCED_TABLE_NAME AS referenced_table, REFERENCED_COLUMN_NAME AS referenced_column, CONSTRAINT_NAME AS constraint_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
$report['orphans'] = [];
foreach ($report['foreignKeys'] as $fk) {
    $quote = fn($name) => '`' . str_replace('`', '``', $name) . '`';
    $t=$quote($fk['table_name']); $c=$quote($fk['column_name']); $r=$quote($fk['referenced_table']); $rc=$quote($fk['referenced_column']);
    $n = (int)rows($db,"SELECT COUNT(*) AS n FROM $t a LEFT JOIN $r b ON a.$c=b.$rc WHERE a.$c IS NOT NULL AND b.$rc IS NULL")[0]['n'];
    if ($n) $report['orphans'][] = ['constraint'=>$fk['constraint_name'], 'rows'=>$n];
}
$report['courses'] = rows($db, "SELECT s.id,s.code,s.name,c.id AS chapter_id,c.chapter_number,c.title,c.status,COUNT(cm.id) AS material_count FROM subjects s LEFT JOIN chapters c ON c.subject_id=s.id AND c.deleted_at IS NULL LEFT JOIN chapter_materials cm ON cm.chapter_id=c.id GROUP BY s.id,s.code,s.name,c.id,c.chapter_number,c.title,c.status ORDER BY s.code,c.chapter_number");
$report['teachers'] = rows($db, "SELECT s.code,u.id AS teacher_id,u.full_name,u.username,l.title AS lecture_title,l.subject_id FROM subjects s LEFT JOIN lectures l ON l.subject_id=s.id AND l.deleted_at IS NULL LEFT JOIN users u ON u.id=l.teacher_id WHERE s.code IN ('NVCB2','TCDT_403')");
$report['tinyFiles'] = rows($db, "SELECT f.id,f.original_name,f.storage_path,f.file_size,f.mime_type,f.checksum_sha256,f.status FROM files f WHERE f.file_size < 2048 AND f.deleted_at IS NULL");
$report['materialLinks'] = rows($db, "SELECT cm.id,cm.chapter_id,cm.file_id,cm.material_group,cm.is_visible,s.code,c.title,f.original_name,f.storage_path FROM chapter_materials cm JOIN chapters c ON c.id=cm.chapter_id JOIN subjects s ON s.id=c.subject_id JOIN files f ON f.id=cm.file_id WHERE s.code<>'NVCB2' ORDER BY s.code,cm.id");
$report['fileTotals'] = rows($db, 'SELECT COUNT(*) AS files, SUM(file_size) AS metadata_bytes FROM files WHERE deleted_at IS NULL')[0];
$report['queries'] = [];
foreach (['chapters' => "SELECT * FROM chapters WHERE subject_id=9 AND status='PUBLISHED' AND deleted_at IS NULL ORDER BY display_order,chapter_number", 'audit' => 'SELECT id,action,entity_type,created_at FROM audit_logs ORDER BY created_at DESC,id DESC LIMIT 20', 'sessions' => 'SELECT id,user_id,expires_at FROM user_sessions WHERE expires_at>NOW() ORDER BY last_activity_at DESC,id LIMIT 20'] as $name=>$sql) {
    $report['queries'][$name] = rows($db, 'EXPLAIN ' . $sql);
}
$path=$argv[1] ?? dirname(__DIR__,2).'/docs/audits/2026-10-04-dbms-inspection.json';
file_put_contents($path,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n");
echo json_encode(['tables'=>count($report['tables']),'indexes'=>count($report['indexes']),'foreignKeys'=>count($report['foreignKeys']),'orphans'=>$report['orphans'],'databaseBytes'=>array_sum(array_column($report['tables'],'data_bytes'))+array_sum(array_column($report['tables'],'index_bytes')),'fileTotals'=>$report['fileTotals'],'queries'=>$report['queries'],'teachers'=>$report['teachers']],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),"\n";
