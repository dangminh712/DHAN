<?php
$mysqli = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
if ($mysqli->connect_error) {
    fwrite(STDERR, "Không kết nối được MySQL: {$mysqli->connect_error}\n");
    exit(1);
}
$mysqli->set_charset('utf8mb4');

$mysqli->query("INSERT INTO subjects (code,name,description,organizational_unit_id,credits,status)
VALUES ('NVCB2','Nghiệp vụ cơ bản 2','Tìm bài giảng, giáo án, bài tập và tư liệu của môn học theo từng chương.',2,3.0,'ACTIVE')
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),name=VALUES(name),description=VALUES(description),status='ACTIVE'");
$subjectId = (int)$mysqli->insert_id;
if ($subjectId === 0) {
    $result = $mysqli->query("SELECT id FROM subjects WHERE code='NVCB2' LIMIT 1");
    $subjectId = (int)$result->fetch_assoc()['id'];
}

$chapters = [
    1 => ['Hồ sơ môn học', 'Thông tin tổng quan, hồ sơ pháp lý và yêu cầu của môn học.'],
    2 => ['Chương trình và đề cương', 'Chương trình đào tạo, đề cương chi tiết và chuẩn đầu ra.'],
    3 => ['Kế hoạch giảng dạy', 'Lịch trình, tiến độ và kế hoạch tổ chức giảng dạy.'],
    4 => ['Giáo án và bài giảng', 'Giáo án, bài giảng, slide và tài liệu trình chiếu.'],
    5 => ['Hoạt động học thuật', 'Seminar, thảo luận và hoạt động nghiên cứu của môn học.'],
    6 => ['Hệ thống bài tập', 'Bài tập lý thuyết, thực hành và tình huống nghiệp vụ.'],
    7 => ['Câu hỏi và đáp án', 'Ngân hàng câu hỏi, hướng dẫn và đáp án tham khảo.'],
    8 => ['Học liệu và tư liệu', 'Tài liệu tham khảo, hình ảnh, video và tư liệu bổ trợ.'],
];

$stmt = $mysqli->prepare("INSERT INTO chapters (subject_id,chapter_number,title,description,display_order,status,created_at,updated_at)
VALUES (?,?,?,?,?,'PUBLISHED',NOW(),NOW())
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),title=VALUES(title),description=VALUES(description),display_order=VALUES(display_order),status='PUBLISHED',updated_at=NOW()");
$chapterIds = [];
foreach ($chapters as $number => [$title, $description]) {
    $stmt->bind_param('iissi', $subjectId, $number, $title, $description, $number);
    $stmt->execute();
    $chapterIds[$number] = (int)$mysqli->insert_id;
    if ($chapterIds[$number] === 0) {
        $row = $mysqli->query("SELECT id FROM chapters WHERE subject_id=$subjectId AND chapter_number=$number LIMIT 1")->fetch_assoc();
        $chapterIds[$number] = (int)$row['id'];
    }
}

$files = $mysqli->query("SELECT id, original_name, file_type FROM files WHERE status='ACTIVE' ORDER BY id LIMIT 24");
$index = 0;
while ($file = $files->fetch_assoc()) {
    $chapterNumber = ($index % 8) + 1;
    $chapterId = $chapterIds[$chapterNumber];
    $name = mb_strtolower($file['original_name']);
    $group = str_contains($name, 'bài tập') ? 'EXERCISE' : (str_contains($name, 'đáp án') || str_contains($name, 'câu hỏi') ? 'QA' : ($chapterNumber === 4 ? 'LECTURE' : 'REFERENCE'));
    $downloadable = $file['file_type'] === 'VIDEO' ? 0 : 1;
    $printable = $file['file_type'] === 'PDF' ? 1 : 0;
    $order = intdiv($index, 8) + 1;
    $link = $mysqli->prepare("INSERT INTO chapter_materials (chapter_id,file_id,material_group,display_order,is_visible,is_downloadable,is_printable,created_at,updated_at)
        VALUES (?,?,?,?,1,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE material_group=VALUES(material_group),display_order=VALUES(display_order),is_visible=1,is_downloadable=VALUES(is_downloadable),is_printable=VALUES(is_printable),updated_at=NOW()");
    $fileId = (int)$file['id'];
    $link->bind_param('iisiii', $chapterId, $fileId, $group, $order, $downloadable, $printable);
    $link->execute();
    $index++;
}

echo "Đã seed môn NVCB2: 8 chương, $index tài liệu.\n";
