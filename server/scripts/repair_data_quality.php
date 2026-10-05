<?php
// Explicit maintenance operation. Back up the DB first. Preserves files and links; hiding is reversible.
require_once __DIR__ . '/db_connection.php';
$apply = in_array('--apply', $argv, true);
$backup = $argv[2] ?? '';
if ($apply && (!is_file($backup) || filesize($backup) < 1024)) throw new RuntimeException('A verified database backup path is required after --apply.');
$db = dhan_db();
$root = dirname(__DIR__, 2);
$references = [
    ['number'=>2,'title'=>'Quản trị rủi ro và bảo vệ không gian mạng','file'=>'NIST.CSWP.29.pdf','name'=>'Tham khảo công khai - NIST Cybersecurity Framework 2.0.pdf','source'=>'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf','note'=>'NIST CSF 2.0, 2024; tài liệu tham khảo tiếng Anh về quản trị rủi ro an toàn thông tin, không thay thế giáo trình nghiệp vụ được phê duyệt.'],
    ['number'=>3,'title'=>'Quản lý và ứng phó sự cố an toàn thông tin','file'=>'NIST.SP.800-61r3.pdf','name'=>'Tham khảo công khai - NIST SP 800-61 Rev.3.pdf','source'=>'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf','note'=>'NIST SP 800-61 Rev.3, 2025; đọc tham khảo về chuẩn bị, phát hiện, ứng phó và phục hồi sự cố.'],
    ['number'=>4,'title'=>'Cơ sở tín hiệu và hệ thống','file'=>'MIT6_01SCS11_chap05.pdf','name'=>'Tham khảo công khai - MIT Signals and Systems Chapter 5.pdf','source'=>'https://ocw.mit.edu/courses/6-01sc-introduction-to-electrical-engineering-and-computer-science-i-spring-2011/1268f3289b19d628e9be3bd2ecfb4f44_MIT6_01SCS11_chap05.pdf','note'=>'MIT OpenCourseWare 6.01SC, 2011, chương 5; kiến thức nền về tín hiệu và hệ thống. Giữ nguyên tài liệu và nguồn tác giả, giấy phép CC BY-NC-SA của MIT OCW.'],
];
foreach ($references as &$ref) {
    $ref['path']='Storage/courses/TCDT_403/references/'.$ref['file'];
    $full=$root.'/server/'.$ref['path'];
    if (!is_file($full) || file_get_contents($full,false,null,0,5)!=='%PDF-') throw new RuntimeException('Reference file absent or invalid: '.$ref['file']);
    $ref['bytes']=filesize($full);$ref['checksum']=hash_file('sha256',$full);
}
unset($ref);
if (!$apply) { echo json_encode(['mode'=>'check','references'=>$references,'changes'=>'Responsible teacher and credits from NVCB2 plan; correct demo names; hide unrelated links; add 4 indexes and responsibility columns'],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),"\n";exit; }

