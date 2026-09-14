USE training_management;

-- File: Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4', 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4', 'video/mp4', '.mp4', 'VIDEO', 593061, 'Storage/Videos/Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4', 'Storage/Videos/Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (3, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 3), 1, 0, 0, NOW());

-- File: Slide_Quy_trinh_To_tung_Hinh_su.svg
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Slide_Quy_trinh_To_tung_Hinh_su.svg', 'Slide_Quy_trinh_To_tung_Hinh_su.svg', 'image/svg+xml', '.svg', 'SLIDE', 1504, 'Storage/Slides_PPT/Slide_Quy_trinh_To_tung_Hinh_su.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Slide_Quy_trinh_To_tung_Hinh_su.svg' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Slide_Quy_trinh_To_tung_Hinh_su.svg', 'Storage/Slides_PPT/Slide_Quy_trinh_To_tung_Hinh_su.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (3, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 3), 1, 1, 0, NOW());

-- File: Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf', 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf', 'application/pdf', '.pdf', 'PDF', 1063, 'Storage/PDFs/Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 3, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf', 'Storage/PDFs/Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (4, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 4), 1, 1, 1, NOW());

-- File: Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4', 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4', 'video/mp4', '.mp4', 'VIDEO', 593061, 'Storage/Videos/Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 3, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4', 'Storage/Videos/Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (5, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 5), 1, 0, 0, NOW());

-- File: Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg', 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg', 'image/jpeg', '.jpg', 'IMAGE', 542091, 'Storage/Images/Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg', '7f78c8efdc6462b80722160290bb24da278a6ad5e12836e5fbbafe2782b5f515', 3, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg', 'Storage/Images/Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg', '7f78c8efdc6462b80722160290bb24da278a6ad5e12836e5fbbafe2782b5f515', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (5, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 5), 1, 1, 0, NOW());

-- File: Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4', 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4', 'video/mp4', '.mp4', 'VIDEO', 593061, 'Storage/Videos/Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4', 'Storage/Videos/Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4', '89823a0c75f0fdbd73927dac889fca44594776ff4af712d4b7796f4e6bce1edd', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (6, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 6), 1, 0, 0, NOW());

-- File: So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf', 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf', 'application/pdf', '.pdf', 'PDF', 1063, 'Storage/PDFs/So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf', 'Storage/PDFs/So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf', '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (6, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 6), 1, 1, 1, NOW());

-- File: Slide_Phan_tich_Chung_cu_Dien_tu.svg
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Slide_Phan_tich_Chung_cu_Dien_tu.svg', 'Slide_Phan_tich_Chung_cu_Dien_tu.svg', 'image/svg+xml', '.svg', 'SLIDE', 1504, 'Storage/Slides_PPT/Slide_Phan_tich_Chung_cu_Dien_tu.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Slide_Phan_tich_Chung_cu_Dien_tu.svg' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Slide_Phan_tich_Chung_cu_Dien_tu.svg', 'Storage/Slides_PPT/Slide_Phan_tich_Chung_cu_Dien_tu.svg', '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (6, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 6), 1, 1, 0, NOW());

-- File: Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx
INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx', 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx', 'DOCUMENT', 17725, 'Storage/Documents/Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx', '517fd20ac39f64ab3de8e1a0dfc94c555035d0296beaa69259dba23979dbcc97', 2, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);

SET @fId = (SELECT id FROM files WHERE original_name = 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx' LIMIT 1);
INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx', 'Storage/Documents/Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx', '517fd20ac39f64ab3de8e1a0dfc94c555035d0296beaa69259dba23979dbcc97', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);

INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (1, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = 1), 1, 1, 0, NOW());


-- Ngân hàng câu hỏi trắc nghiệm
INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (3, 'Thẩm quyền ra quyết định khởi tố vụ án hình sự thuộc về cơ quan nào sau đây?', '["Cơ quan điều tra và Viện kiểm sát", "Tòa án nhân dân cấp xã", "Ủy ban nhân dân cấp quận", "Văn phòng Luật sư"]', 0, 'Theo Bộ luật TTHS, Cơ quan điều tra, Viện kiểm sát có thẩm quyền ra quyết định khởi tố vụ án hình sự.', 1, NOW());

INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (3, 'Thời hạn tạm giữ thông thường theo quy định của Bộ luật Tố tụng Hình sự là bao lâu?', '["Không quá 3 ngày", "Không quá 7 ngày", "Không quá 15 ngày", "Không quá 30 ngày"]', 0, 'Thời hạn tạm giữ không được quá 03 ngày kể từ khi Cơ quan điều tra nhận người bị giữ.', 2, NOW());

INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (4, 'Nguyên tắc cơ bản nhất trong công tác trinh sát thực địa là gì?', '["Bí mật, bất ngờ và chủ động", "Công khai trên mạng xã hội", "Báo cáo qua tin nhắn không mã hóa", "Thực hiện đơn độc không phối hợp"]', 0, 'Bí mật, bất ngờ và chủ động nắm bắt diễn biến là nguyên tắc sống còn của công tác trinh sát CAND.', 1, NOW());

INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (5, 'Khi bảo vệ mục tiêu trọng điểm, phương án bảo vệ nào có tính chất quyết định?', '["Phương án phòng thủ nhiều lớp kết hợp tuần tra cơ động", "Chỉ bố trí 01 trạm gác cổng chính", "Không cần phân công ca trực", "Sử dụng lực lượng dân sự thay thế"]', 0, 'Bố trí nhiều lớp bảo vệ (vành đai ngoài, khu trung tâm, cốt lõi) kết hợp tuần tra cơ động bảo đảm mục tiêu an toàn tuyệt đối.', 1, NOW());

INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (6, 'Khi thu thập dấu vết kỹ thuật số trên máy tính tang vật đang hoạt động, thao tác đầu tiên là gì?', '["Bảo toàn RAM (Live Memory Acquisition) trước khi ngắt nguồn", "Ngắt nguồn điện ngay lập tức", "Format lại toàn bộ ổ đĩa cứng", "Cài thêm phần mềm diệt virus vào máy"]', 0, 'Cần trích xuất dữ liệu bộ nhớ RAM ngay khi máy đang mở để thu thập tiến trình, mật mã và khóa bảo mật chưa ghi xuống đĩa.', 1, NOW());

INSERT IGNORE INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
VALUES (6, 'Thuật toán băm nào thường được dùng để niêm phong tính toàn vẹn của chứng cứ số?', '["SHA-256", "MD4 (đã lỗi thời)", "DES 56-bit", "Base64"]', 0, 'SHA-256 là chuẩn băm mã hóa kháng va chạm cao được chấp nhận pháp lý trong giám định kỹ thuật số.', 2, NOW());

UPDATE lectures SET status = 'PUBLISHED' WHERE id IN (1, 2, 3, 4, 5, 6);
