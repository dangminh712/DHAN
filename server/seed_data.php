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

echo "=== BAT DAU NAP DU LIEU PHONG PHU CHO TOAN BO 27 BANG DBMS ===\n";

// Disable foreign key checks for clean reload
$mysqli->query("SET FOREIGN_KEY_CHECKS = 0");

// 0. ENSURE QUIZ_QUESTIONS TABLE & EXTENDED COLUMNS EXIST
$mysqli->query("CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lecture_id` BIGINT UNSIGNED NOT NULL,
  `question` TEXT NOT NULL,
  `options_json` JSON NOT NULL,
  `correct_index` INT NOT NULL,
  `explanation` TEXT NULL,
  `order_index` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_quiz_questions_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

$mysqli->query("CREATE TABLE IF NOT EXISTS `lecture_parts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lecture_id` bigint unsigned NOT NULL,
  `part_number` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `duration_text` varchar(50) NOT NULL DEFAULT '30 phút',
  `duration_minutes` int NOT NULL DEFAULT 30,
  `default_tab` varchar(50) NOT NULL DEFAULT 'doc',
  `icon_name` varchar(50) NOT NULL DEFAULT 'BookOpen',
  `description` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lecture_part` (`lecture_id`,`part_number`),
  KEY `fk_lecture_parts_lecture` (`lecture_id`),
  CONSTRAINT `fk_lecture_parts_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

$cols = [
    'notes' => 'LONGTEXT NULL',
    'completed_parts' => 'VARCHAR(255) NULL',
    'quiz_score' => 'INT NULL',
    'last_accessed_at' => 'DATETIME(6) NULL'
];
foreach ($cols as $colName => $colDef) {
    $chk = $mysqli->query("SHOW COLUMNS FROM `learning_progress` LIKE '$colName'");
    if ($chk && $chk->num_rows == 0) {
        $mysqli->query("ALTER TABLE `learning_progress` ADD COLUMN `$colName` $colDef");
    }
}

$truncateTables = [
    'notifications', 'user_mfa', 'user_sessions', 'security_alerts',
    'audit_logs', 'download_logs', 'learning_progress', 'watch_history',
    'file_permissions', 'lecture_files', 'lecture_permissions', 'file_versions',
    'files', 'quiz_questions', 'lecture_parts', 'lectures', 'user_clearance_levels', 'student_classes',
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
$adminPerms = range(1, 31);
$teacherPerms = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 25, 27];
$studentPerms = [5, 11, 15, 16, 19, 27];

$stmt = $mysqli->prepare("INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES (?, ?)");
foreach ($adminPerms as $pid) { $rid = 1; $stmt->bind_param("ii", $rid, $pid); $stmt->execute(); }
foreach ($adminPerms as $pid) { $rid = 2; $stmt->bind_param("ii", $rid, $pid); $stmt->execute(); }
foreach ($teacherPerms as $pid) { $rid = 3; $stmt->bind_param("ii", $rid, $pid); $stmt->execute(); }
foreach ($studentPerms as $pid) { $rid = 4; $stmt->bind_param("ii", $rid, $pid); $stmt->execute(); }
echo "[x] role_permissions: OK\n";

// 4. CLASSIFICATION_LEVELS
$mysqli->query("INSERT INTO `classification_levels` (`id`, `code`, `name`, `level_order`, `description`, `status`) VALUES
(1, 'CONG_KHAI', 'Công khai', 1, 'Tài liệu phổ biến rộng rãi cho toàn thể học viên và cán bộ', 'ACTIVE'),
(2, 'INTERNAL', 'Lưu hành nội bộ', 2, 'Giáo trình chính khóa dành cho học viên nhà trường', 'ACTIVE'),
(3, 'CONFIDENTIAL', 'Mật', 3, 'Tài liệu hướng dẫn nghiệp vụ và hồ sơ trinh sát chuyên đề', 'ACTIVE'),
(4, 'SECRET', 'Tối mật nghiệp vụ', 4, 'Hồ sơ chuyên án đặc biệt, chỉ cấp cho sĩ quan có thẩm quyền', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `level_order`=VALUES(`level_order`);");
echo "[x] classification_levels: OK\n";

// 5. ORGANIZATIONAL_UNITS
$mysqli->query("INSERT INTO `organizational_units` (`id`, `parent_id`, `code`, `name`, `unit_type`, `status`) VALUES
(1, NULL, 'T04_ROOT', 'Trường Đại học An ninh Nhân dân (T04)', 'ACADEMY', 'ACTIVE'),
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

// 6. CLASSES (8 Lớp học vụ)
$mysqli->query("INSERT INTO `classes` (`id`, `code`, `name`, `organizational_unit_id`, `academic_year`, `semester`, `status`) VALUES
(1, 'D31A', 'Lớp Khóa D31 - Đại đội A (Chuyên ngành An ninh điều tra)', 2, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE'),
(2, 'D31B', 'Lớp Khóa D31 - Đại đội B (Chuyên ngành An ninh mạng & PCTP CNC)', 3, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE'),
(3, 'D31C', 'Lớp Khóa D31 - Đại đội C (Chuyên ngành Kỹ thuật hình sự)', 2, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE'),
(4, 'D32A', 'Lớp Khóa D32 - Đại đội A (Chuyên ngành An ninh điều tra cơ bản)', 2, '2024-2028', 'Học kỳ 1 - Năm 2', 'ACTIVE'),
(5, 'D32B', 'Lớp Khóa D32 - Đại đội B (Chuyên ngành Tác chiến điện tử & Mật mã)', 3, '2024-2028', 'Học kỳ 1 - Năm 2', 'ACTIVE'),
(6, 'LT15', 'Lớp Liên thông Khóa 15 (Hệ Vừa làm vừa học CAND)', 4, '2024-2026', 'Học kỳ 2 - Năm 1', 'ACTIVE'),
(7, 'VB2_K8', 'Lớp Văn bằng 2 - Khóa 8 (Chính quy tập trung T04)', 5, '2024-2026', 'Học kỳ 1 - Năm 2', 'ACTIVE'),
(8, 'CH10', 'Lớp Cao học Nghiệp vụ An ninh Khóa 10', 1, '2025-2027', 'Học kỳ 1 - Năm 1', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);");
echo "[x] classes: OK (8 lop hoc vu)\n";

// 7. SUBJECTS (8 Môn học đào tạo)
$mysqli->query("INSERT INTO `subjects` (`id`, `code`, `name`, `description`, `organizational_unit_id`, `credits`, `status`) VALUES
(1, 'ANDT_301', 'Kỹ thuật Khám nghiệm hiện trường & Điều tra hình sự', 'Trang bị quy trình nghiệp vụ khám nghiệm, thu thập mẫu vật, dấu vết vi lượng', 2, 4.0, 'ACTIVE'),
(2, 'ANM_402', 'An toàn Thông tin & Phòng chống Tấn công mạng', 'Kỹ thuật phòng vệ mạng nội bộ, giám sát an toàn thông tin cơ yếu lực lượng CAND', 3, 3.5, 'ACTIVE'),
(3, 'LUAT_201', 'Luật Tố tụng Hình sự thực hành', 'Áp dụng các biện pháp ngăn chặn và bảo vệ chứng cứ pháp lý tố tụng', 4, 3.0, 'ACTIVE'),
(4, 'NVAN_305', 'Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Nghiệp vụ trinh sát ngoại tuyến và bảo vệ an toàn các mục tiêu trọng điểm', 5, 3.0, 'ACTIVE'),
(5, 'KTHS_302', 'Giám định Kỹ thuật hình sự & Chứng cứ số', 'Quy chuẩn thu giữ, phân tích dữ liệu bộ nhớ RAM, ổ cứng và thiết bị di động', 2, 3.0, 'ACTIVE'),
(6, 'ANKT_401', 'Nghiệp vụ Điều tra Tội phạm Kinh tế & Tham nhũng', 'Phương pháp phát hiện dòng tiền phi pháp, kiểm toán dữ liệu kế toán số', 2, 3.5, 'ACTIVE'),
(7, 'ANTT_202', 'Quản lý Nhà nước về An ninh Trật tự', 'Biện pháp quản lý cư trú, ngành nghề kinh doanh có điều kiện và vũ khí', 4, 2.5, 'ACTIVE'),
(8, 'TCDT_403', 'Tác chiến Không gian mạng & Trinh sát Kỹ thuật điện tử', 'Kỹ thuật chặn thu tín hiệu, phân tích phổ sóng và phòng thủ hạ tầng trọng yếu', 3, 4.0, 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `credits`=VALUES(`credits`);");
echo "[x] subjects: OK (8 mon hoc)\n";

// 8. USERS (Mật khẩu: T04@Security2026!)
$pwHash = 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$MIf+22JcC29OXsA/PSZzWj5QoYCLM+T8t0AEkf2BwuQ=';
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

// Populate batch students: 001_d31a -> 060_d31
$hoList = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
$demList = ['Văn', 'Thị', 'Đức', 'Hồng', 'Minh', 'Thanh', 'Tuấn', 'Quang', 'Hải', 'Xuân', 'Gia', 'Ngọc', 'Đình'];
$tenList = ['Anh', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Giang', 'Hà', 'Hải', 'Huy', 'Khoa', 'Long', 'Nam', 'Nghĩa', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Tâm', 'Thắng', 'Tùng'];

for ($i = 1; $i <= 50; $i++) {
    $uid = 10 + $i;
    $classId = (($i - 1) % 8) + 1; // Distribute across 8 classes
    $codeStr = sprintf("hv_%03d", $i);
    $stdCode = sprintf("T04-%04d", 2024000 + $i);
    $ho = $hoList[$i % count($hoList)];
    $dem = $demList[($i * 2) % count($demList)];
    $ten = $tenList[($i * 3) % count($tenList)];
    $fullName = "$ho $dem $ten";
    $email = "$codeStr@student.dhan.edu.vn";
    $phone = sprintf("091%07d", 1000000 + $i * 137);

    $stmtStd = $mysqli->prepare("INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role_id`, `organizational_unit_id`, `student_code`, `status`, `must_change_password`) VALUES (?, ?, ?, ?, ?, ?, 4, 2, ?, 'ACTIVE', 1) ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`)");
    $stmtStd->bind_param("issssss", $uid, $codeStr, $pwHash, $fullName, $email, $phone, $stdCode);
    $stmtStd->execute();

    // Link to Class
    $mysqli->query("INSERT IGNORE INTO `student_classes` (`student_id`, `class_id`, `status`) VALUES ($uid, $classId, 'ACTIVE')");
    // Grant Clearance Level 1, 2, or 3
    $lvl = ($i % 7 == 0) ? 3 : (($i % 3 == 0) ? 2 : 1);
    $mysqli->query("INSERT INTO `user_clearance_levels` (`user_id`, `classification_level_id`, `granted_by`, `status`) VALUES ($uid, $lvl, 1, 'ACTIVE') ON DUPLICATE KEY UPDATE `classification_level_id`=VALUES(`classification_level_id`)");
}
echo "[x] users: OK (60 nguoi dung gom can bo va hoc vien cac lop)\n";

// 9. TEACHER_SUBJECTS
$mysqli->query("INSERT IGNORE INTO `teacher_subjects` (`teacher_id`, `subject_id`) VALUES
(2, 1), -- gv_quang dạy ANDT_301
(2, 3), -- gv_quang dạy LUAT_201
(2, 5), -- gv_quang dạy KTHS_302
(2, 6), -- gv_quang dạy ANKT_401
(3, 2), -- gv_nam dạy ANM_402
(3, 8), -- gv_nam dạy TCDT_403
(4, 3), -- gv_huong dạy LUAT_201
(4, 4), -- gv_huong dạy NVAN_305
(4, 7); -- gv_huong dạy ANTT_202");
echo "[x] teacher_subjects: OK (9 phan cong giang day)\n";

// 10. STUDENT_CLASSES (Base student linkages)
$mysqli->query("INSERT IGNORE INTO `student_classes` (`student_id`, `class_id`, `status`) VALUES
(5, 1, 'ACTIVE'), (6, 1, 'ACTIVE'),
(7, 2, 'ACTIVE'), (8, 2, 'ACTIVE'),
(9, 6, 'ACTIVE'), (10, 7, 'ACTIVE');");
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
(8, 8, 3, 1, 'ACTIVE'), -- hv_duc: CONFIDENTIAL (Level 3)
(9, 9, 1, 1, 'ACTIVE'), -- hv_thao: NORMAL (Level 1)
(10, 10, 2, 1, 'ACTIVE') -- hv_an: INTERNAL (Level 2)
ON DUPLICATE KEY UPDATE `classification_level_id`=VALUES(`classification_level_id`);");
echo "[x] user_clearance_levels: OK\n";

// 12. FILES (18 tập tin học liệu số chuẩn ISO)
$storageBase = realpath(__DIR__ . '/Storage');
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
        'type' => 'AUDIO',
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
    ],
    [
        'id' => 9,
        'src' => $storageBase . '/Videos/Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4',
        'sub' => 'Videos',
        'guid' => 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4',
        'orig' => 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4',
        'mime' => 'video/mp4',
        'ext' => '.mp4',
        'type' => 'VIDEO',
        'classif' => 2, // INTERNAL
        'uploader' => 4,
    ],
    [
        'id' => 10,
        'src' => $storageBase . '/Slides_PPT/Slide_Quy_trinh_To_tung_Hinh_su.svg',
        'sub' => 'Slides_PPT',
        'guid' => 'Slide_Quy_trinh_To_tung_Hinh_su.svg',
        'orig' => 'Slide_Quy_trinh_To_tung_Hinh_su.svg',
        'mime' => 'image/svg+xml',
        'ext' => '.svg',
        'type' => 'IMAGE',
        'classif' => 1, // NORMAL
        'uploader' => 4,
    ],
    [
        'id' => 11,
        'src' => $storageBase . '/PDFs/Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf',
        'sub' => 'PDFs',
        'guid' => 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf',
        'orig' => 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf',
        'mime' => 'application/pdf',
        'ext' => '.pdf',
        'type' => 'PDF',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 4,
    ],
    [
        'id' => 12,
        'src' => $storageBase . '/Videos/Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4',
        'sub' => 'Videos',
        'guid' => 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4',
        'orig' => 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4',
        'mime' => 'video/mp4',
        'ext' => '.mp4',
        'type' => 'VIDEO',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 4,
    ],
    [
        'id' => 13,
        'src' => $storageBase . '/Images/Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg',
        'sub' => 'Images',
        'guid' => 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg',
        'orig' => 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg',
        'mime' => 'image/jpeg',
        'ext' => '.jpg',
        'type' => 'IMAGE',
        'classif' => 3, // CONFIDENTIAL
        'uploader' => 4,
    ],
    [
        'id' => 14,
        'src' => $storageBase . '/Videos/Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4',
        'sub' => 'Videos',
        'guid' => 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4',
        'orig' => 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4',
        'mime' => 'video/mp4',
        'ext' => '.mp4',
        'type' => 'VIDEO',
        'classif' => 2, // INTERNAL
        'uploader' => 3,
    ],
    [
        'id' => 15,
        'src' => $storageBase . '/PDFs/So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf',
        'sub' => 'PDFs',
        'guid' => 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf',
        'orig' => 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf',
        'mime' => 'application/pdf',
        'ext' => '.pdf',
        'type' => 'PDF',
        'classif' => 2, // INTERNAL
        'uploader' => 2,
    ],
    [
        'id' => 16,
        'src' => $storageBase . '/Slides_PPT/Slide_Phan_tich_Chung_cu_Dien_tu.svg',
        'sub' => 'Slides_PPT',
        'guid' => 'Slide_Phan_tich_Chung_cu_Dien_tu.svg',
        'orig' => 'Slide_Phan_tich_Chung_cu_Dien_tu.svg',
        'mime' => 'image/svg+xml',
        'ext' => '.svg',
        'type' => 'IMAGE',
        'classif' => 2, // INTERNAL
        'uploader' => 2,
    ],
    [
        'id' => 17,
        'src' => $storageBase . '/Documents/Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx',
        'sub' => 'Documents',
        'guid' => 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx',
        'orig' => 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx',
        'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ext' => '.xlsx',
        'type' => 'DOCUMENT',
        'classif' => 1, // NORMAL
        'uploader' => 1,
    ],
    [
        'id' => 18,
        'src' => $storageBase . '/Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx',
        'sub' => 'Documents',
        'guid' => 'Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx',
        'orig' => 'Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx',
        'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ext' => '.xlsx',
        'type' => 'DOCUMENT',
        'classif' => 1, // NORMAL
        'uploader' => 1,
    ]
];

foreach ($filesData as $f) {
    $targetDir = $storageBase . '/' . $f['sub'];
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    $targetPath = $targetDir . '/' . $f['guid'];
    if (file_exists($f['src']) && $f['src'] !== $targetPath) {
        copy($f['src'], $targetPath);
    } elseif (!file_exists($targetPath)) {
        file_put_contents($targetPath, "VALID STORAGE FILE CONTENT FOR " . $f['orig']);
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

// 13. FILE_VERSIONS: Add v2 for File 1
$v2Guid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479_v2.pdf';
$v2Rel = 'Storage/2026/09/01/' . $v2Guid;
$v2Full = $storageBase . '/2026/09/01/' . $v2Guid;
$v2Sha = file_exists($v2Full) ? hash_file('sha256', $v2Full) : hash('sha256', 'v2');
$mysqli->query("INSERT INTO `file_versions` (`file_id`, `version`, `stored_name`, `storage_path`, `checksum_sha256`, `uploaded_by`, `change_note`)
VALUES (1, 2, '$v2Guid', '$v2Rel', '$v2Sha', 2, 'Cập nhật bổ sung Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân')
ON DUPLICATE KEY UPDATE `change_note`=VALUES(`change_note`);");
echo "[x] files & file_versions: OK (" . count($filesData) . " tap tin hoc lieu)\n";

// 14. LECTURES (12 bài giảng điện tử CAND)
$mysqli->query("INSERT INTO `lectures` (`id`, `subject_id`, `teacher_id`, `title`, `description`, `status`, `publish_at`, `version`) VALUES
(1, 1, 2, 'Kỹ thuật Khám nghiệm hiện trường vụ án hình sự', 'Quy trình thu thập mẫu vật, khám nghiệm và bảo quản tang thư nghiệp vụ CAND', 'PUBLISHED', '2026-09-01 08:00:00', 1),
(2, 2, 3, 'Phòng chống Tấn công mạng & Bảo vệ Bí mật Nhà nước', 'Phân tích mã độc, bảo vệ hạ tầng máy chủ nội bộ trong lực lượng Công an', 'PUBLISHED', '2026-09-02 08:00:00', 1),
(3, 3, 4, 'Quy trình Tố tụng Hình sự trong giai đoạn khởi tố', 'Áp dụng Bộ luật TTHS vào công tác bắt giữ người, tạm giữ và điều tra ban đầu', 'PUBLISHED', '2026-09-03 08:00:00', 1),
(4, 2, 3, 'Hồ sơ an ninh mạng chuyên sâu (Học phần đã đóng)', 'Chuyên đề mật đã kết thúc để phục vụ kiểm tra đánh giá hết học phần', 'CLOSED', '2026-08-01 08:00:00', 1),
(5, 4, 4, 'Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Phương án bố trí trinh sát ngoại tuyến bảo vệ an toàn các sự kiện chính trị trọng điểm', 'PUBLISHED', '2026-09-05 08:00:00', 1),
(6, 5, 2, 'Giám định Kỹ thuật hình sự & Phân tích Chứng cứ số', 'Thực hành sao chép bit-stream đĩa cứng, trích xuất RAM và đối chiếu hash SHA-256', 'PUBLISHED', '2026-09-06 08:00:00', 1),
(7, 6, 2, 'Điều tra Tội phạm Rửa tiền & Tội phạm Kinh tế số', 'Phương pháp theo vết dòng tiền điện tử và xác định tài sản tham nhũng ngụy trang', 'PUBLISHED', '2026-09-07 08:00:00', 1),
(8, 7, 4, 'Quản lý Nhà nước về An ninh Trật tự cơ sở', 'Triển khai Đề án 06 về cơ sở dữ liệu dân cư và định danh xác thực điện tử VNeID', 'PUBLISHED', '2026-09-08 08:00:00', 1),
(9, 8, 3, 'Tác chiến Không gian mạng & Trinh sát Kỹ thuật điện tử', 'Kỹ thuật phân tích tín hiệu vô tuyến, phát hiện thiết bị nghe lén và bảo vệ mật mã', 'SCHEDULED', '2026-09-20 08:00:00', 1),
(10, 1, 2, 'Kỹ thuật Phục hồi Dấu vết Đạn đạo & Cơ học (Bản thảo)', 'Đang bổ sung học liệu ảnh 3D và video thực hành tại trường bắn', 'DRAFT', NULL, 1),
(11, 2, 3, 'Điều tra Tội phạm Lừa đảo Chiếm đoạt Tài sản qua Mạng', 'Phân tích các chiêu thức lừa đảo giả danh cơ quan tư pháp và công nghệ Deepfake', 'PUBLISHED', '2026-09-09 08:00:00', 1),
(12, 3, 4, 'Thực hành Hỏi cung Bị can và Đối chất theo BLTTHS', 'Tâm lý học tội phạm và chiến thuật hỏi cung bị can ngoan cố, quanh co chối tội', 'PUBLISHED', '2026-09-10 08:00:00', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `description`=VALUES(`description`), `status`=VALUES(`status`);");
echo "[x] lectures: OK (12 bai giang)\n";

// 15. LECTURE_FILES (Đính kèm học liệu vào bài giảng)
$mysqli->query("INSERT INTO `lecture_files` (`lecture_id`, `file_id`, `display_order`, `is_visible`, `is_downloadable`, `is_printable`) VALUES
-- Bài 1 (Khám nghiệm): PDF giáo trình, Video kỹ thuật, Audio lời khai, Biểu mẫu
(1, 1, 1, TRUE, TRUE, TRUE),
(1, 2, 2, TRUE, FALSE, FALSE),
(1, 7, 3, TRUE, FALSE, FALSE),
(1, 17, 4, TRUE, TRUE, FALSE),

-- Bài 2 (An ninh mạng): Slide SVG, PDF Tối mật, Sơ đồ JPG, Video thực hành, Video IP
(2, 3, 1, TRUE, TRUE, FALSE),
(2, 5, 2, TRUE, FALSE, FALSE),
(2, 6, 3, TRUE, TRUE, FALSE),
(2, 8, 4, TRUE, FALSE, FALSE),
(2, 14, 5, TRUE, FALSE, FALSE),

-- Bài 3 (Tố tụng hình sự): Đề cương PDF, Video diễn án, Slide SVG quy trình
(3, 4, 1, TRUE, TRUE, TRUE),
(3, 9, 2, TRUE, FALSE, FALSE),
(3, 10, 3, TRUE, TRUE, FALSE),

-- Bài 4 (Closed): Slide SVG
(4, 3, 1, TRUE, TRUE, FALSE),

-- Bài 5 (Trinh sát thực địa): Giáo trình PDF, Bản đồ JPG, Video mục tiêu
(5, 11, 1, TRUE, TRUE, TRUE),
(5, 12, 2, TRUE, FALSE, FALSE),
(5, 13, 3, TRUE, FALSE, FALSE),

-- Bài 6 (Giám định số): Sổ tay PDF, Slide SVG, Video IP
(6, 15, 1, TRUE, TRUE, TRUE),
(6, 16, 2, TRUE, TRUE, FALSE),
(6, 14, 3, TRUE, FALSE, FALSE),

-- Bài 7 (Án kinh tế): Đề cương PDF, Biểu mẫu XLSX
(7, 4, 1, TRUE, TRUE, TRUE),
(7, 17, 2, TRUE, TRUE, FALSE),

-- Bài 8 (QLNN về ANTT): Đề cương PDF, Biểu mẫu XLSX
(8, 4, 1, TRUE, TRUE, TRUE),
(8, 18, 2, TRUE, TRUE, FALSE),

-- Bài 9 (Tác chiến điện tử): Sơ đồ JPG, Video thực hành
(9, 6, 1, TRUE, TRUE, FALSE),
(9, 8, 2, TRUE, FALSE, FALSE),

-- Bài 11 (Lừa đảo mạng): Slide SVG, Video mã độc
(11, 3, 1, TRUE, TRUE, FALSE),
(11, 14, 2, TRUE, FALSE, FALSE),

-- Bài 12 (Hỏi cung bị can): Audio ghi âm, Đề cương PDF
(12, 7, 1, TRUE, FALSE, FALSE),
(12, 4, 2, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE `is_visible`=VALUES(`is_visible`), `is_downloadable`=VALUES(`is_downloadable`);");
echo "[x] lecture_files: OK (30+ dinh kem hoc lieu)\n";

// 16. LECTURE_PERMISSIONS (Phân quyền bài giảng theo lớp)
$mysqli->query("INSERT INTO `lecture_permissions` (`lecture_id`, `class_id`, `can_view`, `publish_at`) VALUES
-- Bài 1: D31A, D31C, D32A, CH10
(1, 1, TRUE, '2026-09-01 08:00:00'),
(1, 3, TRUE, '2026-09-01 08:00:00'),
(1, 4, TRUE, '2026-09-01 08:00:00'),
(1, 8, TRUE, '2026-09-01 08:00:00'),

-- Bài 2: D31A, D31B, D32B, CH10
(2, 1, TRUE, '2026-09-02 08:00:00'),
(2, 2, TRUE, '2026-09-02 08:00:00'),
(2, 5, TRUE, '2026-09-02 08:00:00'),
(2, 8, TRUE, '2026-09-02 08:00:00'),

-- Bài 3: D31A, LT15, VB2_K8
(3, 1, TRUE, '2026-09-03 08:00:00'),
(3, 6, TRUE, '2026-09-03 08:00:00'),
(3, 7, TRUE, '2026-09-03 08:00:00'),

-- Bài 4 (Closed): D31A
(4, 1, TRUE, '2026-08-01 08:00:00'),

-- Bài 5: D31A, D32A, VB2_K8
(5, 1, TRUE, '2026-09-05 08:00:00'),
(5, 4, TRUE, '2026-09-05 08:00:00'),
(5, 7, TRUE, '2026-09-05 08:00:00'),

-- Bài 6: D31A, D31B, D31C
(6, 1, TRUE, '2026-09-06 08:00:00'),
(6, 2, TRUE, '2026-09-06 08:00:00'),
(6, 3, TRUE, '2026-09-06 08:00:00'),

-- Bài 7: D31A, D32A, LT15
(7, 1, TRUE, '2026-09-07 08:00:00'),
(7, 4, TRUE, '2026-09-07 08:00:00'),
(7, 6, TRUE, '2026-09-07 08:00:00'),

-- Bài 8: D31A, LT15, VB2_K8
(8, 1, TRUE, '2026-09-08 08:00:00'),
(8, 6, TRUE, '2026-09-08 08:00:00'),
(8, 7, TRUE, '2026-09-08 08:00:00'),

-- Bài 9: D31B, D32B, CH10
(9, 2, TRUE, '2026-09-20 08:00:00'),
(9, 5, TRUE, '2026-09-20 08:00:00'),
(9, 8, TRUE, '2026-09-20 08:00:00'),

-- Bài 11: D31A, D31B, LT15
(11, 1, TRUE, '2026-09-09 08:00:00'),
(11, 2, TRUE, '2026-09-09 08:00:00'),
(11, 6, TRUE, '2026-09-09 08:00:00'),

-- Bài 12: D31A, D31C, VB2_K8
(12, 1, TRUE, '2026-09-10 08:00:00'),
(12, 3, TRUE, '2026-09-10 08:00:00'),
(12, 7, TRUE, '2026-09-10 08:00:00')
ON DUPLICATE KEY UPDATE `can_view`=VALUES(`can_view`);");
echo "[x] lecture_permissions: OK (30+ phan quyen bai giang)\n";

// 17. FILE_PERMISSIONS
$mysqli->query("INSERT INTO `file_permissions` (`id`, `file_id`, `user_id`, `class_id`, `can_view`, `can_download`, `can_print`, `access_reason`) VALUES
(1, 5, 8, NULL, TRUE, FALSE, FALSE, 'Được cấp quyền nghiên cứu chuyên đề Đề tài Khoa học cấp Bộ'),
(2, 6, NULL, 6, TRUE, TRUE, FALSE, 'Cấp quyền toàn bộ Lớp LT15 nghiên cứu chuyên đề sơ đồ hạ tầng'),
(3, 7, 5, NULL, TRUE, TRUE, FALSE, 'Cấp quyền đặc cách tải file ghi âm phục vụ diễn tập thực nghiệm'),
(4, 11, NULL, 1, TRUE, TRUE, TRUE, 'Cấp quyền Lớp D31A in giáo trình trinh sát thực địa'),
(5, 13, 7, NULL, TRUE, FALSE, FALSE, 'Phân quyền học viên xuất sắc tham gia tổ vẽ bản đồ tác chiến')
ON DUPLICATE KEY UPDATE `can_view`=VALUES(`can_view`), `can_download`=VALUES(`can_download`);");
echo "[x] file_permissions: OK (5 ngoai le phan quyen)\n";

// 18. WATCH_HISTORY
$mysqli->query("INSERT INTO `watch_history` (`id`, `user_id`, `file_id`, `lecture_id`, `last_position_seconds`, `duration_seconds`, `completed`, `last_watched_at`) VALUES
(1, 5, 2, 1, 142.500, 300.000, FALSE, '2026-09-09 10:15:30'),
(2, 7, 8, 2, 285.000, 285.000, TRUE, '2026-09-08 16:45:10'),
(3, 8, 8, 2, 75.200, 285.000, FALSE, '2026-09-09 08:30:22'),
(4, 5, 7, 1, 120.000, 240.000, FALSE, '2026-09-09 11:00:00'),
(5, 6, 2, 1, 290.000, 300.000, TRUE, '2026-09-09 14:20:00'),
(6, 9, 9, 3, 200.000, 300.000, FALSE, '2026-09-10 09:10:00'),
(7, 10, 12, 5, 300.000, 300.000, TRUE, '2026-09-10 11:30:00'),
(8, 11, 2, 1, 180.000, 300.000, FALSE, '2026-09-11 08:15:00'),
(9, 12, 2, 1, 300.000, 300.000, TRUE, '2026-09-11 09:40:00'),
(10, 13, 8, 2, 285.000, 285.000, TRUE, '2026-09-11 14:00:00'),
(11, 14, 14, 6, 150.000, 300.000, FALSE, '2026-09-12 10:20:00'),
(12, 15, 14, 6, 300.000, 300.000, TRUE, '2026-09-12 15:45:00'),
(13, 16, 9, 3, 110.000, 300.000, FALSE, '2026-09-13 08:30:00'),
(14, 17, 12, 5, 250.000, 300.000, FALSE, '2026-09-13 13:10:00'),
(15, 18, 2, 1, 300.000, 300.000, TRUE, '2026-09-14 09:00:00')
ON DUPLICATE KEY UPDATE `last_position_seconds`=VALUES(`last_position_seconds`), `completed`=VALUES(`completed`);");
echo "[x] watch_history: OK (15 ban ghi lich su xem)\n";

// 19. QUIZ_QUESTIONS
$quizData = [
    [
        'lecture_id' => 1,
        'order_index' => 1,
        'question' => 'Khi tiếp cận hiện trường vụ án hình sự, nguyên tắc bảo vệ hiện trường quan trọng nhất là gì?',
        'options' => [
            'Thu gom toàn bộ vật chứng vào túi ni lông ngay lập tức',
            'Giữ nguyên trạng thái hiện trường, căng dây phong tỏa và ghi nhận dấu vết ban đầu',
            'Cho phép người dân vào hỗ trợ tìm kiếm chứng cứ',
            'Chụp ảnh lưu niệm rồi dọn dẹp hiện trường sạch sẽ'
        ],
        'correct' => 1,
        'explanation' => 'Theo quy định tố tụng hình sự và nghiệp vụ trinh sát CAND, bảo vệ nguyên trạng hiện trường là điều kiện tiên quyết để khám nghiệm chính xác.'
    ],
    [
        'lecture_id' => 1,
        'order_index' => 2,
        'question' => 'Trong kỹ thuật thu thập dấu vết đường vân (vân tay) tiềm ẩn trên bề mặt nhẵn, phương pháp nào thông dụng nhất?',
        'options' => [
            'Dùng bột than chì hoặc bột từ quét nhẹ bằng chổi lông chuyên dụng',
            'Rửa nước xà phòng để làm nổi đường vân',
            'Dùng đèn cồn hơ nóng trực tiếp bề mặt',
            'Dùng băng dính thông thường dán đè lên'
        ],
        'correct' => 0,
        'explanation' => 'Bột từ và chổi lông sóc chuyên dụng giúp làm hiện rõ các hạt mồ hôi và chất nhờn bám trên bề mặt nhẵn mà không làm hỏng vi vết.'
    ],
    [
        'lecture_id' => 2,
        'order_index' => 1,
        'question' => 'Để bảo đảm tính toàn vẹn của chứng cứ điện tử thu giữ từ ổ cứng máy tính nghi phạm, kỹ thuật viên phải thực hiện thao tác nào?',
        'options' => [
            'Bật nguồn máy tính để kiểm tra trực tiếp tập tin nghi vấn',
            'Tạo bản sao bảo toàn bit-stream (Forensic Image) và tính toán mã băm SHA-256 đối chiếu toàn vẹn',
            'Đổi mật khẩu người dùng để khóa quyền truy cập',
            'Gửi ổ cứng qua bưu điện không cần niêm phong túi tĩnh điện'
        ],
        'correct' => 1,
        'explanation' => 'Tính toàn vẹn của chứng cứ điện tử chỉ được thừa nhận trước tòa khi mã băm SHA-256 của bản sao trùng khớp tuyệt đối với thiết bị gốc.'
    ],
    [
        'lecture_id' => 2,
        'order_index' => 2,
        'question' => 'Khi phát hiện một máy trạm trong mạng nội bộ Intranet bị nhiễm mã độc Ransomware, thao tác đầu tiên là gì?',
        'options' => [
            'Tắt nguồn máy tính đột ngột bằng cách rút dây điện',
            'Rút cáp mạng LAN / ngắt kết nối mạng ngay lập tức để cách ly lây lan diện rộng',
            'Mở phần mềm diệt virus quét toàn bộ ổ đĩa',
            'Gửi email cảnh báo đính kèm file nghi nhiễm cho toàn đơn vị'
        ],
        'correct' => 1,
        'explanation' => 'Cách ly vật lý khỏi mạng LAN ngay lập tức ngăn chặn mã độc phát tán ngang (lateral movement) sang các máy chủ dữ liệu trọng yếu khác.'
    ],
    [
        'lecture_id' => 3,
        'order_index' => 1,
        'question' => 'Thời hạn tạm giữ người theo thủ tục tố tụng hình sự tối đa không quá bao nhiêu ngày?',
        'options' => [
            '3 ngày',
            '9 ngày (tối đa 3 ngày và có thể gia hạn 2 lần, mỗi lần không quá 3 ngày)',
            '15 ngày',
            '30 ngày'
        ],
        'correct' => 1,
        'explanation' => 'Điều 118 BLTTHS 2015 quy định thời hạn tạm giữ là 3 ngày, trường hợp cần thiết có thể gia hạn 2 lần, mỗi lần không quá 3 ngày.'
    ],
    [
        'lecture_id' => 5,
        'order_index' => 1,
        'question' => 'Nguyên tắc cao nhất trong công tác trinh sát bảo vệ mục tiêu chính trị trọng điểm là gì?',
        'options' => [
            'Chủ động phòng ngừa, phát hiện từ sớm từ xa, không để bị động bất ngờ',
            'Bố trí lực lượng công khai càng đông càng tốt',
            'Chỉ xử lý khi có đối tượng đột nhập vào khu vực cấm',
            'Sử dụng vũ khí quân dụng trong mọi tình huống tụ tập'
        ],
        'correct' => 0,
        'explanation' => 'Phương châm tác chiến an ninh CAND là chủ động nắm tình hình từ sớm, từ xa, giải quyết triệt để nguy cơ tiềm ẩn.'
    ],
    [
        'lecture_id' => 6,
        'order_index' => 1,
        'question' => 'Tại sao cần thu thập dữ liệu bộ nhớ RAM (Live Memory Acquisition) trước khi tắt máy tính tang vật?',
        'options' => [
            'Vì RAM chứa các khóa mã hóa ổ đĩa (BitLocker), kết nối mạng đang mở và tiến trình độc hại chạy ngầm sẽ mất khi mất nguồn',
            'Vì RAM lưu trữ toàn bộ hệ điều hành vĩnh viễn',
            'Vì tắt máy sẽ làm hỏng phần cứng bo mạch chủ',
            'Vì luật quy định bắt buộc phải nộp thanh RAM cho tòa án'
        ],
        'correct' => 0,
        'explanation' => 'Dữ liệu RAM là bộ nhớ khả biến (volatile), chứa nhiều chứng cứ số vô giá như key giải mã AES, kết nối C2C và tin nhắn chưa kịp lưu vào đĩa.'
    ],
    [
        'lecture_id' => 7,
        'order_index' => 1,
        'question' => 'Đặc điểm điển hình của giai đoạn "Rửa tiền" trong tội phạm kinh tế là gì?',
        'options' => [
            'Tách rời (Layering) dòng tiền thông qua chuỗi giao dịch phức tạp để che giấu nguồn gốc phi pháp',
            'Chỉ sử dụng tiền mặt mệnh giá nhỏ',
            'Gửi tiết kiệm tại ngân hàng nhà nước đứng tên chính chủ',
            'Quyên góp toàn bộ cho các quỹ từ thiện công khai'
        ],
        'correct' => 0,
        'explanation' => 'Quy trình rửa tiền gồm 3 giai đoạn: Đặt tiền (Placement), Tách rời (Layering) và Tích hợp (Integration).'
    ]
];

$stmtQuiz = $mysqli->prepare("INSERT INTO `quiz_questions` (`lecture_id`, `question`, `options_json`, `correct_index`, `explanation`, `order_index`) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($quizData as $q) {
    $optJson = json_encode($q['options'], JSON_UNESCAPED_UNICODE);
    $stmtQuiz->bind_param("issisi", $q['lecture_id'], $q['question'], $optJson, $q['correct'], $q['explanation'], $q['order_index']);
    $stmtQuiz->execute();
}
echo "[x] quiz_questions: OK (" . count($quizData) . " cau hoi trac nghiem nghiep vu)\n";

// 19b. LECTURE_PARTS (Cấu trúc 5 phần chuẩn đào tạo Sĩ quan CAND)
$lecturePartsData = [
    1 => [
        [1, 'Phần 1: Mục tiêu & Yêu cầu Khám nghiệm Hiện trường', 'Đề cương, căn cứ pháp lý theo BLTTHS & yêu cầu nghiệp vụ khám nghiệm', '15 phút', 15, 'doc', 'BookOpen', 'Yêu cầu sĩ quan điều tra nắm vững nguyên tắc bảo vệ hiện trường, phương pháp tiếp cận và ghi nhận dấu vết ban đầu.'],
        [2, 'Phần 2: Lý thuyết Khám nghiệm Chuyên đề & Trình chiếu', 'Slide bài giảng kỹ thuật bảo vệ hiện trường & Video thực địa trinh sát viên', '45 phút', 45, 'video', 'Video', 'Theo dõi video hướng dẫn kỹ thuật thu thập dấu vết vân tay, mẫu sinh học và slide bài giảng điện tử của Trưởng khoa ANDT.'],
        [3, 'Phần 3: Sơ đồ Hiện trường Vụ án & Tình huống Thực địa', 'Bản đồ tác chiến hiện trường vụ án, sơ đồ bố trí lực lượng & tọa độ dấu vết', '30 phút', 30, 'image', 'ImageIcon', 'Phân tích bản đồ hiện trường vụ án mạng, đánh giá hướng tẩu thoát của đối tượng và vị trí thu giữ hung khí.'],
        [4, 'Phần 4: Văn bản Quy phạm & Biên bản Khám nghiệm mẫu', 'Bộ luật TTHS 2015, Thông tư Bộ Công An về công tác khám nghiệm hiện trường', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu biểu mẫu biên bản khám nghiệm hiện trường, quy định niêm phong vật chứng và chứng cứ pháp lý.'],
        [5, 'Phần 5: Đánh giá Kỹ năng Khám nghiệm & Sổ tay Thu hoạch', 'Trắc nghiệm đánh giá nghiệp vụ điều tra & sổ tay thu hoạch cán bộ', '20 phút', 20, 'quiz', 'HelpCircle', 'Học viên hoàn thành 5 câu hỏi ôn tập chuyên đề và ghi chép kinh nghiệm nghiệp vụ vào sổ tay điện tử.']
    ],
    2 => [
        [1, 'Phần 1: Mục tiêu & Căn cứ Pháp lý An ninh mạng', 'Luật An ninh mạng 2018, Luật Bảo vệ Bí mật Nhà nước & Tiêu chuẩn bảo mật', '15 phút', 15, 'doc', 'BookOpen', 'Nắm vững các hành vi bị cấm trên không gian mạng và trách nhiệm bảo vệ dữ liệu bí mật nhà nước độ Tối Mật, Tuyệt Mật.'],
        [2, 'Phần 2: Kỹ thuật Phòng thủ Mạng & Video Huấn luyện', 'Slide phân tích kỹ thuật APT & Video thao diễn ngăn chặn mã độc nguy hiểm', '45 phút', 45, 'video', 'Video', 'Video thực nghiệm phân tích chuỗi tấn công APT của nhóm gián điệp mạng và các biện pháp ứng cứu sự cố khẩn cấp.'],
        [3, 'Phần 3: Sơ đồ Kiến trúc Mạng & Bản đồ Luồng tấn công', 'Sơ đồ mạng bảo vệ nội bộ T04, luồng bóc tách dữ liệu và vùng phi quân sự DMZ', '30 phút', 30, 'image', 'ImageIcon', 'Quan sát bản đồ phân luồng truy cập và các điểm giám sát an ninh (IDS/IPS) trên mạng diện rộng ngành CAND.'],
        [4, 'Phần 4: Quy chế An toàn Thông tin & Nghị định Chính phủ', 'Nghị định 53/2022/NĐ-CP và Quy định sử dụng thiết bị lưu trữ di động', '25 phút', 25, 'doc', 'FileText', 'Tra cứu văn bản quy định điều kiện an ninh mạng đối với hệ thống thông tin quan trọng về an ninh quốc gia.'],
        [5, 'Phần 5: Kiểm tra Đánh giá Phòng thủ Mạng & Thu hoạch', 'Bài kiểm tra tình huống ứng phó tấn công mạng và thu hoạch bài học', '20 phút', 20, 'quiz', 'HelpCircle', 'Thực hiện bài kiểm tra trắc nghiệm nhận diện nguy cơ mã độc và biện pháp bảo mật thiết bị nghiệp vụ.']
    ],
    3 => [
        [1, 'Phần 1: Căn cứ Khởi tố Vụ án & Quyền hạn Điều tra viên', 'Thẩm quyền của Cơ quan An ninh điều tra theo BLTTHS 2015', '15 phút', 15, 'doc', 'BookOpen', 'Xác định các dấu hiệu tội phạm cấu thành căn cứ khởi tố vụ án hình sự về xâm phạm an ninh quốc gia.'],
        [2, 'Phần 2: Trình tự Tố tụng & Video Thực hành Diễn án', 'Slide trình tự giải quyết tin báo & Video thực hành diễn án khởi tố bị can', '45 phút', 45, 'video', 'Video', 'Theo dõi diễn án thực hành quy trình tống đạt quyết định khởi tố và kiểm sát viên tham gia giám sát.'],
        [3, 'Phần 3: Sơ đồ Quy trình Tố tụng & Sơ đồ Tổ chức Khởi tố', 'Sơ đồ phân định thẩm quyền khởi tố, thời hạn tạm giam và gia hạn điều tra', '30 phút', 30, 'image', 'ImageIcon', 'Sơ đồ hóa các mốc thời gian tố tụng từ khi thụ lý nguồn tin đến khi ban hành kết luận điều tra.'],
        [4, 'Phần 4: Hệ thống Văn bản Mẫu Tố tụng Hình sự', 'Các biểu mẫu tố tụng theo Thông tư liên tịch VKS - BCA - TANDTC', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu các mẫu lệnh bắt, lệnh tạm giữ, quyết định khởi tố vụ án và lệnh khám xét khẩn cấp.'],
        [5, 'Phần 5: Trắc nghiệm Quy trình Khởi tố & Thu hoạch Tố tụng', 'Bài kiểm tra năng lực áp dụng pháp luật tố tụng và thu hoạch cá nhân', '20 phút', 20, 'quiz', 'HelpCircle', 'Đánh giá kiến thức về căn cứ phê chuẩn của Viện kiểm sát và thẩm quyền điều tra viên.']
    ],
    4 => [
        [1, 'Phần 1: Căn cứ Lập hồ sơ & Nguyên tắc Bảo mật', 'Quy chế công tác hồ sơ nghiệp vụ an ninh và bảo mật tài liệu chuyên môn', '15 phút', 15, 'doc', 'BookOpen', 'Quy định về lập, đăng ký, quản lý và sử dụng hồ sơ nghiệp vụ trong công tác an ninh mạng.'],
        [2, 'Phần 2: Lý thuyết Phân loại & Hồ sơ Số hóa', 'Slide quy chuẩn lập hồ sơ điện tử và video hướng dẫn tra cứu hồ sơ', '40 phút', 40, 'slide', 'Video', 'Hệ thống hóa tiêu chuẩn số hóa hồ sơ nghiệp vụ theo quy chuẩn của Cục Hồ sơ nghiệp vụ (V06).'],
        [3, 'Phần 3: Sơ đồ Quản lý & Vòng đời Hồ sơ Nghiệp vụ', 'Sơ đồ tiếp nhận, phân loại, giải mật và lưu trữ hồ sơ nghiệp vụ chuyên án', '30 phút', 30, 'image', 'ImageIcon', 'Mô hình hóa chu trình bảo quản tài liệu chuyên án từ giai đoạn khởi lập đến nộp lưu trữ vĩnh viễn.'],
        [4, 'Phần 4: Quy chế Quản lý Hồ sơ & Pháp lệnh Bảo vệ', 'Văn bản hướng dẫn của Bộ Công An về công tác lưu trữ hồ sơ đặc thù', '25 phút', 25, 'doc', 'FileText', 'Văn bản quy định chế độ bảo vệ bí mật hồ sơ nghiệp vụ đối với các vụ án xâm phạm an ninh quốc gia.'],
        [5, 'Phần 5: Kiểm tra Nghiệp vụ Hồ sơ & Sổ tay Thu hoạch', 'Đánh giá kỹ năng lập và khai thác hồ sơ lưu trữ an ninh', '20 phút', 20, 'quiz', 'HelpCircle', 'Học viên kiểm tra nhận thức về thời hạn bảo quản hồ sơ và thẩm quyền giải mật tài liệu.']
    ],
    5 => [
        [1, 'Phần 1: Mục tiêu & Yêu cầu Chiến thuật Trinh sát', 'Mục tiêu tác chiến, đối tượng giám sát và phạm vi bảo vệ mục tiêu trọng yếu', '15 phút', 15, 'doc', 'BookOpen', 'Các nguyên tắc bí mật, linh hoạt, chủ động trong bố trí lực lượng trinh sát thực địa.'],
        [2, 'Phần 2: Kỹ năng Trinh sát & Video Diễn tập Thực địa', 'Slide chiến thuật tiếp cận mục tiêu & Video diễn tập phương án tác chiến A2', '45 phút', 45, 'video', 'Video', 'Ghi hình thực hành kỹ thuật theo dõi, giám sát bí mật và phối hợp tác chiến đón lõng đối tượng nguy hiểm.'],
        [3, 'Phần 3: Bản đồ Tác chiến & Phương án Bố trí Lực lượng', 'Bản đồ diễn tập thực địa, các chốt chặn và cung đường cơ động chiến đấu', '30 phút', 30, 'image', 'ImageIcon', 'Phương án bố trí đội hình bảo vệ mục tiêu trọng yếu và sơ đồ thoát hiểm khi xảy ra tình huống khẩn cấp.'],
        [4, 'Phần 4: Kế hoạch Tác chiến & Mệnh lệnh Hành động', 'Kế hoạch bảo vệ mục tiêu của Công an thành phố và quy trình sử dụng vũ khí', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu quy định pháp luật về nổ súng cảnh cáo và sử dụng công cụ hỗ trợ theo Luật CAND.'],
        [5, 'Phần 5: Sát hạch Chiến thuật Thực địa & Bài học Kinh nghiệm', 'Đánh giá khả năng xử lý tình huống thực địa và thu hoạch nghiệp vụ', '20 phút', 20, 'quiz', 'HelpCircle', 'Trả lời các câu hỏi tình huống về cách xử lý khi lộ bí mật trinh sát hoặc đối tượng chống trả.']
    ],
    6 => [
        [1, 'Phần 1: Nguyên tắc Thu thập & Bảo quản Chứng cứ số', 'Tiêu chuẩn bảo đảm tính toàn vẹn của dữ liệu điện tử theo ISO/IEC 27037', '15 phút', 15, 'doc', 'BookOpen', 'Nguyên tắc bất biến của chứng cứ số: Chain of Custody, Write Blocker và Hash Verification.'],
        [2, 'Phần 2: Kỹ thuật Giám định Số & Video Trích xuất Dữ liệu', 'Slide phương pháp dump RAM, phục hồi dữ liệu ổ cứng & Video thực hành', '45 phút', 45, 'video', 'Video', 'Video thao diễn sử dụng thiết bị trích xuất dữ liệu chuyên dụng Tableau và phần mềm phân tích EnCase.'],
        [3, 'Phần 3: Sơ đồ Luồng Dữ liệu & Cấu trúc Phân vùng Bộ nhớ', 'Sơ đồ cấu trúc Master Boot Record, phân vùng GPT và log hệ thống sự kiện', '30 phút', 30, 'image', 'ImageIcon', 'Phân tích cấu trúc bảng phân vùng ổ đĩa và vị trí lưu trữ dấu vết xóa file của đối tượng vi phạm.'],
        [4, 'Phần 4: Quy chuẩn Giám định Tư pháp & Biểu mẫu Báo cáo', 'Luật Giám định tư pháp và Mẫu kết luận giám định kỹ thuật số phục vụ tòa án', '25 phút', 25, 'doc', 'FileText', 'Quy cách lập bản kết luận giám định chứng cứ điện tử đáp ứng yêu cầu tranh tụng tại phiên tòa.'],
        [5, 'Phần 5: Đánh giá Năng lực Phân tích Chứng cứ số & Thu hoạch', 'Bài tập phân tích giá trị chứng minh của dấu vết kỹ thuật số', '20 phút', 20, 'quiz', 'HelpCircle', 'Kiểm tra hiểu biết về thuật toán băm SHA-256, chữ ký số và điều kiện chứng cứ số được công nhận.']
    ]
];

$stmtPart = $mysqli->prepare("
    INSERT INTO `lecture_parts` (`lecture_id`, `part_number`, `title`, `subtitle`, `duration_text`, `duration_minutes`, `default_tab`, `icon_name`, `description`)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        `title` = VALUES(`title`),
        `subtitle` = VALUES(`subtitle`),
        `duration_text` = VALUES(`duration_text`),
        `duration_minutes` = VALUES(`duration_minutes`),
        `default_tab` = VALUES(`default_tab`),
        `icon_name` = VALUES(`icon_name`),
        `description` = VALUES(`description`)
");

$resLecList = $mysqli->query("SELECT `id`, `title` FROM `lectures` ORDER BY `id` ASC");
$totalPartsSeeded = 0;
while ($lecRow = $resLecList->fetch_assoc()) {
    $lId = (int)$lecRow['id'];
    $lTitle = $lecRow['title'];
    $parts = $lecturePartsData[$lId] ?? [
        [1, "Phần 1: Mục tiêu & Yêu cầu Nghiệp vụ ({$lTitle})", "Đề cương chi tiết học phần, yêu cầu đào tạo và chuẩn đầu ra", "15 phút", 15, "doc", "BookOpen", "Nắm vững lý luận nghiệp vụ và phương châm công tác đối với chuyên đề {$lTitle}."],
        [2, "Phần 2: Lý thuyết Chuyên sâu & Trình chiếu Minh họa", "Slide bài giảng số hóa và tư liệu video ghi hình giảng viên", "45 phút", 45, "video", "Video", "Bài giảng chuyên sâu phân tích thực tiễn công tác phòng chống tội phạm và các tình huống nghiệp vụ."],
        [3, "Phần 3: Tình huống Thực địa & Sơ đồ Tác chiến Nghiệp vụ", "Tư liệu sơ đồ hiện trường, bản đồ phối hợp tác chiến các đơn vị", "30 phút", 30, "image", "ImageIcon", "Phân tích sơ đồ tác chiến, đánh giá các điểm then chốt và kế hoạch điều hành tác chiến."],
        [4, "Phần 4: Văn bản Quy phạm Pháp luật & Hồ sơ Mẫu", "Hệ thống văn bản quy phạm pháp luật, chỉ thị, thông tư của Bộ Công An", "25 phút", 25, "doc", "FileText", "Tra cứu và đối chiếu các quy định pháp luật hiện hành áp dụng trực tiếp cho chuyên đề."],
        [5, "Phần 5: Câu hỏi Đánh giá & Sổ tay Thu hoạch Nghiệp vụ", "Bài tập đánh giá nhận thức và ghi nhận thu hoạch học phần", "20 phút", 20, "quiz", "HelpCircle", "Kiểm tra trắc nghiệm đánh giá kiến thức chuyên môn và tổng kết kinh nghiệm vào sổ tay nghiệp vụ."]
    ];
    foreach ($parts as $p) {
        $stmtPart->bind_param("iisssisss", $lId, $p[0], $p[1], $p[2], $p[3], $p[4], $p[5], $p[6], $p[7]);
        $stmtPart->execute();
        $totalPartsSeeded++;
    }
}
echo "[x] lecture_parts: OK ({$totalPartsSeeded} muc phan bo 5 phan theo chuan CAND)\n";

// 20. LEARNING_PROGRESS
$mysqli->query("INSERT INTO `learning_progress` (`id`, `user_id`, `lecture_id`, `progress_percent`, `completed`, `completed_at`, `notes`, `completed_parts`, `quiz_score`, `last_accessed_at`) VALUES
(1, 5, 1, 85.00, FALSE, NULL, 'Ghi chú nghiệp vụ: Chú ý bảo quản dấu vết đường vân trên bề mặt trơn nhẵn; đối chiếu biên bản phải có đủ 4 bên ký tên.', '1,2,3', 100, '2026-09-14 10:45:00'),
(2, 7, 2, 100.00, TRUE, '2026-09-12 17:00:00', 'Đã hoàn thành toàn bộ chuyên đề An ninh mạng và quy trình bảo vệ Bí mật Nhà nước.', '1,2,3,4,5', 100, '2026-09-12 17:00:00'),
(3, 8, 2, 60.00, FALSE, NULL, 'Cần nghiên cứu thêm phần Forensic Image và mã băm SHA-256.', '1,2', 75, '2026-09-13 08:30:00'),
(4, 9, 3, 40.00, FALSE, NULL, 'Nghiên cứu Điều 118 Bộ luật TTHS 2015 về thời hạn tạm giữ người.', '1', NULL, '2026-09-13 14:10:00'),
(5, 10, 5, 90.00, FALSE, NULL, 'Nắm vững nguyên tắc trinh sát ngoại tuyến từ sớm từ xa.', '1,2,3', 90, '2026-09-13 16:20:00'),
(6, 6, 1, 100.00, TRUE, '2026-09-13 15:00:00', 'Đã hoàn thành xuất sắc bài tập thực hành khám nghiệm.', '1,2,3,4', 100, '2026-09-13 15:00:00'),
(7, 11, 1, 75.00, FALSE, NULL, 'Xem lại video phần thu thập dấu vết vân tay.', '1,2', 80, '2026-09-14 09:15:00'),
(8, 12, 1, 100.00, TRUE, '2026-09-14 10:00:00', 'Đã nắm vững phương pháp niêm phong hiện trường.', '1,2,3,4', 95, '2026-09-14 10:00:00'),
(9, 13, 2, 80.00, FALSE, NULL, 'Nghiên cứu quy trình cách ly máy chủ bị nhiễm mã độc.', '1,2,3', 85, '2026-09-14 11:20:00'),
(10, 14, 6, 65.00, FALSE, NULL, 'Cần bổ sung kỹ năng dump memory bằng LiME.', '1,2', NULL, '2026-09-14 14:00:00')
ON DUPLICATE KEY UPDATE `progress_percent`=VALUES(`progress_percent`), `completed`=VALUES(`completed`), `notes`=VALUES(`notes`), `completed_parts`=VALUES(`completed_parts`), `quiz_score`=VALUES(`quiz_score`);");
echo "[x] learning_progress: OK (10 ban ghi tien do hoc tap)\n";

// 21. DOWNLOAD_LOGS (20 bản ghi)
$mysqli->query("INSERT INTO `download_logs` (`id`, `user_id`, `file_id`, `lecture_id`, `ip_address`, `user_agent`, `file_size`, `status`, `denial_reason`, `downloaded_at`) VALUES
(1, 5, 1, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1106, 'SUCCESS', NULL, '2026-09-09 09:12:00'),
(2, 5, 2, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 593061, 'DENIED', 'Tập tin video cấu hình chỉ cho phép xem trực tuyến (is_downloadable=false)', '2026-09-09 09:13:00'),
(3, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1146, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:05:00'),
(4, 7, 3, 2, '192.168.1.112', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1504, 'SUCCESS', NULL, '2026-09-09 11:20:00'),
(5, 2, 1, 1, '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1106, 'SUCCESS', NULL, '2026-09-09 08:00:00'),
(6, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1146, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:06:00'),
(7, 8, 3, 2, '192.168.1.115', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1504, 'SUCCESS', NULL, '2026-09-10 09:30:00'),
(8, 9, 4, 3, '192.168.1.120', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1104, 'SUCCESS', NULL, '2026-09-10 14:15:00'),
(9, 10, 11, 5, '192.168.1.125', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1264, 'SUCCESS', NULL, '2026-09-11 08:45:00'),
(10, 11, 1, 1, '192.168.1.130', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1106, 'SUCCESS', NULL, '2026-09-11 10:20:00'),
(11, 12, 1, 1, '192.168.1.135', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1106, 'SUCCESS', NULL, '2026-09-12 09:10:00'),
(12, 13, 3, 2, '192.168.1.140', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1504, 'SUCCESS', NULL, '2026-09-12 11:35:00'),
(13, 14, 15, 6, '192.168.1.145', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1291, 'SUCCESS', NULL, '2026-09-13 08:50:00'),
(14, 15, 15, 6, '192.168.1.150', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1291, 'SUCCESS', NULL, '2026-09-13 14:20:00'),
(15, 16, 4, 3, '192.168.1.155', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1104, 'SUCCESS', NULL, '2026-09-14 09:15:00')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);");
echo "[x] download_logs: OK (15 ban ghi nhat ky tai)\n";

// 22. AUDIT_LOGS (50 bản ghi kiểm toán phong phú)
$auditInserts = [
    [1, 1, 'SYSTEM_INIT', 'DATABASE', 1, NULL, '{"status": "INITIALIZED", "database": "training_management", "version": "3.2.0"}', 'Khởi tạo cấu trúc CSDL và nạp cấu hình hệ thống', '127.0.0.1', '2026-09-01 00:00:00'],
    [2, 1, 'GRANT_CLEARANCE', 'USER_CLEARANCE', 8, '{"clearance": "NORMAL"}', '{"clearance": "CONFIDENTIAL"}', 'Phê duyệt tham gia Đề tài NCKH cấp Bộ của Khoa ANM', '192.168.1.10', '2026-09-02 09:30:00'],
    [3, 2, 'PUBLISH_LECTURE', 'LECTURE', 1, '{"status": "DRAFT"}', '{"status": "PUBLISHED"}', 'Xuất bản bài giảng Kỹ thuật Khám nghiệm hiện trường', '192.168.1.20', '2026-09-01 08:00:00'],
    [4, 3, 'UPLOAD_FILE', 'FILE', 5, NULL, '{"file_name": "Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf", "classification": "SECRET"}', 'Lưu trữ tài liệu nghiệp vụ an ninh mạng', '192.168.1.25', '2026-09-02 08:30:00'],
    [5, 3, 'CLOSE_LECTURE', 'LECTURE', 4, '{"status": "PUBLISHED"}', '{"status": "CLOSED"}', 'Đóng học phần theo kế hoạch đào tạo năm 2026', '192.168.1.25', '2026-09-05 17:00:00'],
    [6, 2, 'UPLOAD_NEW_VERSION', 'FILE_VERSION', 1, '{"version": 1}', '{"version": 2}', 'Cập nhật bổ sung Nghị định 13 về dữ liệu cá nhân', '192.168.1.20', '2026-09-08 14:00:00'],
    [7, 1, 'UPDATE_CONFIG', 'SYSTEM_SETTING', 1, '{"MAX_STUDENT_DEVICES": "1"}', '{"MAX_STUDENT_DEVICES": "2"}', 'Nâng trần thiết bị đăng nhập đồng thời cho học viên', '192.168.1.10', '2026-09-08 16:30:00'],
    [8, 1, 'REVOKE_SESSION', 'USER_SESSION', 5, '{"status": "ACTIVE"}', '{"status": "REVOKED"}', 'Thu hồi phiên làm việc từ IP nghi vấn 192.168.1.108', '192.168.1.10', '2026-09-09 10:10:00'],
    [9, 2, 'CREATE_LECTURE', 'LECTURE', 6, NULL, '{"title": "Giám định Kỹ thuật hình sự", "subject_id": 5}', 'Biên soạn bài giảng chuyên sâu mới cho Lớp D31C', '192.168.1.20', '2026-09-09 11:00:00'],
    [10, 4, 'PUBLISH_LECTURE', 'LECTURE', 3, '{"status": "DRAFT"}', '{"status": "PUBLISHED"}', 'Phát hành bài giảng Luật TTHS cho Lớp LT15 và VB2_K8', '192.168.1.30', '2026-09-09 14:00:00'],
    [11, 1, 'EXPORT_AUDIT_LOGS', 'AUDIT_TRAIL', 1, NULL, '{"format": "CSV", "range": "2026-09-01_to_2026-09-10"}', 'Xuất báo cáo an ninh định kỳ gửi Ban Giám hiệu', '192.168.1.10', '2026-09-10 08:30:00'],
    [12, 3, 'UPDATE_LECTURE', 'LECTURE', 2, '{"version": 1}', '{"version": 2}', 'Bổ sung video hướng dẫn kỹ thuật phòng chống mã độc', '192.168.1.25', '2026-09-10 10:15:00'],
    [13, 1, 'CREATE_USER', 'USER', 55, NULL, '{"username": "hv_045", "role": "STUDENT", "class": "D31B"}', 'Cấp tài khoản mới cho học viên chuyển lớp', '192.168.1.10', '2026-09-11 09:00:00'],
    [14, 1, 'RESET_PASSWORD', 'USER', 6, NULL, '{"user": "hv_hung", "action": "ADMIN_FORCE_RESET"}', 'Hỗ trợ cấp lại mật khẩu cho học viên quên mật khẩu', '192.168.1.10', '2026-09-11 11:30:00'],
    [15, 2, 'GRANT_FILE_PERMISSION', 'FILE_PERMISSION', 4, NULL, '{"file_id": 11, "class_id": 1, "can_download": true}', 'Cấp đặc cách tải giáo trình cho Lớp D31A đi thực địa', '192.168.1.20', '2026-09-12 08:45:00'],
    [16, 1, 'BACKUP_DATABASE', 'SYSTEM', 1, NULL, '{"backup_file": "backup_dhan_20260912.sql.gz", "size_mb": 14.8}', 'Sao lưu CSDL định kỳ tự động cuối tuần', '127.0.0.1', '2026-09-12 23:00:00'],
    [17, 3, 'LOGIN_FAILED', 'AUTH', 3, NULL, '{"username": "gv_nam", "reason": "WRONG_PASSWORD", "attempts": 2}', 'Đăng nhập sai mật khẩu 2 lần liên tiếp', '192.168.1.25', '2026-09-13 08:05:00'],
    [18, 3, 'LOGIN_SUCCESS', 'AUTH', 3, NULL, '{"username": "gv_nam", "mfa": "TOTP_VERIFIED"}', 'Đăng nhập thành công với xác thực TOTP', '192.168.1.25', '2026-09-13 08:06:00'],
    [19, 1, 'UPDATE_RETENTION', 'RETENTION_POLICY', 1, '{"retention_days": 180}', '{"retention_days": 365}', 'Điều chỉnh thời gian lưu trữ Watch History lên 1 năm', '192.168.1.10', '2026-09-13 15:20:00'],
    [20, 4, 'PUBLISH_LECTURE', 'LECTURE', 8, '{"status": "DRAFT"}', '{"status": "PUBLISHED"}', 'Xuất bản bài giảng Đề án 06 và QLNN về ANTT', '192.168.1.30', '2026-09-14 08:00:00']
];

$stmtAudit = $mysqli->prepare("INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `access_reason`, `ip_address`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($auditInserts as $a) {
    $stmtAudit->bind_param("iississsss", $a[0], $a[1], $a[2], $a[3], $a[4], $a[5], $a[6], $a[7], $a[8], $a[9]);
    $stmtAudit->execute();
}
echo "[x] audit_logs: OK (" . count($auditInserts) . " ban ghi nhat ky kiem toan an ninh)\n";

// 23. SECURITY_ALERTS (10 cảnh báo an ninh)
$alertsData = [
    [1, 6, 'SUSPICIOUS_DOWNLOAD', 'HIGH', 'Học viên liên tiếp yêu cầu tải học liệu Tối mật (SECRET) bị hệ thống từ chối', '192.168.1.108', 'OPEN', NULL, NULL, '2026-09-09 10:06:30'],
    [2, 5, 'ABNORMAL_SESSION', 'MEDIUM', 'Phát hiện cùng tài khoản đăng nhập từ 2 dải IP khác biệt trong vòng 10 phút', '192.168.1.105', 'RESOLVED', 1, '2026-09-09 12:00:00', '2026-09-08 21:15:00'],
    [3, 7, 'FALSE_POSITIVE_RATE_LIMIT', 'LOW', 'Trình duyệt gửi nhiều byte-range request kích hoạt cảnh báo tần suất', '192.168.1.112', 'FALSE_POSITIVE', 1, '2026-09-09 11:30:00', '2026-09-09 11:21:00'],
    [4, 6, 'MULTIPLE_FAILED_LOGINS', 'MEDIUM', 'Phát hiện 5 lần nhập sai mật khẩu liên tiếp trong 3 phút', '192.168.1.108', 'RESOLVED', 1, '2026-09-11 11:40:00', '2026-09-11 11:28:00'],
    [5, 14, 'OFF_HOURS_ACCESS', 'LOW', 'Tài khoản đăng nhập ngoài giờ quy định (02:45 AM) từ dải mạng ký túc xá', '192.168.1.145', 'OPEN', NULL, NULL, '2026-09-12 02:45:00'],
    [6, 8, 'CONCURRENT_SESSION_LIMIT', 'MEDIUM', 'Vượt quá hạn mức 2 thiết bị đăng nhập đồng thời của tài khoản học viên', '192.168.1.115', 'RESOLVED', 1, '2026-09-12 14:00:00', '2026-09-12 13:50:00'],
    [7, 3, 'ELEVATED_CLEARANCE_USAGE', 'LOW', 'Giảng viên tải học liệu Tối mật phục vụ nghiên cứu đề tài đã được cấp phép', '192.168.1.25', 'RESOLVED', 1, '2026-09-13 09:00:00', '2026-09-13 08:30:00'],
    [8, 15, 'SUSPICIOUS_USER_AGENT', 'HIGH', 'Yêu cầu API từ User-Agent bất thường (Python-requests/2.31.0 nghi vấn quét lỗ hổng)', '192.168.1.200', 'INVESTIGATING', NULL, NULL, '2026-09-13 16:15:00'],
    [9, 1, 'ADMIN_SESSION_ACTIVE', 'LOW', 'Phiên quản trị viên cấp cao hoạt động trên 6 giờ liên tục', '192.168.1.10', 'RESOLVED', 1, '2026-09-14 12:00:00', '2026-09-14 08:00:00'],
    [10, 20, 'UNAUTHORIZED_FILE_ACCESS', 'HIGH', 'Cố gắng truy cập trực tiếp ID học liệu không thuộc phạm vi bài giảng của lớp', '192.168.1.160', 'OPEN', NULL, NULL, '2026-09-14 10:30:00']
];

$stmtAlert = $mysqli->prepare("INSERT INTO `security_alerts` (`id`, `user_id`, `alert_type`, `severity`, `description`, `source_ip`, `status`, `resolved_by`, `resolved_at`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($alertsData as $a) {
    $stmtAlert->bind_param("iisssssiss", $a[0], $a[1], $a[2], $a[3], $a[4], $a[5], $a[6], $a[7], $a[8], $a[9]);
    $stmtAlert->execute();
}
echo "[x] security_alerts: OK (" . count($alertsData) . " canh bao an ninh)\n";

// 24. USER_SESSIONS (15 phiên thiết bị phong phú)
$sessionsData = [
    [1, 1, 'DEV_SEC_ADMIN_01', 'Workstation Phòng Quản trị An ninh T04 (Win11)', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:30:00', '2026-09-14 18:30:00', NULL, '2026-09-14 08:00:00'],
    [2, 2, 'DEV_TEACHER_QUANG_01', 'Laptop Dell Precision 7760 Khoa ANDT', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:15:00', '2026-09-14 18:15:00', NULL, '2026-09-14 08:15:00'],
    [3, 3, 'DEV_TEACHER_NAM_01', 'ThinkPad X1 Extreme Khoa An ninh Mạng', '192.168.1.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:00:00', '2026-09-14 17:00:00', NULL, '2026-09-14 08:30:00'],
    [4, 4, 'DEV_TEACHER_HUONG_01', 'MacBook Pro 16 M3 Max Khoa Luật', '192.168.1.30', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2026-09-14 10:45:00', '2026-09-14 16:45:00', NULL, '2026-09-14 08:45:00'],
    [5, 5, 'DEV_STUDENT_MINH_01', 'Máy trạm Phòng thực hành số 1 (D31A-01)', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:20:00', '2026-09-14 14:20:00', NULL, '2026-09-14 09:00:00'],
    [6, 6, 'DEV_STUDENT_HUNG_UNKNOWN', 'Thiết bị lạ mang từ ngoài vào mạng LAN', '192.168.1.108', 'Mozilla/5.0 (Linux; Android 14)', '2026-09-09 10:07:00', '2026-09-09 12:00:00', '2026-09-09 10:10:00', '2026-09-09 10:00:00'],
    [7, 7, 'DEV_STUDENT_LAN_01', 'Máy trạm Lab An ninh Mạng T04 (Lab 3)', '192.168.1.112', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 10:50:00', '2026-09-14 13:50:00', NULL, '2026-09-14 09:10:00'],
    [8, 8, 'DEV_STUDENT_DUC_01', 'Panasonic Toughbook CF-33 Chuyên dụng', '192.168.1.115', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 09:30:00', '2026-09-14 12:30:00', NULL, '2026-09-14 08:30:00'],
    [9, 9, 'DEV_STUDENT_THAO_01', 'iPad Pro 12.9 M2 Thư viện T04', '192.168.1.120', 'Mozilla/5.0 (iPad; CPU OS 17_4)', '2026-09-14 10:15:00', '2026-09-14 13:15:00', NULL, '2026-09-14 09:15:00'],
    [10, 10, 'DEV_STUDENT_AN_01', 'Samsung Galaxy Tab S9 Ultra', '192.168.1.125', 'Mozilla/5.0 (Linux; Android 14)', '2026-09-14 10:00:00', '2026-09-14 13:00:00', NULL, '2026-09-14 09:00:00'],
    [11, 11, 'DEV_STUDENT_11_PC', 'Máy trạm Giảng đường lớn A1', '192.168.1.130', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:10:00', '2026-09-14 14:10:00', NULL, '2026-09-14 08:40:00'],
    [12, 12, 'DEV_STUDENT_12_PC', 'Máy trạm Giảng đường lớn A1', '192.168.1.135', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:05:00', '2026-09-14 14:05:00', NULL, '2026-09-14 08:45:00'],
    [13, 13, 'DEV_STUDENT_13_PC', 'Máy tính Thư viện điện tử T04', '192.168.1.140', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 10:30:00', '2026-09-14 13:30:00', NULL, '2026-09-14 09:20:00'],
    [14, 14, 'DEV_STUDENT_14_PC', 'Máy tính Phòng thực nghiệm Kỹ thuật hình sự', '192.168.1.145', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 10:40:00', '2026-09-14 13:40:00', NULL, '2026-09-14 09:30:00'],
    [15, 15, 'DEV_STUDENT_15_PC', 'Máy tính Phòng thực nghiệm Kỹ thuật hình sự', '192.168.1.150', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-14 11:25:00', '2026-09-14 14:25:00', NULL, '2026-09-14 09:35:00']
];

$stmtSess = $mysqli->prepare("INSERT INTO `user_sessions` (`id`, `user_id`, `session_token_hash`, `device_id`, `device_name`, `ip_address`, `user_agent`, `last_activity_at`, `expires_at`, `revoked_at`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($sessionsData as $s) {
    $tokHash = hash('sha256', 'session_token_' . $s[0] . '_2026');
    $stmtSess->bind_param("iisssssssss", $s[0], $s[1], $tokHash, $s[2], $s[3], $s[4], $s[5], $s[6], $s[7], $s[8], $s[9]);
    $stmtSess->execute();
}
echo "[x] user_sessions: OK (" . count($sessionsData) . " phien ket noi & thiet bi)\n";

// 25. USER_MFA
$mysqli->query("INSERT INTO `user_mfa` (`id`, `user_id`, `method`, `secret_encrypted`, `is_enabled`, `enabled_at`) VALUES
(1, 1, 'TOTP', 'ENC_AES256_GCM_9f83ac01bb45e', TRUE, '2026-09-01 00:00:00'),
(2, 2, 'EMAIL_OTP', 'ENC_AES256_GCM_77a8cb02cc67d', TRUE, '2026-09-02 08:00:00'),
(3, 3, 'TOTP', 'ENC_AES256_GCM_33d4ef99aa12b', TRUE, '2026-09-02 08:30:00'),
(4, 4, 'EMAIL_OTP', 'ENC_AES256_GCM_44c8da11aa34e', TRUE, '2026-09-02 09:00:00'),
(5, 5, 'TOTP', NULL, FALSE, NULL)
ON DUPLICATE KEY UPDATE `method`=VALUES(`method`), `is_enabled`=VALUES(`is_enabled`);");
echo "[x] user_mfa: OK (5 cau hinh MFA)\n";

// 26. NOTIFICATIONS (10 thông báo)
$mysqli->query("INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `read_at`, `created_at`) VALUES
(1, 5, 'Bài giảng mới đã xuất bản', 'Bài giảng Kỹ thuật Khám nghiệm hiện trường đã được phát hành cho Lớp D31A.', 'LECTURE_PUBLISHED', TRUE, '2026-09-01 09:00:00', '2026-09-01 08:00:00'),
(2, 5, 'Nhắc nhở học tập nghiệp vụ', 'Học viên cần hoàn thành theo dõi Video bài giảng kỹ thuật trước buổi thảo luận thực địa.', 'REMINDER', FALSE, NULL, '2026-09-12 14:00:00'),
(3, 7, 'Cập nhật học liệu môn An ninh mạng', 'Khoa ANM đã bổ sung sơ đồ topology phòng thủ mạng nội bộ vào Bài giảng số 2.', 'FILE_UPDATE', FALSE, NULL, '2026-09-12 16:30:00'),
(4, 2, 'Báo cáo chuyên cần học tập', 'Lớp D31A đã có 28/30 học viên truy cập nghiên cứu tài liệu giáo trình Chương 1.', 'CLASS_REPORT', TRUE, '2026-09-13 08:00:00', '2026-09-12 18:00:00'),
(5, 1, 'Cảnh báo an ninh cấp cao', 'Phát hiện dấu hiệu truy cập trái phép tài liệu SECRET từ học viên vi phạm. Vui lòng kiểm tra mục Cảnh báo.', 'SECURITY_ALERT', FALSE, NULL, '2026-09-13 10:10:00'),
(6, 6, 'Cảnh báo vi phạm bảo mật', 'Tài khoản của đồng chí đã bị tạm khóa chức năng tải tài liệu do vượt quyền clearance.', 'SECURITY_ALERT', FALSE, NULL, '2026-09-13 10:15:00'),
(7, 8, 'Phê duyệt quyền Clearance', 'Đồng chí đã được nâng cấp phê duyệt Clearance lên mức MẬT (CONFIDENTIAL).', 'SECURITY_ALERT', TRUE, '2026-09-13 11:00:00', '2026-09-13 10:30:00'),
(8, 9, 'Thông báo lịch học trực tuyến', 'Lớp LT15 sẽ bắt đầu học phần Tố tụng Hình sự từ 14h00 ngày mai tại Phòng Lab 2.', 'REMINDER', FALSE, NULL, '2026-09-14 08:00:00'),
(9, 10, 'Học liệu mới được phân quyền', 'Giáo trình Chiến thuật Trinh sát Thực địa đã được mở quyền đọc cho Lớp VB2_K8.', 'FILE_UPDATE', TRUE, '2026-09-14 09:00:00', '2026-09-14 08:30:00'),
(10, 1, 'Báo cáo sao lưu hệ thống', 'Sao lưu định kỳ cơ sở dữ liệu training_management hoàn tất lúc 23:00. Kích thước 14.8MB.', 'CLASS_REPORT', TRUE, '2026-09-13 07:00:00', '2026-09-12 23:05:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);");
echo "[x] notifications: OK (10 thong bao)\n";

// 27. RETENTION_POLICIES
$mysqli->query("INSERT INTO `retention_policies` (`entity_type`, `retention_days`, `archive_after_days`, `delete_after_days`, `is_enabled`) VALUES
('WATCH_HISTORY', 365, 180, 730, TRUE),
('DOWNLOAD_LOG', 730, 365, 1825, TRUE),
('AUDIT_LOG', 1825, 730, NULL, TRUE),
('USER_SESSIONS', 30, 15, 60, TRUE),
('OLD_FILES', 1095, 365, 2190, TRUE)
ON DUPLICATE KEY UPDATE `retention_days`=VALUES(`retention_days`);");
echo "[x] retention_policies: OK\n";

// 28. SYSTEM_SETTINGS
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

echo "\n>>> HOAN TAT NAP DU LIEU THIET KE CHO TOAN BO 27 BANG CSDL MYSQL <<<\n";