// MySQL DDL commits separately. Each operation is idempotent so an interrupted run can resume.
foreach (['responsible_teacher_name'=>'varchar(255)','responsibility_source'=>'varchar(1000)'] as $column=>$type) {
    $stmt=$db->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=\'subjects\' AND COLUMN_NAME=?');$stmt->bind_param('s',$column);$stmt->execute();
    if (!(int)$stmt->get_result()->fetch_row()[0]) $db->query("ALTER TABLE subjects ADD COLUMN `$column` $type NULL");
}
$maxStatus=(int)$db->query('SELECT COALESCE(MAX(CHAR_LENGTH(status)),0) FROM chapters')->fetch_row()[0];
if ($maxStatus>32) throw new RuntimeException('Chapter status exceeds 32 characters; manual review required.');
$db->query('ALTER TABLE chapters MODIFY status varchar(32) NOT NULL');
$indexes=[
    ['audit_logs','IX_audit_logs_created_at_id','created_at,id'],
    ['security_alerts','IX_security_alerts_created_at_id','created_at,id'],
    ['user_sessions','IX_user_sessions_last_activity_at_id','last_activity_at,id'],
    ['chapters','IX_chapters_published_order','subject_id,status,deleted_at,display_order,chapter_number'],
];
foreach ($indexes as [$table,$name,$columns]) {
    $stmt=$db->prepare('SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?');$stmt->bind_param('ss',$table,$name);$stmt->execute();
    if (!(int)$stmt->get_result()->fetch_row()[0]) $db->query("CREATE INDEX `$name` ON `$table` ($columns)");
}
$names=[
    1=>'Minh họa định dạng PDF - Giáo trình mẫu.pdf',
    3=>'Minh họa định dạng SVG - Bài giảng mẫu.svg',
    4=>'Minh họa định dạng PDF - Đề cương mẫu.pdf',
    5=>'Minh họa định dạng PDF - Bài giảng mẫu.pdf',
    10=>'Minh họa định dạng SVG - Bài giảng mẫu.svg',
    11=>'Minh họa - Chiến thuật trinh sát thực địa và bảo vệ mục tiêu.pdf',
    15=>'Minh họa - Khám nghiệm dấu vết kỹ thuật số.pdf',
    16=>'Minh họa định dạng SVG - Bài giảng mẫu.svg',
];
$before = [
    'subjects'=>$db->query("SELECT * FROM subjects WHERE code IN ('NVCB2','TCDT_403')")->fetch_all(MYSQLI_ASSOC),
    'files'=>$db->query('SELECT id,original_name,updated_at FROM files WHERE id IN (1,3,4,5,10,11,15,16)')->fetch_all(MYSQLI_ASSOC),
    'links'=>$db->query('SELECT * FROM chapter_materials WHERE file_id IN (1,3,4,5,10,11,15,16) OR id IN (20,22,24,25)')->fetch_all(MYSQLI_ASSOC),
    'chapters'=>$db->query("SELECT c.* FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE s.code='TCDT_403'")->fetch_all(MYSQLI_ASSOC),
];
$out=$root.'/docs/audits/2026-10-04-data-repair.json';
if (!is_file($out)) file_put_contents($out,json_encode(['before'=>$before,'backup'=>$backup,'references'=>$references],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n");
$db->begin_transaction();
try {
    $db->query("UPDATE subjects SET responsible_teacher_name='Thượng tá, TS. Đặng Bình Dương', responsibility_source='Kế hoạch giảng dạy HP NVCB2 — TAP3/1. KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf, trang 6 (phụ trách); trang 1 (2 tín chỉ).', credits=2, updated_at=NOW() WHERE code='NVCB2'");
    foreach ($names as $id=>$name) {
        $stmt=$db->prepare('UPDATE files SET original_name=?,updated_at=NOW() WHERE id=? AND deleted_at IS NULL');$stmt->bind_param('si',$name,$id);$stmt->execute();
    }
    $db->query("UPDATE chapter_materials SET material_group='OTHER',updated_at=NOW() WHERE file_id IN (1,3,4,5,10,11,15,16)");
    $db->query('UPDATE chapter_materials SET is_visible=0,updated_at=NOW() WHERE id IN (20,22,24,25)');
    // Restore the original draft if an earlier interrupted/initial repair repurposed it.
    $original=json_decode(file_get_contents($out),true,512,JSON_THROW_ON_ERROR)['before']['chapters'];
    foreach ($original as $chapterBefore) {
        if ($chapterBefore['status'] !== 'DRAFT') continue;
        $stmt=$db->prepare('UPDATE chapters SET title=?,description=?,status=?,display_order=?,updated_at=NOW() WHERE id=? AND description LIKE \'NIST CSF 2.0%\'');
        $stmt->bind_param('sssii',$chapterBefore['title'],$chapterBefore['description'],$chapterBefore['status'],$chapterBefore['display_order'],$chapterBefore['id']);$stmt->execute();
    }
    $course=(int)$db->query("SELECT id FROM subjects WHERE code='TCDT_403'")->fetch_row()[0];
    $classification=(int)$db->query('SELECT id FROM classification_levels WHERE level_order=1 ORDER BY id LIMIT 1')->fetch_row()[0];
    if (!$course || !$classification) throw new RuntimeException('Missing course or public classification');
    foreach ($references as $ref) {
        $stmt=$db->prepare('SELECT title FROM chapters WHERE subject_id=? AND chapter_number=?');$stmt->bind_param('ii',$course,$ref['number']);$stmt->execute();$existing=$stmt->get_result()->fetch_assoc();
        if ($existing && $existing['title']!==$ref['title']) throw new RuntimeException('Reference chapter number already used by another topic; manual review required.');
        $description=$ref['note'].' Nguồn: '.$ref['source'];
        $stmt=$db->prepare("INSERT INTO chapters(subject_id,chapter_number,title,description,display_order,status,created_at,updated_at) VALUES(?,?,?,?,?,'PUBLISHED',NOW(),NOW()) ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),status='PUBLISHED',updated_at=NOW()");
        $stmt->bind_param('iissi',$course,$ref['number'],$ref['title'],$description,$ref['number']);$stmt->execute();
        $chapter=(int)$db->query("SELECT id FROM chapters WHERE subject_id=$course AND chapter_number={$ref['number']}")->fetch_row()[0];
        $stmt=$db->prepare("INSERT INTO files(original_name,stored_name,mime_type,extension,file_type,file_size,storage_path,checksum_sha256,classification_level_id,uploaded_by,status,created_at,updated_at) VALUES(?,?,'application/pdf','.pdf','PDF',?,?,?,?,1,'ACTIVE',NOW(),NOW()) ON DUPLICATE KEY UPDATE original_name=VALUES(original_name),file_size=VALUES(file_size),checksum_sha256=VALUES(checksum_sha256),updated_at=NOW()");
        $stored='tcdt403-'.$ref['file'];
        $stmt->bind_param('ssissi',$ref['name'],$stored,$ref['bytes'],$ref['path'],$ref['checksum'],$classification);$stmt->execute();
        $stmt=$db->prepare('SELECT id FROM files WHERE stored_name=?');$stmt->bind_param('s',$stored);$stmt->execute();$file=(int)$stmt->get_result()->fetch_row()[0];
        $stmt=$db->prepare("INSERT INTO chapter_materials(chapter_id,file_id,material_group,display_order,is_visible,is_downloadable,is_printable,created_at,updated_at) VALUES(?,?,'REFERENCE',1,1,1,1,NOW(),NOW()) ON DUPLICATE KEY UPDATE is_visible=1,material_group='REFERENCE',updated_at=NOW()");$stmt->bind_param('ii',$chapter,$file);$stmt->execute();
        $stmt=$db->prepare("INSERT INTO file_versions(file_id,version,stored_name,storage_path,checksum_sha256,uploaded_by,change_note,created_at) SELECT ?,1,?,?,?,1,?,NOW() WHERE NOT EXISTS(SELECT 1 FROM file_versions WHERE file_id=? AND version=1)");
        $stmt->bind_param('issssi',$file,$stored,$ref['path'],$ref['checksum'],$description,$file);$stmt->execute();
    }
    $db->query("UPDATE subjects SET description='Học liệu tham khảo công khai về quản trị rủi ro, ứng phó sự cố và cơ sở tín hiệu. Nguồn NIST/MIT; không thay thế giáo trình nghiệp vụ được phê duyệt.',updated_at=NOW() WHERE id=$course");
    $payload=json_encode(['operation'=>'DATA_QUALITY_REPAIR','teacher'=>'Đặng Bình Dương','sourcePage'=>6,'hiddenLinks'=>[20,22,24,25],'demoFileIds'=>array_keys($names),'references'=>array_column($references,'source')],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    $stmt=$db->prepare("INSERT INTO audit_logs(user_id,action,entity_type,new_value,created_at) VALUES(1,'DATA_QUALITY_REPAIR','COURSE',?,NOW())");$stmt->bind_param('s',$payload);$stmt->execute();
    // Adopt only this maintenance migration after proving its exact schema operations are present.
    foreach (['responsible_teacher_name'=>'varchar(255)','responsibility_source'=>'varchar(1000)'] as $column=>$expectedType) {
        $stmt=$db->prepare("SELECT COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='subjects' AND COLUMN_NAME=?");$stmt->bind_param('s',$column);$stmt->execute();$actual=$stmt->get_result()->fetch_assoc();
        if (!$actual || $actual['COLUMN_TYPE']!==$expectedType || $actual['IS_NULLABLE']!=='YES') throw new RuntimeException('Responsibility column differs from migration: '.$column);
    }
    foreach ($indexes as [$table,$name,$columns]) {
        $stmt=$db->prepare('SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list,MAX(NON_UNIQUE) AS non_unique FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?');$stmt->bind_param('ss',$table,$name);$stmt->execute();$actual=$stmt->get_result()->fetch_assoc();
        if ($actual['columns_list']!==$columns || (int)$actual['non_unique']!==1) throw new RuntimeException('Index differs from migration: '.$name);
    }
    $status=$db->query("SELECT COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='chapters' AND COLUMN_NAME='status'")->fetch_assoc();
    if ($status['COLUMN_TYPE']!=='varchar(32)' || $status['IS_NULLABLE']!=='NO') throw new RuntimeException('Chapter status differs from migration.');
    $db->query("INSERT IGNORE INTO __EFMigrationsHistory(MigrationId,ProductVersion) VALUES('20261004000000_DbmsQualityAndCourseResponsibility','8.0.13')");
    $db->commit();
    echo "Data repair committed. Original files and hidden link records preserved.\n";
} catch (Throwable $error) { $db->rollback(); throw $error; }
