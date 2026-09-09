-- ====================================================================
-- SEED DATA TOAN DIEN CHO TOAN BO 27 BANG training_management
-- Mat khau mac dinh: T04@Security2026!
-- Ngay cap nhat: 2026-09-09
-- ====================================================================

USE `training_management`;
SET FOREIGN_KEY_CHECKS = 0;

-- TABLE: roles (4 records)
INSERT INTO `roles` (`id`, `code`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'SUPER_ADMIN', 'Quản trị viên Cấp cao', 'Toàn quyền cấu hình, bảo mật và vận hành hệ thống', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'ADMIN', 'Quản trị viên Học viện', 'Quản lý người dùng, học liệu, phân công và kiểm toán an ninh', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'TEACHER', 'Giảng viên Sĩ quan', 'Biên soạn, xuất bản bài giảng và tải học liệu nghiệp vụ', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'STUDENT', 'Học viên', 'Tra cứu, học tập bài giảng và tài liệu được phân quyền theo lớp', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: permissions (31 records)
INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `module`, `created_at`, `updated_at`) VALUES
(1, 'USER_VIEW', 'Xem danh sách người dùng', 'Xem hồ sơ cán bộ, giảng viên, học viên', 'Identity', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'USER_CREATE', 'Tạo tài khoản người dùng', 'Thêm mới người dùng vào hệ thống', 'Identity', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'USER_UPDATE', 'Cập nhật tài khoản người dùng', 'Chỉnh sửa thông tin, vai trò, đơn vị', 'Identity', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'USER_DELETE', 'Xóa tài khoản người dùng', 'Xóa mềm tài khoản khỏi hệ thống', 'Identity', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 'LECTURE_VIEW', 'Xem bài giảng', 'Xem nội dung và tài liệu thuộc bài giảng', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(6, 'LECTURE_CREATE', 'Tạo bài giảng mới', 'Biên soạn nội dung bài giảng điện tử', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(7, 'LECTURE_UPDATE', 'Cập nhật bài giảng', 'Chỉnh sửa tiêu đề, mô tả, phiên bản', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(8, 'LECTURE_DELETE', 'Xóa bài giảng', 'Xóa mềm bài giảng', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(9, 'LECTURE_PUBLISH', 'Xuất bản bài giảng', 'Phát hành bài giảng cho lớp học', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(10, 'LECTURE_CLOSE', 'Đóng bài giảng', 'Khóa bài giảng, ngừng phân quyền học viên', 'Lecture', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(11, 'FILE_VIEW', 'Xem tập tin học liệu', 'Truy cập xem trực tiếp PDF, Ảnh, Video', 'File', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(12, 'FILE_UPLOAD', 'Đăng tải tập tin', 'Tải lên học liệu số hóa vào kho lưu trữ', 'File', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(13, 'FILE_UPDATE', 'Cập nhật tập tin', 'Chỉnh sửa metadata, cập nhật phiên bản mới', 'File', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(14, 'FILE_DELETE', 'Xóa tập tin', 'Đánh dấu xóa mềm học liệu', 'File', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(15, 'FILE_DOWNLOAD', 'Tải tập tin về máy', 'Tải file đính kèm nếu được cấp quyền', 'File', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(16, 'CLASS_VIEW', 'Xem danh sách lớp học', 'Tra cứu các lớp học vụ và niên khóa', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(17, 'CLASS_CREATE', 'Tạo lớp học mới', 'Thêm mới lớp học vụ', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(18, 'CLASS_UPDATE', 'Cập nhật lớp học', 'Chỉnh sửa thông tin lớp học', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(19, 'SUBJECT_VIEW', 'Xem danh mục môn học', 'Tra cứu học phần đào tạo', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(20, 'SUBJECT_CREATE', 'Tạo môn học mới', 'Thêm mới môn học vào chương trình', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(21, 'SUBJECT_UPDATE', 'Cập nhật môn học', 'Chỉnh sửa thông tin học phần', 'Academic', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(22, 'AUDIT_VIEW', 'Xem nhật ký kiểm toán', 'Tra cứu Audit Trail bất biến', 'Audit', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(23, 'SECURITY_ALERT_VIEW', 'Xem cảnh báo an ninh', 'Theo dõi cảnh báo vi phạm, tải bất thường', 'Audit', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(24, 'SECURITY_ALERT_UPDATE', 'Xử lý cảnh báo an ninh', 'Cập nhật trạng thái xử lý cảnh báo', 'Audit', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(25, 'CLEARANCE_VIEW', 'Xem cấp độ phân loại', 'Xem cấp độ bảo mật của tài liệu & người dùng', 'Security', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(26, 'CLEARANCE_MANAGE', 'Quản lý phê chuẩn bảo mật', 'Cấp phát và thu hồi clearance của người dùng', 'Security', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(27, 'DEVICE_VIEW', 'Xem phiên đăng nhập', 'Theo dõi thiết bị và IP truy cập', 'Security', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(28, 'DEVICE_MANAGE', 'Thu hồi thiết bị', 'Hủy phiên làm việc của thiết bị', 'Security', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(29, 'MFA_MANAGE', 'Quản lý xác thực 2 lớp', 'Thiết lập và quản trị MFA', 'Security', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(30, 'SYSTEM_CONFIG', 'Cấu hình hệ thống', 'Quản lý tham số động toàn hệ thống', 'System', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(31, 'RETENTION_MANAGE', 'Quản lý lưu trữ & tiêu hủy', 'Cấu hình chính sách Retention Policy', 'System', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: role_permissions (74 records)
INSERT INTO `role_permissions` (`role_id`, `permission_id`, `created_at`) VALUES
(1, 1, '2026-09-09 19:49:42'),
(1, 2, '2026-09-09 19:49:42'),
(1, 3, '2026-09-09 19:49:42'),
(1, 4, '2026-09-09 19:49:42'),
(1, 5, '2026-09-09 19:49:42'),
(1, 6, '2026-09-09 19:49:42'),
(1, 7, '2026-09-09 19:49:42'),
(1, 8, '2026-09-09 19:49:42'),
(1, 9, '2026-09-09 19:49:42'),
(1, 10, '2026-09-09 19:49:42'),
(1, 11, '2026-09-09 19:49:42'),
(1, 12, '2026-09-09 19:49:42'),
(1, 13, '2026-09-09 19:49:42'),
(1, 14, '2026-09-09 19:49:42'),
(1, 15, '2026-09-09 19:49:42'),
(1, 16, '2026-09-09 19:49:42'),
(1, 17, '2026-09-09 19:49:42'),
(1, 18, '2026-09-09 19:49:42'),
(1, 19, '2026-09-09 19:49:42'),
(1, 20, '2026-09-09 19:49:42'),
(1, 21, '2026-09-09 19:49:42'),
(1, 22, '2026-09-09 19:49:42'),
(1, 23, '2026-09-09 19:49:42'),
(1, 24, '2026-09-09 19:49:42'),
(1, 25, '2026-09-09 19:49:42'),
(1, 26, '2026-09-09 19:49:42'),
(1, 27, '2026-09-09 19:49:42'),
(1, 28, '2026-09-09 19:49:42'),
(1, 29, '2026-09-09 19:49:42'),
(1, 30, '2026-09-09 19:49:42'),
(1, 31, '2026-09-09 19:49:42'),
(2, 1, '2026-09-09 19:49:42'),
(2, 2, '2026-09-09 19:49:42'),
(2, 3, '2026-09-09 19:49:42'),
(2, 4, '2026-09-09 19:49:42'),
(2, 5, '2026-09-09 19:49:42'),
(2, 6, '2026-09-09 19:49:42'),
(2, 7, '2026-09-09 19:49:42'),
(2, 8, '2026-09-09 19:49:42'),
(2, 9, '2026-09-09 19:49:42'),
(2, 10, '2026-09-09 19:49:42'),
(2, 11, '2026-09-09 19:49:42'),
(2, 12, '2026-09-09 19:49:42'),
(2, 13, '2026-09-09 19:49:42'),
(2, 14, '2026-09-09 19:49:42'),
(2, 15, '2026-09-09 19:49:42'),
(2, 16, '2026-09-09 19:49:42'),
(2, 17, '2026-09-09 19:49:42'),
(2, 18, '2026-09-09 19:49:42'),
(2, 19, '2026-09-09 19:49:42'),
(2, 20, '2026-09-09 19:49:42'),
(2, 21, '2026-09-09 19:49:42'),
(2, 22, '2026-09-09 19:49:42'),
(2, 23, '2026-09-09 19:49:42'),
(2, 24, '2026-09-09 19:49:42'),
(2, 25, '2026-09-09 19:49:42'),
(2, 26, '2026-09-09 19:49:42'),
(2, 27, '2026-09-09 19:49:42'),
(2, 28, '2026-09-09 19:49:42'),
(2, 29, '2026-09-09 19:49:42'),
(3, 5, '2026-09-09 19:49:42'),
(3, 6, '2026-09-09 19:49:42'),
(3, 7, '2026-09-09 19:49:42'),
(3, 8, '2026-09-09 19:49:42'),
(3, 9, '2026-09-09 19:49:42'),
(3, 10, '2026-09-09 19:49:42'),
(3, 11, '2026-09-09 19:49:42'),
(3, 12, '2026-09-09 19:49:42'),
(3, 13, '2026-09-09 19:49:42'),
(3, 14, '2026-09-09 19:49:42'),
(3, 15, '2026-09-09 19:49:42'),
(4, 5, '2026-09-09 19:49:42'),
(4, 11, '2026-09-09 19:49:42'),
(4, 15, '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: classification_levels (4 records)
INSERT INTO `classification_levels` (`id`, `code`, `name`, `level_order`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'NORMAL', 'Công khai nội bộ', 1, 'Học liệu phổ thông, đề cương chi tiết môn học', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'INTERNAL', 'Lưu hành nội bộ', 2, 'Giáo trình chính khóa dành cho học viên nhà trường', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'CONFIDENTIAL', 'Mật', 3, 'Tài liệu hướng dẫn nghiệp vụ và hồ sơ trinh sát chuyên đề', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'SECRET', 'Tối mật nghiệp vụ', 4, 'Hồ sơ chuyên án đặc biệt, chỉ cấp cho sĩ quan có thẩm quyền', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: organizational_units (9 records)
INSERT INTO `organizational_units` (`id`, `parent_id`, `code`, `name`, `unit_type`, `status`, `created_at`, `updated_at`) VALUES
(1, NULL, 'T04_ROOT', 'Trường Đại học An ninh Nhân dân', 'ACADEMY', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 1, 'KHOA_ANDT', 'Khoa An ninh điều tra', 'FACULTY', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 1, 'KHOA_ANM', 'Khoa An ninh mạng & PCTP Công nghệ cao', 'FACULTY', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 1, 'KHOA_LUAT', 'Khoa Luật & Quản lý nhà nước về ANTT', 'FACULTY', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 1, 'KHOA_NVAN', 'Khoa Nghiệp vụ An ninh', 'FACULTY', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(6, 2, 'BM_KTHS', 'Bộ môn Kỹ thuật hình sự & Khám nghiệm', 'DEPARTMENT', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(7, 2, 'BM_DTTP', 'Bộ môn Điều tra tội phạm xâm phạm ANQG', 'DEPARTMENT', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(8, 3, 'BM_ATTT', 'Bộ môn An toàn thông tin mạng', 'DEPARTMENT', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(9, 3, 'BM_TTDT', 'Bộ môn Trinh sát Kỹ thuật điện tử', 'DEPARTMENT', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: classes (4 records)
INSERT INTO `classes` (`id`, `code`, `name`, `organizational_unit_id`, `academic_year`, `semester`, `status`, `created_at`, `updated_at`) VALUES
(1, 'D31A', 'Lớp Khóa D31 - Đại đội A (Chuyên ngành An ninh điều tra)', 2, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'D31B', 'Lớp Khóa D31 - Đại đội B (Chuyên ngành An ninh mạng)', 3, '2023-2027', 'Học kỳ 1 - Năm 3', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'LT15', 'Lớp Liên thông Khóa 15 (Hệ Vừa làm vừa học)', 4, '2024-2026', 'Học kỳ 2 - Năm 1', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'VB2_K8', 'Lớp Văn bằng 2 - Khóa 8 (Chính quy tập trung)', 5, '2024-2026', 'Học kỳ 1 - Năm 2', 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: subjects (4 records)
INSERT INTO `subjects` (`id`, `code`, `name`, `description`, `organizational_unit_id`, `credits`, `status`, `created_at`, `updated_at`) VALUES
(1, 'ANDT_301', 'Kỹ thuật Khám nghiệm hiện trường & Điều tra hình sự', 'Trang bị quy trình nghiệp vụ khám nghiệm, thu thập mẫu vật, dấu vết vi lượng', 2, 4.00, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'ANM_402', 'An toàn Thông tin & Phòng chống Tấn công mạng', 'Kỹ thuật phòng vệ mạng nội bộ, giám sát an toàn thông tin cơ yếu lực lượng CAND', 3, 3.50, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'LUAT_201', 'Luật Tố tụng Hình sự thực hành', 'Áp dụng các biện pháp ngăn chặn và bảo vệ chứng cứ pháp lý tố tụng', 4, 3.00, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'NVAN_305', 'Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Nghiệp vụ trinh sát ngoại tuyến và bảo vệ an toàn các mục tiêu trọng điểm', 5, 3.00, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: users (10 records)
INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role_id`, `organizational_unit_id`, `status`, `last_login_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'admin', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Thiếu tướng, PGS.TS Quản trị viên', 'admin@dhan.edu.vn', 0901234567, 1, 1, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(2, 'gv_quang', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Đại tá Trần Minh Quang (Trưởng Khoa ANDT)', 'quangtm@dhan.edu.vn', 0902345678, 3, 2, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(3, 'gv_nam', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Trung tá Lê Hoài Nam (Phó Trưởng Khoa ANM)', 'namlh@dhan.edu.vn', 0903456789, 3, 3, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(4, 'gv_huong', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Thượng tá Nguyễn Thu Hương (Phó Khoa Luật)', 'huongnt@dhan.edu.vn', 0904567890, 3, 4, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(5, 'hv_minh', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Đặng Nhật Minh (D31A)', 'minhdn@student.dhan.edu.vn', 0912345678, 4, 2, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(6, 'hv_hung', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Nguyễn Tuấn Hùng (D31A)', 'hungnt@student.dhan.edu.vn', 0913456789, 4, 2, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(7, 'hv_lan', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Phạm Mai Lan (D31B)', 'lanpm@student.dhan.edu.vn', 0914567890, 4, 3, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(8, 'hv_duc', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Hoàng Trung Đức (D31B)', 'ducht@student.dhan.edu.vn', 0915678901, 4, 3, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(9, 'hv_thao', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Trần Phương Thảo (LT15)', 'thaotp@student.dhan.edu.vn', 0916789012, 4, 4, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(10, 'hv_an', 'PBKDF2$10000$QkJCQkJCQkJCQkJCQkJCQg==$hpHOUzFu1ARuTqMCNZpOZNowkZ28THKwsh0SQPcTHnU=', 'Học viên Vũ Quốc An (VB2_K8)', 'anvq@student.dhan.edu.vn', 0917890123, 4, 5, 'ACTIVE', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: teacher_subjects (5 records)
INSERT INTO `teacher_subjects` (`id`, `teacher_id`, `subject_id`, `created_at`) VALUES
(1, 2, 1, '2026-09-09 19:49:42'),
(2, 2, 3, '2026-09-09 19:49:42'),
(3, 3, 2, '2026-09-09 19:49:42'),
(4, 4, 3, '2026-09-09 19:49:42'),
(5, 4, 4, '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: student_classes (6 records)
INSERT INTO `student_classes` (`id`, `student_id`, `class_id`, `joined_at`, `status`) VALUES
(1, 5, 1, '2026-09-09 19:49:42', 'ACTIVE'),
(2, 6, 1, '2026-09-09 19:49:42', 'ACTIVE'),
(3, 7, 2, '2026-09-09 19:49:42', 'ACTIVE'),
(4, 8, 2, '2026-09-09 19:49:42', 'ACTIVE'),
(5, 9, 3, '2026-09-09 19:49:42', 'ACTIVE'),
(6, 10, 4, '2026-09-09 19:49:42', 'ACTIVE')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: user_clearance_levels (10 records)
INSERT INTO `user_clearance_levels` (`id`, `user_id`, `classification_level_id`, `granted_by`, `granted_at`, `expires_at`, `status`, `created_at`) VALUES
(1, 1, 4, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(2, 2, 3, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(3, 3, 4, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(4, 4, 3, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(5, 5, 2, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(6, 6, 1, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(7, 7, 2, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(8, 8, 3, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(9, 9, 2, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42'),
(10, 10, 1, 1, '2026-09-09 19:49:42', NULL, 'ACTIVE', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: files (8 records)
INSERT INTO `files` (`id`, `original_name`, `stored_name`, `mime_type`, `extension`, `file_type`, `file_size`, `storage_path`, `checksum_sha256`, `classification_level_id`, `uploaded_by`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Giao_trinh_An_ninh_dieu_tra_Chuong_1.pdf', 'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', 'application/pdf', '.pdf', 'PDF', 712, 'Storage/2026/09/01/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', 'cef3ba4db5d0f1eed61be5656ad7f12f05c251c25e988634fcef99964cf97ad8', 2, 2, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(2, 'Video_bai_giang_Ky_thuat_dieu_tra_co_ban.mp4', 'c9a646d3-9c61-4cd7-9f59-b2c3d4e5f6a1.mp4', 'video/mp4', '.mp4', 'VIDEO', 32, 'Storage/2026/09/02/c9a646d3-9c61-4cd7-9f59-b2c3d4e5f6a1.mp4', '148221b537ed6bd55b1b25d3e05d93d84cc43029211f586d437fb476e6f3fa87', 2, 2, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(3, 'Slide_minh_hoa_Nghiep_vu_An_ninh_mang.svg', 'd8e9f0a1-b2c3-4d5e-6f7a-c3d4e5f6a1b2.svg', 'image/svg+xml', '.svg', 'IMAGE', 1504, 'Storage/2026/09/03/d8e9f0a1-b2c3-4d5e-6f7a-c3d4e5f6a1b2.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 3, 3, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(4, 'De_cuong_bai_giang_Luat_to_tung_hinh_su.pdf', 'e1f2a3b4-c5d6-4e7f-8a9b-d4e5f6a1b2c3.pdf', 'application/pdf', '.pdf', 'PDF', 1063, 'Storage/2026/09/04/e1f2a3b4-c5d6-4e7f-8a9b-d4e5f6a1b2c3.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 1, 4, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(5, 'Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf', 'fa5b6c7d-8e9f-4a0b-1c2d-e5f6a1b2c3d4.pdf', 'application/pdf', '.pdf', 'PDF', 1182, 'Storage/2026/09/05/fa5b6c7d-8e9f-4a0b-1c2d-e5f6a1b2c3d4.pdf', 'b26cef75b08cfa624b459b507eb1f16834e3917e8673816af278788c07d28dd4', 4, 3, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(6, 'So_do_Ha_tang_Giam_sat_Toan_tuyen.jpg', 'b7c8d9e0-1a2b-3c4d-5e6f-7a8b9c0d1e2f.jpg', 'image/jpeg', '.jpg', 'IMAGE', 542091, 'Storage/2026/09/06/b7c8d9e0-1a2b-3c4d-5e6f-7a8b9c0d1e2f.jpg', '7f78c8efdc6462b80722160290bb24da278a6ad5e12836e5fbbafe2782b5f515', 3, 3, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(7, 'Ghi_am_Phan_tich_Loi_khai_Nghi_pham.wav', 'c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f.wav', 'audio/wav', '.wav', 'OTHER', 498420, 'Storage/2026/09/07/c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f.wav', 'd950700cf810605ab9c94df8d3344479f82da8423d5fb4e9b42895028acd5054', 3, 2, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(8, 'Huong_dan_Thuc_hanh_Phong_chong_Tan_cong.mp4', 'd9e0f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a.mp4', 'video/mp4', '.mp4', 'VIDEO', 593061, 'Storage/2026/09/08/d9e0f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 2, 3, 'ACTIVE', '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: file_versions (9 records)
INSERT INTO `file_versions` (`id`, `file_id`, `version`, `stored_name`, `storage_path`, `checksum_sha256`, `uploaded_by`, `change_note`, `created_at`) VALUES
(1, 1, 1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', 'Storage/2026/09/01/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf', 'cef3ba4db5d0f1eed61be5656ad7f12f05c251c25e988634fcef99964cf97ad8', 2, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(2, 2, 1, 'c9a646d3-9c61-4cd7-9f59-b2c3d4e5f6a1.mp4', 'Storage/2026/09/02/c9a646d3-9c61-4cd7-9f59-b2c3d4e5f6a1.mp4', '148221b537ed6bd55b1b25d3e05d93d84cc43029211f586d437fb476e6f3fa87', 2, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(3, 3, 1, 'd8e9f0a1-b2c3-4d5e-6f7a-c3d4e5f6a1b2.svg', 'Storage/2026/09/03/d8e9f0a1-b2c3-4d5e-6f7a-c3d4e5f6a1b2.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 3, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(4, 4, 1, 'e1f2a3b4-c5d6-4e7f-8a9b-d4e5f6a1b2c3.pdf', 'Storage/2026/09/04/e1f2a3b4-c5d6-4e7f-8a9b-d4e5f6a1b2c3.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 4, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(5, 5, 1, 'fa5b6c7d-8e9f-4a0b-1c2d-e5f6a1b2c3d4.pdf', 'Storage/2026/09/05/fa5b6c7d-8e9f-4a0b-1c2d-e5f6a1b2c3d4.pdf', 'b26cef75b08cfa624b459b507eb1f16834e3917e8673816af278788c07d28dd4', 3, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(6, 6, 1, 'b7c8d9e0-1a2b-3c4d-5e6f-7a8b9c0d1e2f.jpg', 'Storage/2026/09/06/b7c8d9e0-1a2b-3c4d-5e6f-7a8b9c0d1e2f.jpg', '7f78c8efdc6462b80722160290bb24da278a6ad5e12836e5fbbafe2782b5f515', 3, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(7, 7, 1, 'c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f.wav', 'Storage/2026/09/07/c8d9e0f1-2a3b-4c5d-6e7f-8a9b0c1d2e3f.wav', 'd950700cf810605ab9c94df8d3344479f82da8423d5fb4e9b42895028acd5054', 2, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(8, 8, 1, 'd9e0f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a.mp4', 'Storage/2026/09/08/d9e0f1a2-3b4c-5d6e-7f8a-9b0c1d2e3f4a.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 3, 'Khởi tạo phiên bản gốc', '2026-09-09 19:49:42'),
(9, 1, 2, 'f47ac10b-58cc-4372-a567-0e02b2c3d479_v2.pdf', 'Storage/2026/09/01/f47ac10b-58cc-4372-a567-0e02b2c3d479_v2.pdf', '49daa936653e0ebb899ef76a3a8375c3eef0e181d439e1c2531983762f9fd776', 2, 'Cập nhật bổ sung Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: file_permissions (3 records)
INSERT INTO `file_permissions` (`id`, `file_id`, `user_id`, `class_id`, `can_view`, `can_download`, `can_print`, `access_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 5, 8, NULL, 1, 0, 0, 'Được cấp quyền nghiên cứu chuyên đề Đề tài Khoa học cấp Bộ', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 6, NULL, 3, 1, 1, 0, 'Cấp quyền toàn bộ Lớp LT15 nghiên cứu chuyên đề sơ đồ hạ tầng', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 7, 5, NULL, 1, 1, 0, 'Cấp quyền đặc cách tải file ghi âm phục vụ diễn tập thực nghiệm', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: lectures (6 records)
INSERT INTO `lectures` (`id`, `subject_id`, `teacher_id`, `title`, `description`, `status`, `publish_at`, `close_at`, `version`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 2, 'Bài giảng: Kỹ thuật Khám nghiệm hiện trường vụ án hình sự', 'Quy trình thu thập mẫu vật, khám nghiệm và bảo quản tang thư nghiệp vụ', 'PUBLISHED', '2026-09-01 08:00:00', NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(2, 2, 3, 'Bài giảng: Phòng chống Tấn công mạng & Bảo vệ Bí mật Nhà nước', 'Phân tích mã độc, bảo vệ hạ tầng máy chủ nội bộ trong lực lượng Công an', 'PUBLISHED', '2026-09-02 08:00:00', NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(3, 3, 4, 'Bài giảng: Quy trình Tố tụng Hình sự thực hành', 'Áp dụng Bộ luật TTHS vào công tác bắt giữ và điều tra ban đầu', 'SCHEDULED', '2026-09-15 08:00:00', NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(4, 2, 3, 'Bài giảng: Hồ sơ nghiệp vụ bảo mật cao (Học phần đã kết thúc)', 'Bài giảng đã đóng để kiểm tra đánh giá hết học phần', 'CLOSED', '2026-08-01 08:00:00', NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(5, 4, 4, 'Bài giảng: Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu', 'Phương án bố trí trinh sát ngoại tuyến bảo vệ sự kiện chính trị trọng điểm', 'PUBLISHED', '2026-09-05 08:00:00', NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL),
(6, 2, 3, 'Bài giảng: Phân tích Dấu vết Kỹ thuật số cơ bản (Bản thảo)', 'Nội dung đang biên soạn bổ sung thực hành trích xuất RAM', 'DRAFT', NULL, NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42', NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: lecture_files (11 records)
INSERT INTO `lecture_files` (`id`, `lecture_id`, `file_id`, `display_order`, `is_visible`, `is_downloadable`, `is_printable`, `publish_at`, `close_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 1, 2, 2, 1, 0, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 1, 7, 3, 1, 0, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 2, 3, 1, 1, 1, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 2, 5, 2, 1, 0, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(6, 2, 6, 3, 1, 1, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(7, 2, 8, 4, 1, 0, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(8, 3, 4, 1, 1, 1, 1, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(9, 4, 3, 1, 1, 1, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(10, 5, 4, 1, 1, 1, 1, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(11, 5, 6, 2, 1, 0, 0, NULL, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: lecture_permissions (7 records)
INSERT INTO `lecture_permissions` (`id`, `lecture_id`, `class_id`, `can_view`, `publish_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-09-01 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 2, 1, 1, '2026-09-02 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 2, 2, 1, '2026-09-02 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 3, 3, 1, '2026-09-15 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 4, 1, 1, '2026-08-01 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(6, 5, 4, 1, '2026-09-05 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(7, 5, 1, 1, '2026-09-05 08:00:00', NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: watch_history (4 records)
INSERT INTO `watch_history` (`id`, `user_id`, `file_id`, `lecture_id`, `last_position_seconds`, `duration_seconds`, `completed`, `last_watched_at`, `created_at`, `updated_at`) VALUES
(1, 5, 2, 1, 142.500, 300.000, 0, '2026-09-09 10:15:30', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 7, 8, 2, 285.000, 285.000, 1, '2026-09-08 16:45:10', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 8, 8, 2, 75.200, 285.000, 0, '2026-09-09 08:30:22', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 5, 7, 1, 120.000, 240.000, 0, '2026-09-09 11:00:00', '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: learning_progress (5 records)
INSERT INTO `learning_progress` (`id`, `user_id`, `lecture_id`, `progress_percent`, `completed`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 65.00, 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 7, 2, 100.00, 1, '2026-09-08 17:00:00', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 8, 2, 45.00, 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 9, 3, 10.00, 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 10, 5, 80.00, 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: download_logs (6 records)
INSERT INTO `download_logs` (`id`, `user_id`, `file_id`, `lecture_id`, `ip_address`, `user_agent`, `file_size`, `status`, `denial_reason`, `downloaded_at`) VALUES
(1, 5, 1, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 712, 'SUCCESS', NULL, '2026-09-09 09:12:00'),
(2, 5, 2, 1, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 32, 'DENIED', 'Tập tin cấu hình chỉ cho phép xem trực tuyến (is_downloadable=false)', '2026-09-09 09:13:00'),
(3, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1182, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:05:00'),
(4, 7, 3, 2, '192.168.1.112', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1504, 'SUCCESS', NULL, '2026-09-09 11:20:00'),
(5, 2, 1, 1, '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 712, 'SUCCESS', NULL, '2026-09-09 08:00:00'),
(6, 6, 5, 2, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 1182, 'DENIED', 'Clearance của người dùng (NORMAL) không đủ để truy cập tập tin mức SECRET', '2026-09-09 10:06:00')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: audit_logs (6 records)
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `access_reason`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'SYSTEM_INIT', 'DATABASE', 1, NULL, '{\"status\": \"INITIALIZED\", \"database\": \"training_management\"}', 'Khởi tạo hệ thống', '127.0.0.1', NULL, '2026-09-01 00:00:00'),
(2, 1, 'GRANT_CLEARANCE', 'USER_CLEARANCE', 8, '{\"clearance\": \"NORMAL\"}', '{\"clearance\": \"CONFIDENTIAL\"}', 'Phê duyệt tham gia Đề tài NCKH cấp Bộ', '192.168.1.10', NULL, '2026-09-02 09:30:00'),
(3, 2, 'PUBLISH_LECTURE', 'LECTURE', 1, '{\"status\": \"DRAFT\"}', '{\"status\": \"PUBLISHED\"}', 'Xuất bản bài giảng Kỹ thuật khám nghiệm', '192.168.1.20', NULL, '2026-09-01 08:00:00'),
(4, 3, 'UPLOAD_FILE', 'FILE', 5, NULL, '{\"file_name\": \"Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf\", \"classification\": \"SECRET\"}', 'Lưu trữ tài liệu nghiệp vụ an ninh mạng', '192.168.1.25', NULL, '2026-09-02 08:30:00'),
(5, 3, 'CLOSE_LECTURE', 'LECTURE', 4, '{\"status\": \"PUBLISHED\"}', '{\"status\": \"CLOSED\"}', 'Đóng học phần theo kế hoạch đào tạo', '192.168.1.25', NULL, '2026-09-05 17:00:00'),
(6, 2, 'UPLOAD_NEW_VERSION', 'FILE_VERSION', 1, '{\"version\": 1}', '{\"version\": 2}', 'Cập nhật bổ sung Nghị định 13 về dữ liệu cá nhân', '192.168.1.20', NULL, '2026-09-08 14:00:00')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: security_alerts (3 records)
INSERT INTO `security_alerts` (`id`, `user_id`, `alert_type`, `severity`, `description`, `source_ip`, `status`, `resolved_by`, `resolved_at`, `created_at`) VALUES
(1, 6, 'SUSPICIOUS_DOWNLOAD', 'HIGH', 'Học viên liên tiếp yêu cầu tải học liệu Tối mật (SECRET) bị hệ thống từ chối', '192.168.1.108', 'OPEN', NULL, NULL, '2026-09-09 10:06:30'),
(2, 5, 'ABNORMAL_SESSION', 'MEDIUM', 'Phát hiện cùng tài khoản đăng nhập từ 2 dải IP khác biệt trong vòng 10 phút', '192.168.1.105', 'RESOLVED', 1, '2026-09-09 12:00:00', '2026-09-08 21:15:00'),
(3, 7, 'FALSE_POSITIVE_RATE_LIMIT', 'LOW', 'Trình duyệt gửi nhiều byte-range request kích hoạt cảnh báo tần suất', '192.168.1.112', 'FALSE_POSITIVE', 1, '2026-09-09 11:30:00', '2026-09-09 11:21:00')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: user_sessions (5 records)
INSERT INTO `user_sessions` (`id`, `user_id`, `session_token_hash`, `device_id`, `device_name`, `ip_address`, `user_agent`, `last_activity_at`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 1, '37ceb8c091c17738a755af8a6d663a358165581561aa0f141c433c9840758778', 'DEV_SEC_ADMIN_01', 'Workstation Phòng Quản trị An ninh T04', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:45:00', '2026-09-09 18:45:00', NULL, '2026-09-09 08:00:00'),
(2, 2, 'b012908cf540ec5a534eb9a205762ac7ca61aabc35049e869c54e31891a7ff79', 'DEV_TEACHER_QUANG_01', 'Laptop Dell Vostro Khoa ANDT', '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:30:00', '2026-09-09 18:30:00', NULL, '2026-09-09 08:15:00'),
(3, 3, '294be91a4b858647d628be1648409a1c9f9693098a2b8602a5032cb4b355118e', 'DEV_TEACHER_NAM_01', 'ThinkPad X1 Khoa An ninh Mạng', '192.168.1.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 11:50:00', '2026-09-09 17:50:00', NULL, '2026-09-09 08:30:00'),
(4, 5, '033ba00ff0e23d90101a67fa50a771023c04822c65a3ccdd5143b083bb020459', 'DEV_STUDENT_MINH_01', 'Máy tính Phòng thực hành D31-01', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2026-09-09 12:40:00', '2026-09-09 14:40:00', NULL, '2026-09-09 09:00:00'),
(5, 6, '7d698fe8472498ac1450cf37e03501e3378f447dd50720ec793c492ce0fd3d6e', 'DEV_STUDENT_HUNG_UNKNOWN', 'Thiết bị lạ nghi vấn mang từ ngoài', '192.168.1.108', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', '2026-09-09 10:07:00', '2026-09-09 12:00:00', '2026-09-09 10:10:00', '2026-09-09 10:00:00')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: user_mfa (4 records)
INSERT INTO `user_mfa` (`id`, `user_id`, `method`, `secret_encrypted`, `is_enabled`, `enabled_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'TOTP', 'ENC_AES256_GCM_9f83ac01bb45e', 1, '2026-09-01 00:00:00', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 2, 'EMAIL_OTP', 'ENC_AES256_GCM_77a8cb02cc67d', 1, '2026-09-02 08:00:00', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 3, 'TOTP', 'ENC_AES256_GCM_33d4ef99aa12b', 1, '2026-09-02 08:30:00', '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 5, 'TOTP', NULL, 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: notifications (5 records)
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `read_at`, `created_at`) VALUES
(1, 5, 'Bài giảng mới đã xuất bản', 'Bài giảng \"Kỹ thuật Khám nghiệm hiện trường vụ án hình sự\" đã được phát hành cho Lớp D31A.', 'LECTURE_PUBLISHED', 1, '2026-09-01 09:00:00', '2026-09-01 08:00:00'),
(2, 5, 'Nhắc nhở học tập nghiệp vụ', 'Học viên cần hoàn thành theo dõi Video bài giảng kỹ thuật trước buổi thảo luận thực địa.', 'REMINDER', 0, NULL, '2026-09-08 14:00:00'),
(3, 7, 'Cập nhật học liệu môn An ninh mạng', 'Khoa ANM đã bổ sung sơ đồ topology phòng thủ mạng nội bộ vào Bài giảng số 2.', 'FILE_UPDATE', 0, NULL, '2026-09-08 16:30:00'),
(4, 2, 'Báo cáo chuyên cần học tập', 'Lớp D31A đã có 28/30 học viên truy cập nghiên cứu tài liệu giáo trình Chương 1.', 'CLASS_REPORT', 1, '2026-09-09 08:00:00', '2026-09-08 18:00:00'),
(5, 1, 'Cảnh báo an ninh cấp cao', 'Phát hiện dấu hiệu truy cập trái phép tài liệu SECRET từ học viên vi phạm. Vui lòng kiểm tra mục Cảnh báo.', 'SECURITY_ALERT', 0, NULL, '2026-09-09 10:10:00')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: retention_policies (5 records)
INSERT INTO `retention_policies` (`id`, `entity_type`, `retention_days`, `archive_after_days`, `delete_after_days`, `is_enabled`, `created_at`, `updated_at`) VALUES
(1, 'WATCH_HISTORY', 365, 180, 730, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'DOWNLOAD_LOG', 730, 365, 1825, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'AUDIT_LOG', 1825, 730, NULL, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'USER_SESSIONS', 30, 15, 60, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 'OLD_FILES', 1095, 365, 2190, 1, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- TABLE: system_settings (9 records)
INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_sensitive`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'MAX_STUDENT_DEVICES', 2, 'INTEGER', 'Số lượng thiết bị tối đa cho phép học viên đăng nhập đồng thời', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(2, 'MAX_TEACHER_DEVICES', 3, 'INTEGER', 'Số lượng thiết bị tối đa cho phép giảng viên đăng nhập đồng thời', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(3, 'MAX_ADMIN_DEVICES', 5, 'INTEGER', 'Số lượng thiết bị tối đa cho phép quản trị viên đăng nhập đồng thời', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(4, 'DOWNLOAD_RATE_LIMIT_PER_HOUR', 20, 'INTEGER', 'Giới hạn số lần tải tập tin trong 1 giờ cho mỗi người dùng', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(5, 'SESSION_TIMEOUT_MINUTES', 60, 'INTEGER', 'Thời gian hết hạn phiên làm việc khi không hoạt động', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(6, 'WATERMARK_ENABLED', 'true', 'BOOLEAN', 'Tự động chèn mờ định danh người dùng lên PDF/Video', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(7, 'MFA_TEACHER_REQUIRED', 'false', 'BOOLEAN', 'Bắt buộc xác thực hai yếu tố đối với giảng viên', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(8, 'MFA_ADMIN_REQUIRED', 'true', 'BOOLEAN', 'Bắt buộc xác thực hai yếu tố đối với quản trị viên', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42'),
(9, 'AUTO_CLOSE_LECTURE', 'true', 'BOOLEAN', 'Tự động đóng bài giảng khi đến thời điểm close_at', 0, NULL, '2026-09-09 19:49:42', '2026-09-09 19:49:42')
ON DUPLICATE KEY UPDATE `id`=`id`;

SET FOREIGN_KEY_CHECKS = 1;
