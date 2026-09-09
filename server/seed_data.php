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
$mysqli->set_charset("utf8mb4");

echo "=== BAT DAU NAP DU LIEU CHO TOAN BO 27 BANG DBMS ===\n";

// Disable foreign key checks for clean reload
$mysqli->query("SET FOREIGN_KEY_CHECKS = 0");

$truncateTables = [
    'notifications', 'user_mfa', 'user_sessions', 'security_alerts',
    'audit_logs', 'download_logs', 'learning_progress', 'watch_history',
    'file_permissions', 'lecture_files', 'lecture_permissions', 'file_versions',
    'files', 'lectures', 'user_clearance_levels', 'student_classes',
    'teacher_subjects', 'users', 'subjects', 'classes', 'organizational_units',
    'role_permissions', 'permissions', 'roles', 'classification_levels',
    'retention_policies', 'system_settings'
];
foreach ($truncateTables as $tbl) {
    $mysqli->query("TRUNCATE TABLE `$tbl`");
}

// 1. ROLES
$mysqli->query("INSERT INTO `roles` (`id`, `code`, `name`, `description`, `status`) VALUES
(1, 'SUPER_ADMIN', 'Quản trị viên Cấp cao', 'Toàn quyền cấu hình, bảo mật và vận hành hệ thống', 'ACTIVE'),
(2, 'ADMIN', 'Quản trị viên Học viện', 'Quản lý người dùng, học liệu, phân công và kiểm toán an ninh', 'ACTIVE'),
(3, 'TEACHER', 'Giảng viên Sĩ quan', 'Biên soạn, xuất bản bài giảng và tải học liệu nghiệp vụ', 'ACTIVE'),
(4, 'STUDENT', 'Học viên', 'Tra cứu, học tập bài giảng và tài liệu được phân quyền theo lớp', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `description`=VALUES(`description`);");
echo "[x] roles: OK\n";

// 2. PERMISSIONS
$mysqli->query("INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `module`) VALUES
(1, 'USER_VIEW', 'Xem danh sách người dùng', 'Xem hồ sơ cán bộ, giảng viên, học viên', 'Identity'),
(2, 'USER_CREATE', 'Tạo tài khoản người dùng', 'Thêm mới người dùng vào hệ thống', 'Identity'),
(3, 'USER_UPDATE', 'Cập nhật tài khoản người dùng', 'Chỉnh sửa thông tin, vai trò, đơn vị', 'Identity'),
(4, 'USER_DELETE', 'Xóa tài khoản người dùng', 'Xóa mềm tài khoản khỏi hệ thống', 'Identity'),
(5, 'LECTURE_VIEW', 'Xem bài giảng', 'Xem nội dung và tài liệu thuộc bài giảng', 'Lecture'),
(6, 'LECTURE_CREATE', 'Tạo bài giảng mới', 'Biên soạn nội dung bài giảng điện tử', 'Lecture'),
(7, 'LECTURE_UPDATE', 'Cập nhật bài giảng', 'Chỉnh sửa tiêu đề, mô tả, phiên bản', 'Lecture'),
(8, 'LECTURE_DELETE', 'Xóa bài giảng', 'Xóa mềm bài giảng', 'Lecture'),
(9, 'LECTURE_PUBLISH', 'Xuất bản bài giảng', 'Phát hành bài giảng cho lớp học', 'Lecture'),
(10, 'LECTURE_CLOSE', 'Đóng bài giảng', 'Khóa bài giảng, ngừng phân quyền học viên', 'Lecture'),
(11, 'FILE_VIEW', 'Xem tập tin học liệu', 'Truy cập xem trực tiếp PDF, Ảnh, Video', 'File'),
(12, 'FILE_UPLOAD', 'Đăng tải tập tin', 'Tải lên học liệu số hóa vào kho lưu trữ', 'File'),
(13, 'FILE_UPDATE', 'Cập nhật tập tin', 'Chỉnh sửa metadata, cập nhật phiên bản mới', 'File'),
(14, 'FILE_DELETE', 'Xóa tập tin', 'Đánh dấu xóa mềm học liệu', 'File'),
(15, 'FILE_DOWNLOAD', 'Tải tập tin về máy', 'Tải file đính kèm nếu được cấp quyền', 'File'),
(16, 'CLASS_VIEW', 'Xem danh sách lớp học', 'Tra cứu các lớp học vụ và niên khóa', 'Academic'),
(17, 'CLASS_CREATE', 'Tạo lớp học mới', 'Thêm mới lớp học vụ', 'Academic'),
(18, 'CLASS_UPDATE', 'Cập nhật lớp học', 'Chỉnh sửa thông tin lớp học', 'Academic'),
(19, 'SUBJECT_VIEW', 'Xem danh mục môn học', 'Tra cứu học phần đào tạo', 'Academic'),
(20, 'SUBJECT_CREATE', 'Tạo môn học mới', 'Thêm mới môn học vào chương trình', 'Academic'),
(21, 'SUBJECT_UPDATE', 'Cập nhật môn học', 'Chỉnh sửa thông tin học phần', 'Academic'),
(22, 'AUDIT_VIEW', 'Xem nhật ký kiểm toán', 'Tra cứu Audit Trail bất biến', 'Audit'),
(23, 'SECURITY_ALERT_VIEW', 'Xem cảnh báo an ninh', 'Theo dõi cảnh báo vi phạm, tải bất thường', 'Audit'),
(24, 'SECURITY_ALERT_UPDATE', 'Xử lý cảnh báo an ninh', 'Cập nhật trạng thái xử lý cảnh báo', 'Audit'),
(25, 'CLEARANCE_VIEW', 'Xem cấp độ phân loại', 'Xem cấp độ bảo mật của tài liệu & người dùng', 'Security'),
(26, 'CLEARANCE_MANAGE', 'Quản lý phê chuẩn bảo mật', 'Cấp phát và thu hồi clearance của người dùng', 'Security'),
(27, 'DEVICE_VIEW', 'Xem phiên đăng nhập', 'Theo dõi thiết bị và IP truy cập', 'Security'),
(28, 'DEVICE_MANAGE', 'Thu hồi thiết bị', 'Hủy phiên làm việc của thiết bị', 'Security'),
(29, 'MFA_MANAGE', 'Quản lý xác thực 2 lớp', 'Thiết lập và quản trị MFA', 'Security'),
(30, 'SYSTEM_CONFIG', 'Cấu hình hệ thống', 'Quản lý tham số động toàn hệ thống', 'System'),
(31, 'RETENTION_MANAGE', 'Quản lý lưu trữ & tiêu hủy', 'Cấu hình chính sách Retention Policy', 'System')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);");
echo "[x] permissions: OK\n";

// 3. ROLE_PERMISSIONS
$mysqli->query("INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;");

$mysqli->query("INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4),
(2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10),
(2, 11), (2, 12), (2, 13), (2, 14), (2, 15),
(2, 16), (2, 17), (2, 18),
(2, 19), (2, 20), (2, 21),
(2, 22), (2, 23), (2, 24),
(2, 25), (2, 26),
(2, 27), (2, 28), (2, 29),
(3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10),
(3, 11), (3, 12), (3, 13), (3, 14), (3, 15),
(4, 5), (4, 11), (4, 15);");
echo "[x] role_permissions: OK\n";

// 4. CLASSIFICATION_LEVELS
$mysqli->query("INSERT INTO `classification_levels` (`id`, `code`, `name`, `level_order`, `description`, `status`) VALUES
(1, 'NORMAL', 'Công khai nội bộ', 1, 'Học liệu phổ thông, đề cương chi tiết môn học', 'ACTIVE'),
(2, 'INTERNAL', 'Lưu hành nội bộ', 2, 'Giáo trình chính khóa dành cho học viên nhà trường', 'ACTIVE'),
(3, 'CONFIDENTIAL', 'Mật', 3, 'Tài liệu hướng dẫn nghiệp vụ và hồ sơ trinh sát chuyên đề', 'ACTIVE'),
(4, 'SECRET', 'Tối mật nghiệp vụ', 4, 'Hồ sơ chuyên án đặc biệt, chỉ cấp cho sĩ quan có thẩm quyền', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `level_order`=VALUES(`level_order`);");
echo "[x] classification_levels: OK\n";

// 5. ORGANIZATIONAL_UNITS
$mysqli->query("INSERT INTO `organizational_units` (`id`, `parent_id`, `code`, `name`, `unit_type`, `status`) VALUES
(1, NULL, 'T04_ROOT', 'Trường Đại học An ninh Nhân dân', 'ACADEMY', 'ACTIVE'),
(2, 1, 'KHOA_ANDT', 'Khoa An ninh điều tra', 'FACULTY', 'ACTIVE'),
(3, 1, 'KHOA_ANM', 'Khoa An ninh mạng & PCTP Công nghệ cao', 'FACULTY', 'ACTIVE'),
(4, 1, 'KHOA_LUAT', 'Khoa Luật & Quản lý nhà nước về ANTT', 'FACULTY', 'ACTIVE'),
(5, 1, 'KHOA_NVAN', 'Khoa Nghiệp vụ An ninh', 'FACULTY', 'ACTIVE'),
(6, 2, 'BM_KTHS', 'Bộ môn Kỹ thuật hình sự & Khám nghiệm', 'DEPARTMENT', 'ACTIVE'),
(7, 2, 'BM_DTTP', 'Bộ môn Điều tra tội phạm xâm phạm ANQG', 'DEPARTMENT', 'ACTIVE'),
(8, 3, 'BM_ATTT', 'Bộ môn An toàn thông tin mạng', 'DEPARTMENT', 'ACTIVE'),
(9, 3, 'BM_TTDT', 'Bộ môn Trinh sát Kỹ thuật điện tử', 'DEPARTMENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `parent_id`=VALUES(`parent_id`);");
echo "[x] organizational_units: OK\n";

// 6. CLASSES
$mysqli->query("INSERT INTO `classes` (`id`, `code`, `name`, `organizational_unit_id`, `academic_year`, `semester`, `status`) VALUES
(1, 'D31A', 'Lớp Khóa D31 - Đại đội A (Chuyên ngành An ninh điều tra)', 2, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE'),
(2, 'D31B', 'Lớp Khóa D31 - Đại đội B (Chuyên ngành An ninh mạng)', 3, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE'),
(3, 'LT15', 'Lớp Liên thông Khóa 15 (Hệ Vừa làm vừa học)', 4, '2024-2026', 'Học kỳ 2 - Năm 1', 'ACTIVE'),
(4, 'VB2_K8', 'Lớp Văn bằng 2 - Khóa 8 (Chính quy tập trung)', 5, '2024-2026', 'Học kỳ 1 - Năm 2', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);");
echo "[x] classes: OK\n";

// 7. SUBJECTS
$mysqli->query("INSERT INTO `subjects` (`id`, `code`, `name`, `description`, `organizational_unit_id`, `credits`, `status`) VALUES
(1, 'ANDT_301', 'Kỹ thuật Khám nghiệm hiện trường & Điều tra hình sự', 'Trang bị quy trình nghiệp vụ khám nghiệm, thu thập mẫu vật, dấu vết vi lượng', 2, 4.0, 'ACTIVE'),
(2, 'ANM_402', 'An toàn Thông tin & Phòng chống Tấn công mạng', 'Kỹ thuật phòng vệ mạng nội bộ, giám sát an toàn thông tin cơ yếu lực lượng CAND', 3, 3.5, 'ACTIVE'),
(3, 'LUAT_201', 'Luật Tố tụng Hình sự thực hành', 'Áp dụng các biện pháp ngăn chặn và bảo vệ chứng cứ pháp lý tố tụng', 4, 3.0, 'ACTIVE'),
(4, 'NVAN_305', 'Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Nghiệp vụ trinh sát ngoại tuyến và bảo vệ an toàn các mục tiêu trọng điểm', 5, 3.0, 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `credits`=VALUES(`credits`);");
echo "[x] subjects: OK\n";

// 8. USERS (Mật khẩu: T04@Security2026!)
$pwHash = 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=';
$mysqli->query("INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role_id`, `organizational_unit_id`, `status`) VALUES
(1, 'admin', '$pwHash', 'Thiếu tướng, PGS.TS Quản trị viên', 'admin@dhan.edu.vn', '0901234567', 1, 1, 'ACTIVE'),
(2, 'gv_quang', '$pwHash', 'Đại tá Trần Minh Quang (Trưởng Khoa ANDT)', 'quangtm@dhan.edu.vn', '0902345678', 3, 2, 'ACTIVE'),
(3, 'gv_nam', '$pwHash', 'Trung tá Lê Hoài Nam (Phó Trưởng Khoa ANM)', 'namlh@dhan.edu.vn', '0903456789', 3, 3, 'ACTIVE'),
(4, 'gv_huong', '$pwHash', 'Thượng tá Nguyễn Thu Hương (Phó Khoa Luật)', 'huongnt@dhan.edu.vn', '0904567890', 3, 4, 'ACTIVE'),
(5, 'hv_minh', '$pwHash', 'Học viên Đặng Nhật Minh (D31A)', 'minhdn@student.dhan.edu.vn', '0912345678', 4, 2, 'ACTIVE'),
(6, 'hv_hung', '$pwHash', 'Học viên Nguyễn Tuấn Hùng (D31A)', 'hungnt@student.dhan.edu.vn', '0913456789', 4, 2, 'ACTIVE'),
(7, 'hv_lan', '$pwHash', 'Học viên Phạm Mai Lan (D31B)', 'lanpm@student.dhan.edu.vn', '0914567890', 4, 3, 'ACTIVE'),
(8, 'hv_duc', '$pwHash', 'Học viên Hoàng Trung Đức (D31B)', 'ducht@student.dhan.edu.vn', '0915678901', 4, 3, 'ACTIVE'),
(9, 'hv_thao', '$pwHash', 'Học viên Trần Phương Thảo (LT15)', 'thaotp@student.dhan.edu.vn', '0916789012', 4, 4, 'ACTIVE'),
(10, 'hv_an', '$pwHash', 'Học viên Vũ Quốc An (VB2_K8)', 'anvq@student.dhan.edu.vn', '0917890123', 4, 5, 'ACTIVE')
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `email`=VALUES(`email`), `role_id`=VALUES(`role_id`);");
echo "[x] users: OK (10 nguoi dung)\n";

// 9. TEACHER_SUBJECTS
$mysqli->query("INSERT IGNORE INTO `teacher_subjects` (`teacher_id`, `subject_id`) VALUES
(2, 1), -- gv_quang dạy ANDT
(2, 3), -- gv_quang dạy Luật
(3, 2), -- gv_nam dạy ANM
(4, 3), -- gv_huong dạy Luật
(4, 4); -- gv_huong dạy NVAN");
echo "[x] teacher_subjects: OK\n";

// 10. STUDENT_CLASSES
$mysqli->query("INSERT IGNORE INTO `student_classes` (`student_id`, `class_id`, `status`) VALUES
(5, 1, 'ACTIVE'), -- hv_minh -> D31A
(6, 1, 'ACTIVE'), -- hv_hung -> D31A
(7, 2, 'ACTIVE'), -- hv_lan -> D31B
(8, 2, 'ACTIVE'), -- hv_duc -> D31B
(9, 3, 'ACTIVE'), -- hv_thao -> LT15
(10, 4, 'ACTIVE'); -- hv_an -> VB2_K8");
echo "[x] student_classes: OK\n";

// 11. USER_CLEARANCE_LEVELS
$mysqli->query("INSERT INTO `user_clearance_levels` (`id`, `user_id`, `classification_level_id`, `granted_by`, `status`) VALUES
(1, 1, 4, 1, 'ACTIVE'), -- admin: SECRET (Level 4)
(2, 2, 3, 1, 'ACTIVE'), -- gv_quang: CONFIDENTIAL (Level 3)
(3, 3, 4, 1, 'ACTIVE'), -- gv_nam: SECRET (Level 4)
(4, 4, 3, 1, 'ACTIVE'), -- gv_huong: CONFIDENTIAL (Level 3)
(5, 5, 2, 1, 'ACTIVE'), -- hv_minh: INTERNAL (Level 2)
(6, 6, 1, 1, 'ACTIVE'), -- hv_hung: NORMAL (Level 1)
(7, 7, 2, 1, 'ACTIVE'), -- hv_lan: INTERNAL (Level 2)
(8, 8, 3, 1, 'ACTIVE'), -- hv_duc: CONFIDENTIAL (Level 3 - NCKH cap Bo)
(9, 9, 2, 1, 'ACTIVE'), -- hv_thao: INTERNAL (Level 2)
(10, 10, 1, 1, 'ACTIVE') -- hv_an: NORMAL (Level 1)
ON DUPLICATE KEY UPDATE `classification_level_id`=VALUES(`classification_level_id`);");
echo "[x] user_clearance_levels: OK\n";

// 12. PREPARE PHYSICAL FILES & SEED FILES TABLE
$storageBase = __DIR__ . '/Storage';
$filesData = [
    [
        'id' => 1,
        'src' => $storageBase . '/sample_giaotrinh.pdf',
        'sub' => '2026/09/01',
        'guid' => 'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
        'orig' => 'Giao_trinh_An_ninh_dieu_tra_Chuong_1.pdf',
        'mime' => 'application/pdf',
        'ext' => '.pdf',
        'type' => 'PDF',
        'classif' => 2, // INTERNAL
        'uploader' => 2,
    ],
    [
        'id' => 2,
        'src' => $storageBase . '/sample_video.mp4',
        'sub' => '2026/09/02',
        'guid' => 'c9a646d3-9c61-4cd7-9f59-b2c3d4e5f6a1.mp4',
        'orig' => 'Video_bai_giang_Ky_thuat_dieu_tra_co_ban.mp4',
        'mime' => 'video/mp4',
        'ext' => '.mp4',
        'type' => 'VIDEO',
        'classif' => 2, // INTERNAL
        'uploader' => 2,
    ],
    [
        'id' => 3,
        'src' => $storageBase . '/sample_slide.svg',
        'sub' => '2026/09/03',
        'guid' => 'd8e9f0a1-b2c3-4d5e-6f7a-c3d4e5f6a1b2.svg',
        'orig' => 'Slide_minh_hoa_Nghiep_vu_An_ninh_mang.svg',
        'mime' => 'image/svg+xml',
        'ext' => '.svg',
        'type' => 'IMAGE',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 3,
    ],
    [
        'id' => 4,
        'src' => $storageBase . '/sample_de_cuong.pdf',
        'sub' => '2026/09/04',
        'guid' => 'e1f2a3b4-c5d6-4e7f-8a9b-d4e5f6a1b2c3.pdf',
        'orig' => 'De_cuong_bai_giang_Luat_to_tung_hinh_su.pdf',
        'mime' => 'application/pdf',
        'ext' => '.pdf',
        'type' => 'PDF',
        'classif' => 1, // NORMAL
        'uploader' => 4,
    ],
    [
        'id' => 5,
        'src' => $storageBase . '/sample_bai_giang.pdf',
        'sub' => '2026/09/05',
        'guid' => 'fa5b6c7d-8e9f-4a0b-1c2d-e5f6a1b2c3d4.pdf',
        'orig' => 'Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf',
        'mime' => 'application/pdf',
        'ext' => '.pdf',
        'type' => 'PDF',
        'classif' => 4, // SECRET
        'uploader' => 3,
    ],
    [
        'id' => 6,
        'src' => $storageBase . '/so_do_kien_truc.jpg',
        'sub' => '2026/09/06',
        'guid' => 'b7c8d9e0-1a2b-3c4d-5e6f-7a8b9c0d1e2f.jpg',
        'orig' => 'So_do_Ha_tang_Giam_sat_Toan_tuyen.jpg',
        'mime' => 'image/jpeg',
        'ext' => '.jpg',
        'type' => 'IMAGE',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 3,
    ],
    [
        'id' => 7,
        'src' => $storageBase . '/audio_on_tap.wav',
        'sub' => '2026/09/07',
        'guid' => 'c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f.wav',
        'orig' => 'Ghi_am_Phan_tich_Loi_khai_Nghi_pham.wav',
        'mime' => 'audio/wav',
        'ext' => '.wav',
        'type' => 'OTHER',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 2,
    ],
    [
        'id' => 8,
        'src' => $storageBase . '/video_huong_dan.mp4',
        'sub' => '2026/09/08',
        'guid' => 'd9e0f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a.mp4',
        'orig' => 'Huong_dan_Thuc_hanh_Phong_chong_Tan_cong.mp4',
        'mime' => 'video/mp4',
        'ext' => '.mp4',
        'type' => 'VIDEO',
        'classif' => 2, // INTERNAL
        'uploader' => 3,
    ]
];

foreach ($filesData as $f) {
    $targetDir = $storageBase . '/' . $f['sub'];
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    $targetPath = $targetDir . '/' . $f['guid'];
    if (file_exists($f['src'])) {
        copy($f['src'], $targetPath);
    } elseif (!file_exists($targetPath)) {
        file_put_contents($targetPath, "MOCK CONTENT FOR " . $f['orig']);
    }
    $fSize = filesize($targetPath);
    $sha256 = hash_file('sha256', $targetPath);
    $relPath = 'Storage/' . $f['sub'] . '/' . $f['guid'];

    $stmt = $mysqli->prepare("INSERT INTO `files` (`id`, `original_name`, `stored_name`, `mime_type`, `extension`, `file_type`, `file_size`, `storage_path`, `checksum_sha256`, `classification_level_id`, `uploaded_by`, `status`)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    ON DUPLICATE KEY UPDATE `file_size`=VALUES(`file_size`), `checksum_sha256`=VALUES(`checksum_sha256`), `storage_path`=VALUES(`storage_path`);");
    $stmt->bind_param("isssssissii", $f['id'], $f['orig'], $f['guid'], $f['mime'], $f['ext'], $f['type'], $fSize, $relPath, $sha256, $f['classif'], $f['uploader']);
    $stmt->execute();

    // v1 version
    $stmtVer = $mysqli->prepare("INSERT INTO `file_versions` (`file_id`, `version`, `stored_name`, `storage_path`, `checksum_sha256`, `uploaded_by`, `change_note`)
    VALUES (?, 1, ?, ?, ?, ?, 'Khởi tạo phiên bản gốc')
    ON DUPLICATE KEY UPDATE `checksum_sha256`=VALUES(`checksum_sha256`);");
    $stmtVer->bind_param("isssi", $f['id'], $f['guid'], $relPath, $sha256, $f['uploader']);
    $stmtVer->execute();
}

// 13. FILE_VERSIONS: Add v2 for File 1 to demonstrate Versioning Flow (Section 20, 44)
$v2Guid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479_v2.pdf';
$v2Rel = 'Storage/2026/09/01/' . $v2Guid;
$v2Full = $storageBase . '/2026/09/01/' . $v2Guid;
if (!file_exists($v2Full)) {
    copy($storageBase . '/2026/09/01/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', $v2Full);
    file_put_contents($v2Full, "\n-- v2 Update Addendum --", FILE_APPEND);
}
$v2Sha = hash_file('sha256', $v2Full);
$mysqli->query("INSERT INTO `file_versions` (`file_id`, `version`, `stored_name`, `storage_path`, `checksum_sha256`, `uploaded_by`, `change_note`)
VALUES (1, 2, '$v2Guid', '$v2Rel', '$v2Sha', 2, 'Cập nhật bổ sung Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân')
ON DUPLICATE KEY UPDATE `change_note`=VALUES(`change_note`);");
echo "[x] files & file_versions: OK (8 files + v2 versioning)\n";

// 14. LECTURES
$mysqli->query("INSERT INTO `lectures` (`id`, `subject_id`, `teacher_id`, `title`, `description`, `status`, `publish_at`, `version`) VALUES
(1, 1, 2, 'Bài giảng: Kỹ thuật Khám nghiệm hiện trường vụ án hình sự', 'Quy trình thu thập mẫu vật, khám nghiệm và bảo quản tang thư nghiệp vụ', 'PUBLISHED', '2026-09-01 08:00:00', 1),
(2, 2, 3, 'Bài giảng: Phòng chống Tấn công mạng & Bảo vệ Bí mật Nhà nước', 'Phân tích mã độc, bảo vệ hạ tầng máy chủ nội bộ trong lực lượng Công an', 'PUBLISHED', '2026-09-02 08:00:00', 1),
(3, 3, 4, 'Bài giảng: Quy trình Tố tụng Hình sự thực hành', 'Áp dụng Bộ luật TTHS vào công tác bắt giữ và điều tra ban đầu', 'SCHEDULED', '2026-09-15 08:00:00', 1),
(4, 2, 3, 'Bài giảng: Hồ sơ nghiệp vụ bảo mật cao (Học phần đã kết thúc)', 'Bài giảng đã đóng để kiểm tra đánh giá hết học phần', 'CLOSED', '2026-08-01 08:00:00', 1),
(5, 4, 4, 'Bài giảng: Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Phương án bố trí trinh sát ngoại tuyến bảo vệ sự kiện chính trị trọng điểm', 'PUBLISHED', '2026-09-05 08:00:00', 1),
(6, 2, 3, 'Bài giảng: Phân tích Dấu vết Kỹ thuật số cơ bản (Bản thảo)', 'Nội dung đang biên soạn bổ sung thực hành trích xuất RAM', 'DRAFT', NULL, 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`), `status`=VALUES(`status`);");
echo "[x] lectures: OK (6 bai giang)\n";

// 15. LECTURE_FILES
$mysqli->query("INSERT INTO `lecture_files` (`lecture_id`, `file_id`, `display_order`, `is_visible`, `is_downloadable`, `is_printable`) VALUES
(1, 1, 1, TRUE, TRUE, TRUE),    -- Bài 1: File 1 (PDF) - xem, tải
(1, 2, 2, TRUE, FALSE, FALSE),  -- Bài 1: File 2 (Video) - xem stream, cấm tải (Section 36)
(1, 7, 3, TRUE, FALSE, FALSE),  -- Bài 1: File 7 (WAV) - nghe stream, cấm tải
(2, 3, 1, TRUE, TRUE, FALSE),   -- Bài 2: File 3 (SVG) - xem, tải
(2, 5, 2, TRUE, FALSE, FALSE),  -- Bài 2: File 5 (PDF SECRET) - xem (chặn theo clearance!), cấm tải
(2, 6, 3, TRUE, TRUE, FALSE),   -- Bài 2: File 6 (JPG) - xem, tải
(2, 8, 4, TRUE, FALSE, FALSE),  -- Bài 2: File 8 (Video) - xem stream, cấm tải
(3, 4, 1, TRUE, TRUE, TRUE),    -- Bài 3: File 4 (PDF) - xem, tải
(4, 3, 1, TRUE, TRUE, FALSE),   -- Bài 4 (CLOSED): cấm toàn bộ học viên per Section 34
(5, 4, 1, TRUE, TRUE, TRUE),    -- Bài 5: File 4 (PDF) - xem, tải
(5, 6, 2, TRUE, FALSE, FALSE)   -- Bài 5: File 6 (JPG) - xem, cấm tải
ON DUPLICATE KEY UPDATE `is_visible`=VALUES(`is_visible`), `is_downloadable`=VALUES(`is_downloadable`);");
echo "[x] lecture_files: OK\n";

// 16. LECTURE_PERMISSIONS
$mysqli->query("INSERT INTO `lecture_permissions` (`lecture_id`, `class_id`, `can_view`, `publish_at`) VALUES
(1, 1, TRUE, '2026-09-01 08:00:00'), -- Bài 1 -> D31A
(2, 1, TRUE, '2026-09-02 08:00:00'), -- Bài 2 -> D31A
(2, 2, TRUE, '2026-09-02 08:00:00'), -- Bài 2 -> D31B
(3, 3, TRUE, '2026-09-15 08:00:00'), -- Bài 3 -> LT15
(4, 1, TRUE, '2026-08-01 08:00:00'), -- Bài 4 -> D31A (Closed)
(5, 4, TRUE, '2026-09-05 08:00:00'), -- Bài 5 -> VB2_K8
(5, 1, TRUE, '2026-09-05 08:00:00')  -- Bài 5 -> D31A
ON DUPLICATE KEY UPDATE `can_view`=VALUES(`can_view`);");
echo "[x] lecture_permissions: OK\n";

// 17. FILE_PERMISSIONS (Section 19: Quyền ngoại lệ theo cá nhân / lớp)
$mysqli->query("INSERT INTO `file_permissions` (`id`, `file_id`, `user_id`, `class_id`, `can_view`, `can_download`, `can_print`, `access_reason`) VALUES
(1, 5, 8, NULL, TRUE, FALSE, FALSE, 'Được cấp quyền nghiên cứu chuyên đề Đề tài Khoa học cấp Bộ'),
(2, 6, NULL, 3, TRUE, TRUE, FALSE, 'Cấp quyền toàn bộ Lớp LT15 nghiên cứu chuyên đề sơ đồ hạ tầng'),
(3, 7, 5, NULL, TRUE, TRUE, FALSE, 'Cấp quyền đặc cách tải file ghi âm phục vụ diễn tập thực nghiệm')
ON DUPLICATE KEY UPDATE `can_view`=VALUES(`can_view`), `can_download`=VALUES(`can_download`);");
echo "[x] file_permissions: OK (3 ngoai le phan quyen)\n";

// 18. WATCH_HISTORY (Section 21)
$mysqli->query("INSERT INTO `watch_history` (`id`, `user_id`, `file_id`, `lecture_id`, `last_position_seconds`, `duration_seconds`, `completed`, `last_watched_at`) VALUES
(1, 5, 2, 1, 142.500, 300.000, FALSE, '2026-09-09 10:15:30'),
(2, 7, 8, 2, 285.000, 285.000, TRUE, '2026-09-08 16:45:10'),
(3, 8, 8, 2, 75.200, 285.000, FALSE, '2026-09-09 08:30:22'),
(4, 5, 7, 1, 120.000, 240.000, FALSE, '2026-09-09 11:00:00')
ON DUPLICATE KEY UPDATE `last_position_seconds`=VALUES(`last_position_seconds`), `completed`=VALUES(`completed`);");
echo "[x] watch_history: OK (4 ban ghi)\n";

// 19. LEARNING_PROGRESS (Section 22)
$mysqli->query("INSERT INTO `learning_progress` (`id`, `user_id`, `lecture_id`, `progress_percent`, `completed`, `completed_at`) VALUES
(1, 5, 1, 65.00, FALSE, NULL),
(2, 7, 2, 100.00, TRUE, '2026-09-08 17:00:00'),
(3, 8, 2, 45.00, FALSE, NULL),
(4, 9, 3, 10.00, FALSE, NULL),
(5, 10, 5, 80.00, FALSE, NULL)
ON DUPLICATE KEY UPDATE `progress_percent`=VALUES(`progress_percent`), `completed`=VALUES(`completed`);");
echo "[x] learning_progress: OK (5 ban ghi)\n";

// 20. DOWNLOAD_LOGS (Section 23)
$mysqli->query("INSERT INTO `download_logs` (`id`, `user_id`, `file_id`, `lecture_id`, `ip_address`, `user_agent`, `file_size`, `status`, `denial_reason`, `downloaded_at`) VALUES
(1, 5, 1, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 712, 'SUCCESS', NULL, '2026-09-09 09:12:00'),
(2, 5, 2, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 32, 'DENIED', 'Tập tin cấu hình chỉ cho phép xem trực tuyến (is_downloadable=false)', '2026-09-09 09:13:00'),
(3, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1182, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:05:00'),
(4, 7, 3, 2, '192.168.1.112', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1504, 'SUCCESS', NULL, '2026-09-09 11:20:00'),
(5, 2, 1, 1, '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 712, 'SUCCESS', NULL, '2026-09-09 08:00:00'),
(6, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1182, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:06:00')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);");
echo "[x] download_logs: OK (6 ban ghi)\n";

// 21. AUDIT_LOGS (Section 24)
$mysqli->query("INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `access_reason`, `ip_address`, `created_at`) VALUES
(1, 1, 'SYSTEM_INIT', 'DATABASE', 1, NULL, '{\"status\": \"INITIALIZED\", \"database\": \"training_management\"}', 'Khởi tạo hệ thống', '127.0.0.1', '2026-09-01 00:00:00'),
(2, 1, 'GRANT_CLEARANCE', 'USER_CLEARANCE', 8, '{\"clearance\": \"NORMAL\"}', '{\"clearance\": \"CONFIDENTIAL\"}', 'Phê duyệt tham gia Đề tài NCKH cấp Bộ', '192.168.1.10', '2026-09-02 09:30:00'),
(3, 2, 'PUBLISH_LECTURE', 'LECTURE', 1, '{\"status\": \"DRAFT\"}', '{\"status\": \"PUBLISHED\"}', 'Xuất bản bài giảng Kỹ thuật khám nghiệm', '192.168.1.20', '2026-09-01 08:00:00'),
(4, 3, 'UPLOAD_FILE', 'FILE', 5, NULL, '{\"file_name\": \"Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf\", \"classification\": \"SECRET\"}', 'Lưu trữ tài liệu nghiệp vụ an ninh mạng', '192.168.1.25', '2026-09-02 08:30:00'),
(5, 3, 'CLOSE_LECTURE', 'LECTURE', 4, '{\"status\": \"PUBLISHED\"}', '{\"status\": \"CLOSED\"}', 'Đóng học phần theo kế hoạch đào tạo', '192.168.1.25', '2026-09-05 17:00:00'),
(6, 2, 'UPLOAD_NEW_VERSION', 'FILE_VERSION', 1, '{\"version\": 1}', '{\"version\": 2}', 'Cập nhật bổ sung Nghị định 13 về dữ liệu cá nhân', '192.168.1.20', '2026-09-08 14:00:00')
ON DUPLICATE KEY UPDATE `action`=VALUES(`action`);");
echo "[x] audit_logs: OK (6 ban ghi)\n";

// 22. SECURITY_ALERTS (Section 25)
$mysqli->query("INSERT INTO `security_alerts` (`id`, `user_id`, `alert_type`, `severity`, `description`, `source_ip`, `status`, `resolved_by`, `resolved_at`, `created_at`) VALUES
(1, 6, 'SUSPICIOUS_DOWNLOAD', 'HIGH', 'Học viên liên tiếp yêu cầu tải học liệu Tối mật (SECRET) bị hệ thống từ chối', '192.168.1.108', 'OPEN', NULL, NULL, '2026-09-09 10:06:30'),
(2, 5, 'ABNORMAL_SESSION', 'MEDIUM', 'Phát hiện cùng tài khoản đăng nhập từ 2 dải IP khác biệt trong vòng 10 phút', '192.168.1.105', 'RESOLVED', 1, '2026-09-09 12:00:00', '2026-09-08 21:15:00'),
(3, 7, 'FALSE_POSITIVE_RATE_LIMIT', 'LOW', 'Trình duyệt gửi nhiều byte-range request kích hoạt cảnh báo tần suất', '192.168.1.112', 'FALSE_POSITIVE', 1, '2026-09-09 11:30:00', '2026-09-09 11:21:00')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);");
echo "[x] security_alerts: OK (3 canh bao)\n";

// 23. USER_SESSIONS (Section 26)
$sHash1 = hash('sha256', 'session_admin_token_2026');
$sHash2 = hash('sha256', 'session_quang_token_2026');
$sHash3 = hash('sha256', 'session_nam_token_2026');
$sHash4 = hash('sha256', 'session_minh_token_2026');
$sHash5 = hash('sha256', 'session_hung_token_revoked');
$mysqli->query("INSERT INTO `user_sessions` (`id`, `user_id`, `session_token_hash`, `device_id`, `device_name`, `ip_address`, `user_agent`, `last_activity_at`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 1, '$sHash1', 'DEV_SEC_ADMIN_01', 'Workstation Phòng Quản trị An ninh T04', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:45:00', '2026-09-09 18:45:00', NULL, '2026-09-09 08:00:00'),
(2, 2, '$sHash2', 'DEV_TEACHER_QUANG_01', 'Laptop Dell Vostro Khoa ANDT', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:30:00', '2026-09-09 18:30:00', NULL, '2026-09-09 08:15:00'),
(3, 3, '$sHash3', 'DEV_TEACHER_NAM_01', 'ThinkPad X1 Khoa An ninh Mạng', '192.168.1.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 11:50:00', '2026-09-09 17:50:00', NULL, '2026-09-09 08:30:00'),
(4, 5, '$sHash4', 'DEV_STUDENT_MINH_01', 'Máy tính Phòng thực hành D31-01', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:40:00', '2026-09-09 14:40:00', NULL, '2026-09-09 09:00:00'),
(5, 6, '$sHash5', 'DEV_STUDENT_HUNG_UNKNOWN', 'Thiết bị lạ nghi vấn mang từ ngoài', '192.168.1.108', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', '2026-09-09 10:07:00', '2026-09-09 12:00:00', '2026-09-09 10:10:00', '2026-09-09 10:00:00')
ON DUPLICATE KEY UPDATE `last_activity_at`=VALUES(`last_activity_at`);");
echo "[x] user_sessions: OK (5 phien gom ca phien thu hoi)\n";

// 24. USER_MFA (Section 27)
$mysqli->query("INSERT INTO `user_mfa` (`id`, `user_id`, `method`, `secret_encrypted`, `is_enabled`, `enabled_at`) VALUES
(1, 1, 'TOTP', 'ENC_AES256_GCM_9f83ac01bb45e', TRUE, '2026-09-01 00:00:00'),
(2, 2, 'EMAIL_OTP', 'ENC_AES256_GCM_77a8cb02cc67d', TRUE, '2026-09-02 08:00:00'),
(3, 3, 'TOTP', 'ENC_AES256_GCM_33d4ef99aa12b', TRUE, '2026-09-02 08:30:00'),
(4, 5, 'TOTP', NULL, FALSE, NULL)
ON DUPLICATE KEY UPDATE `method`=VALUES(`method`), `is_enabled`=VALUES(`is_enabled`);");
echo "[x] user_mfa: OK (4 cau hinh MFA)\n";

// 25. NOTIFICATIONS (Section 28)
$mysqli->query("INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `read_at`, `created_at`) VALUES
(1, 5, 'Bài giảng mới đã xuất bản', 'Bài giảng \"Kỹ thuật Khám nghiệm hiện trường vụ án hình sự\" đã được phát hành cho Lớp D31A.', 'LECTURE_PUBLISHED', TRUE, '2026-09-01 09:00:00', '2026-09-01 08:00:00'),
(2, 5, 'Nhắc nhở học tập nghiệp vụ', 'Học viên cần hoàn thành theo dõi Video bài giảng kỹ thuật trước buổi thảo luận thực địa.', 'REMINDER', FALSE, NULL, '2026-09-08 14:00:00'),
(3, 7, 'Cập nhật học liệu môn An ninh mạng', 'Khoa ANM đã bổ sung sơ đồ topology phòng thủ mạng nội bộ vào Bài giảng số 2.', 'FILE_UPDATE', FALSE, NULL, '2026-09-08 16:30:00'),
(4, 2, 'Báo cáo chuyên cần học tập', 'Lớp D31A đã có 28/30 học viên truy cập nghiên cứu tài liệu giáo trình Chương 1.', 'CLASS_REPORT', TRUE, '2026-09-09 08:00:00', '2026-09-08 18:00:00'),
(5, 1, 'Cảnh báo an ninh cấp cao', 'Phát hiện dấu hiệu truy cập trái phép tài liệu SECRET từ học viên vi phạm. Vui lòng kiểm tra mục Cảnh báo.', 'SECURITY_ALERT', FALSE, NULL, '2026-09-09 10:10:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);");
echo "[x] notifications: OK (5 thong bao)\n";

// 26. RETENTION_POLICIES (Section 29)
$mysqli->query("INSERT INTO `retention_policies` (`entity_type`, `retention_days`, `archive_after_days`, `delete_after_days`, `is_enabled`) VALUES
('WATCH_HISTORY', 365, 180, 730, TRUE),
('DOWNLOAD_LOG', 730, 365, 1825, TRUE),
('AUDIT_LOG', 1825, 730, NULL, TRUE),
('USER_SESSIONS', 30, 15, 60, TRUE),
('OLD_FILES', 1095, 365, 2190, TRUE)
ON DUPLICATE KEY UPDATE `retention_days`=VALUES(`retention_days`);");
echo "[x] retention_policies: OK\n";

// 27. SYSTEM_SETTINGS (Section 30)
$mysqli->query("INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_sensitive`) VALUES
('MAX_STUDENT_DEVICES', '2', 'INTEGER', 'Số lượng thiết bị tối đa cho phép học viên đăng nhập đồng thời', FALSE),
('MAX_TEACHER_DEVICES', '3', 'INTEGER', 'Số lượng thiết bị tối đa cho phép giảng viên đăng nhập đồng thời', FALSE),
('MAX_ADMIN_DEVICES', '5', 'INTEGER', 'Số lượng thiết bị tối đa cho phép quản trị viên đăng nhập đồng thời', FALSE),
('DOWNLOAD_RATE_LIMIT_PER_HOUR', '20', 'INTEGER', 'Giới hạn số lần tải tập tin trong 1 giờ cho mỗi người dùng', FALSE),
('SESSION_TIMEOUT_MINUTES', '60', 'INTEGER', 'Thời gian hết hạn phiên làm việc khi không hoạt động', FALSE),
('WATERMARK_ENABLED', 'true', 'BOOLEAN', 'Tự động chèn mờ định danh người dùng lên PDF/Video', FALSE),
('MFA_TEACHER_REQUIRED', 'false', 'BOOLEAN', 'Bắt buộc xác thực hai yếu tố đối với giảng viên', FALSE),
('MFA_ADMIN_REQUIRED', 'true', 'BOOLEAN', 'Bắt buộc xác thực hai yếu tố đối với quản trị viên', FALSE),
('AUTO_CLOSE_LECTURE', 'true', 'BOOLEAN', 'Tự động đóng bài giảng khi đến thời điểm close_at', FALSE)
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);");
echo "[x] system_settings: OK\n";

// Re-enable foreign key checks
$mysqli->query("SET FOREIGN_KEY_CHECKS = 1");

echo "\n>>> HOAN TAT NAP DU LIEU THIET KE CHO CA 27 BANG CSDL <<<\n";
