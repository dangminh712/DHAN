<?php
/**
 * Import dữ liệu 8 tập học liệu NVCB2 từ Desktop vào server/Storage và CSDL training_management (Port 3307)
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);

$sourceBase = 'C:\\Users\\DangMinh\\Desktop\\HSB dien tu NVCB2';
$projectRoot = dirname(__DIR__, 2);
$storageRoot = $projectRoot . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'Storage';
$destBase = $storageRoot . DIRECTORY_SEPARATOR . 'courses' . DIRECTORY_SEPARATOR . 'NVCB2';

echo "====================================================================\n";
echo " IMPORT HỌC LIỆU NVCB2 VÀO HỆ THỐNG DHAN (STORAGE & MYSQL PORT 3307)\n";
echo "====================================================================\n";
echo "Thư mục nguồn:   $sourceBase\n";
echo "Thư mục đích:    $destBase\n";

if (!is_dir($sourceBase)) {
    fwrite(STDERR, "LỖI: Không tìm thấy thư mục nguồn $sourceBase\n");
    exit(1);
}

if (!is_dir($destBase)) {
    mkdir($destBase, 0777, true);
}

// 1. Kết nối MySQL
$mysqli = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
if ($mysqli->connect_error) {
    fwrite(STDERR, "LỖI kết nối MySQL: " . $mysqli->connect_error . "\n");
    exit(1);
}
$mysqli->set_charset('utf8mb4');
echo "[x] Kết nối MySQL 3307 thành công.\n";

// 2. Đảm bảo môn học NVCB2 tồn tại trong bảng subjects
$stmtSub = $mysqli->prepare("
    INSERT INTO subjects (code, name, description, organizational_unit_id, credits, status, created_at, updated_at)
    VALUES ('NVCB2', 'Nghiệp vụ cơ bản 2', 'Tìm bài giảng, giáo án, bài tập và tư liệu của môn học theo từng chương.', 2, 3.0, 'ACTIVE', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        status = 'ACTIVE',
        updated_at = NOW()
");
$stmtSub->execute();

$resSub = $mysqli->query("SELECT id FROM subjects WHERE code = 'NVCB2' LIMIT 1");
$subjectRow = $resSub->fetch_assoc();
$subjectId = (int)$subjectRow['id'];
echo "[x] Môn học NVCB2 (ID: $subjectId) đã sẵn sàng.\n";

// 3. Đảm bảo 8 chương trong bảng chapters
$chapterDefs = [
    1 => ['Hồ sơ môn học', 'Thông tin tổng quan, hồ sơ pháp lý và danh mục văn bản môn học.'],
    2 => ['Chương trình và đề cương', 'Chương trình đào tạo, đề cương chi tiết và chuẩn đầu ra môn học.'],
    3 => ['Kế hoạch giảng dạy', 'Lịch trình, tiến độ và kế hoạch tổ chức giảng dạy, xemina, bài tập.'],
    4 => ['Giáo án và bài giảng', 'Giáo án, bài giảng, slide và tài liệu trình chiếu.'],
    5 => ['Hoạt động học thuật', 'Danh mục báo cáo ngoại khóa, thực tế và nghiên cứu khoa học.'],
    6 => ['Hệ thống bài tập', 'Bài tập lý thuyết, thực hành và tình huống nghiệp vụ.'],
    7 => ['Câu hỏi và đáp án', 'Ngân hàng câu hỏi, hướng dẫn và đáp án tham khảo.'],
    8 => ['Học liệu và tư liệu', 'Tài liệu tham khảo, hình ảnh, video và tư liệu nghiệp vụ bổ trợ.']
];

$chapterIds = [];
$stmtChap = $mysqli->prepare("
    INSERT INTO chapters (subject_id, chapter_number, title, description, display_order, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'PUBLISHED', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        display_order = VALUES(display_order),
        status = 'PUBLISHED',
        updated_at = NOW()
");

foreach ($chapterDefs as $num => [$title, $desc]) {
    $stmtChap->bind_param('iissi', $subjectId, $num, $title, $desc, $num);
    $stmtChap->execute();

    $resC = $mysqli->query("SELECT id FROM chapters WHERE subject_id = $subjectId AND chapter_number = $num LIMIT 1");
    $chapterIds[$num] = (int)$resC->fetch_assoc()['id'];
}
echo "[x] 8 chương học phần NVCB2 đã sẵn sàng.\n";

// Hàm hỗ trợ loại file và MIME type
function getFileType($ext) {
    $e = strtolower($ext);
    if ($e === '.pdf') return 'PDF';
    if (in_array($e, ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'])) return 'VIDEO';
    if (in_array($e, ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.bmp'])) return 'IMAGE';
    if (in_array($e, ['.mp3', '.wav', '.m4a', '.ogg', '.aac'])) return 'AUDIO';
    if (in_array($e, ['.ppt', '.pptx'])) return 'SLIDE';
    if (in_array($e, ['.doc', '.docx', '.xls', '.xlsx', '.txt'])) return 'DOCUMENT';
    return 'OTHER';
}

function getMimeType($ext) {
    $e = strtolower($ext);
    $map = [
        '.pdf' => 'application/pdf',
        '.mp4' => 'video/mp4',
        '.mov' => 'video/quicktime',
        '.webm' => 'video/webm',
        '.flv' => 'video/x-flv',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.png' => 'image/png',
        '.gif' => 'image/gif',
        '.webp' => 'image/webp',
        '.svg' => 'image/svg+xml',
        '.ppt' => 'application/vnd.ms-powerpoint',
        '.pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.doc' => 'application/msword',
        '.docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls' => 'application/vnd.ms-excel',
        '.xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt' => 'text/plain',
        '.zip' => 'application/zip',
        '.rar' => 'application/x-rar-compressed'
    ];
    return $map[$e] ?? 'application/octet-stream';
}

function getMaterialGroup($chapterNum, $fileName) {
    $lower = mb_strtolower($fileName, 'UTF-8');
    if (str_contains($lower, 'bài tập') || str_contains($lower, 'bai tap')) return 'EXERCISE';
    if (str_contains($lower, 'đáp án') || str_contains($lower, 'câu hỏi') || str_contains($lower, 'dap an') || str_contains($lower, 'cau hoi')) return 'QA';
    if (str_contains($lower, 'kế hoạch') || str_contains($lower, 'ke hoach') || str_contains($lower, 'đề cương') || str_contains($lower, 'de cuong') || str_contains($lower, 'chương trình')) return 'LESSON_PLAN';
    if (str_contains($lower, 'giáo án') || str_contains($lower, 'bài giảng') || str_contains($lower, 'tbg')) return 'LECTURE';

    return match ($chapterNum) {
        1 => 'REFERENCE',
        2 => 'LESSON_PLAN',
        3 => 'LESSON_PLAN',
        4 => 'LECTURE',
        5 => 'REFERENCE',
        6 => 'EXERCISE',
        7 => 'QA',
        8 => 'REFERENCE',
        default => 'OTHER'
    };
}

// Xóa liên kết tài liệu cũ của 8 chương NVCB2 để nạp mới toàn bộ
$chapIdsList = implode(',', $chapterIds);
$mysqli->query("DELETE FROM chapter_materials WHERE chapter_id IN ($chapIdsList)");
echo "[x] Đã làm sạch các liên kết chapter_materials cũ của 8 chương NVCB2.\n";

$totalCopied = 0;
$totalFilesCreated = 0;
$totalMaterialsCreated = 0;

$stmtFindFile = $mysqli->prepare("SELECT id FROM files WHERE storage_path = ? LIMIT 1");
$stmtInsertFile = $mysqli->prepare("
    INSERT INTO files (
        original_name, stored_name, mime_type, extension, file_type, file_size,
        storage_path, checksum_sha256, classification_level_id, uploaded_by, status,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'ACTIVE', NOW(), NOW())
");
$stmtUpdateFile = $mysqli->prepare("
    UPDATE files SET
        original_name = ?, stored_name = ?, mime_type = ?, extension = ?,
        file_type = ?, file_size = ?, checksum_sha256 = ?, classification_level_id = 1,
        status = 'ACTIVE', updated_at = NOW()
    WHERE id = ?
");
$stmtInsertMat = $mysqli->prepare("
    INSERT INTO chapter_materials (
        chapter_id, file_id, material_group, display_order, is_visible,
        is_downloadable, is_printable, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
");

// 4. Quét từng tập từ TAP1 đến TAP8
for ($tapNum = 1; $tapNum <= 8; $tapNum++) {
    $tapKey = "TAP$tapNum";
    $srcTapDir = $sourceBase . DIRECTORY_SEPARATOR . $tapKey;
    $dstTapDir = $destBase . DIRECTORY_SEPARATOR . $tapKey;
    $chapterId = $chapterIds[$tapNum];

    if (!is_dir($srcTapDir)) {
        echo "[-] Bỏ qua $tapKey vì không tồn tại thư mục.\n";
        continue;
    }

    if (!is_dir($dstTapDir)) {
        mkdir($dstTapDir, 0777, true);
    }

    // Quét đệ quy thư mục tập
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($srcTapDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $chapterFileOrder = 1;
    $tapFileCount = 0;

    foreach ($iterator as $item) {
        $basename = $item->getBasename();
        // Bỏ qua file rác macOS
        if ($basename === '.DS_Store' || str_starts_with($basename, '._')) {
            continue;
        }

        $sourcePath = $item->getPathname();
        // Tính đường dẫn tương đối từ srcTapDir
        $relFromTap = substr($sourcePath, strlen($srcTapDir) + 1);
        $targetPath = $dstTapDir . DIRECTORY_SEPARATOR . $relFromTap;

        if ($item->isDir()) {
            if (!is_dir($targetPath)) {
                mkdir($targetPath, 0777, true);
            }
            continue;
        }

        if (!$item->isFile()) {
            continue;
        }

        // Tạo thư mục cha của file đích nếu chưa có
        $targetDir = dirname($targetPath);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        // Sao chép file sang Storage
        if (!copy($sourcePath, $targetPath)) {
            echo "[!] Lỗi không sao chép được: $sourcePath\n";
            continue;
        }
        $totalCopied++;
        $tapFileCount++;

        // Thu thập metadata của file
        $fileName = $basename;
        $ext = '.' . strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $fileSize = (int)filesize($targetPath);
        $sha256 = hash_file('sha256', $targetPath);
        $fileType = getFileType($ext);
        $mimeType = getMimeType($ext);

        // Chuẩn hóa storage_path theo format tương đối chuẩn của DHAN Storage
        // Storage/courses/NVCB2/TAP1/... (dùng dấu /)
        $relPathNormalized = str_replace(DIRECTORY_SEPARATOR, '/', "courses/NVCB2/$tapKey/$relFromTap");
        $storagePath = "Storage/$relPathNormalized";

        // Tạo stored_name duy nhất: NVCB2_TAPx_<hash8>_<cleanName>
        $uniqueHash = substr(md5($relPathNormalized), 0, 8);
        $safeBase = preg_replace('/[^\w\-\.]+/u', '_', pathinfo($fileName, PATHINFO_FILENAME));
        $safeBase = mb_substr($safeBase, 0, 100);
        $storedName = "NVCB2_{$tapKey}_{$uniqueHash}_{$safeBase}{$ext}";

        // Kiểm tra xem file đã có trong bảng files chưa
        $stmtFindFile->bind_param('s', $storagePath);
        $stmtFindFile->execute();
        $resFind = $stmtFindFile->get_result();

        $fileId = 0;
        if ($rowF = $resFind->fetch_assoc()) {
            $fileId = (int)$rowF['id'];
            $stmtUpdateFile->bind_param('sssssisi', $fileName, $storedName, $mimeType, $ext, $fileType, $fileSize, $sha256, $fileId);
            $stmtUpdateFile->execute();
        } else {
            $stmtInsertFile->bind_param('sssssiss', $fileName, $storedName, $mimeType, $ext, $fileType, $fileSize, $storagePath, $sha256);
            $stmtInsertFile->execute();
            $fileId = (int)$mysqli->insert_id;
            $totalFilesCreated++;
        }

        // Liên kết vào chapter_materials
        $matGroup = getMaterialGroup($tapNum, $fileName);
        $isDownloadable = ($fileType === 'VIDEO') ? 0 : 1;
        $isPrintable = ($fileType === 'PDF') ? 1 : 0;

        $stmtInsertMat->bind_param('iisiii', $chapterId, $fileId, $matGroup, $chapterFileOrder, $isDownloadable, $isPrintable);
        $stmtInsertMat->execute();
        $totalMaterialsCreated++;
        $chapterFileOrder++;
    }

    echo "[+] TAP$tapNum (Chương $tapNum: {$chapterDefs[$tapNum][0]}): đã sao chép & liên kết $tapFileCount tài liệu.\n";
}

echo "====================================================================\n";
echo " HOÀN TẤT NHẬP DỮ LIỆU!\n";
echo " - Tổng số file sao chép vào Storage: $totalCopied\n";
echo " - Số bản ghi files mới:               $totalFilesCreated\n";
echo " - Số bản ghi chapter_materials tạo:  $totalMaterialsCreated\n";
echo "====================================================================\n";
