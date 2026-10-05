<?php
require_once __DIR__.'/db_connection.php';
$db=dhan_db();$failures=[];
$teacher=$db->query("SELECT responsible_teacher_name,responsibility_source,credits FROM subjects WHERE code='NVCB2'")->fetch_assoc();
if (!$teacher || $teacher['responsible_teacher_name']!=='Thượng tá, TS. Đặng Bình Dương' || (int)$teacher['credits']!==2 || !$teacher['responsibility_source']) $failures[]='NVCB2 responsibility/credits';
$references=$db->query("SELECT c.chapter_number,f.original_name,f.storage_path,f.file_size,f.checksum_sha256 FROM chapters c JOIN subjects s ON s.id=c.subject_id JOIN chapter_materials cm ON cm.chapter_id=c.id JOIN files f ON f.id=cm.file_id WHERE s.code='TCDT_403' AND c.status='PUBLISHED' AND cm.is_visible=1 AND cm.material_group='REFERENCE' ORDER BY c.chapter_number")->fetch_all(MYSQLI_ASSOC);
if (array_map(fn($r)=>(int)$r['chapter_number'],$references)!==[2,3,4]) $failures[]='TCDT reference chapters';
foreach($references as $r){$path=dirname(__DIR__).'/'.$r['storage_path'];if(!is_file($path)||filesize($path)!==(int)$r['file_size']||hash_file('sha256',$path)!==$r['checksum_sha256'])$failures[]='Reference file integrity: '.$r['original_name'];}
$draft=$db->query('SELECT status FROM chapters WHERE id=12')->fetch_row();if(!$draft||$draft[0]!=='DRAFT')$failures[]='Original draft preservation';
$demo=(int)$db->query("SELECT COUNT(*) FROM files WHERE id IN (1,3,4,5,10,11,15,16) AND original_name LIKE 'Minh họa%'")->fetch_row()[0];if($demo!==8)$failures[]='Demo file labels';
$hidden=(int)$db->query('SELECT COUNT(*) FROM chapter_materials WHERE id IN (20,22,24,25) AND is_visible=0')->fetch_row()[0];if($hidden!==4)$failures[]='Hidden unrelated links';
$history=(int)$db->query("SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId='20261004000000_DbmsQualityAndCourseResponsibility'")->fetch_row()[0];if($history!==1)$failures[]='Maintenance migration history';
echo json_encode(['verifiedTeacher'=>$teacher,'references'=>$references,'demoFilesLabeled'=>$demo,'unrelatedLinksHidden'=>$hidden,'originalDraftPreserved'=>!in_array('Original draft preservation',$failures),'failures'=>$failures],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),"\n";
exit($failures?1:0);
