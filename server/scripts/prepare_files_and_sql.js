const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const storageRoot = path.join(__dirname, '..', 'Storage');
const videosDir = path.join(storageRoot, 'Videos');
const pdfsDir = path.join(storageRoot, 'PDFs');
const slidesDir = path.join(storageRoot, 'Slides_PPT');
const audiosDir = path.join(storageRoot, 'Audios');
const imagesDir = path.join(storageRoot, 'Images');
const docsDir = path.join(storageRoot, 'Documents');

[videosDir, pdfsDir, slidesDir, audiosDir, imagesDir, docsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const baseVideo = path.join(storageRoot, 'video_huong_dan.mp4');
const basePdf = path.join(storageRoot, 'sample_de_cuong.pdf');
const baseSlide = path.join(storageRoot, 'sample_slide.svg');
const baseImage = path.join(storageRoot, 'so_do_kien_truc.jpg');
const baseXlsx = path.join(storageRoot, 'Mau_Nhap_Lieu_Hoc_Vien_T04.xlsx');

const operationalFiles = [
  {
    source: baseVideo,
    targetDir: videosDir,
    fileName: 'Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4',
    mime: 'video/mp4',
    fileType: 'VIDEO',
    ext: '.mp4',
    classificationId: 2,
    relPath: 'Storage/Videos/Video_Dien_an_Thuc_hanh_To_tung_Hinh_su.mp4',
    lectureId: 3
  },
  {
    source: baseSlide,
    targetDir: slidesDir,
    fileName: 'Slide_Quy_trinh_To_tung_Hinh_su.svg',
    mime: 'image/svg+xml',
    fileType: 'SLIDE',
    ext: '.svg',
    classificationId: 2,
    relPath: 'Storage/Slides_PPT/Slide_Quy_trinh_To_tung_Hinh_su.svg',
    lectureId: 3
  },
  {
    source: basePdf,
    targetDir: pdfsDir,
    fileName: 'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf',
    mime: 'application/pdf',
    fileType: 'PDF',
    ext: '.pdf',
    classificationId: 3,
    relPath: 'Storage/PDFs/Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf',
    lectureId: 4
  },
  {
    source: baseVideo,
    targetDir: videosDir,
    fileName: 'Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4',
    mime: 'video/mp4',
    fileType: 'VIDEO',
    ext: '.mp4',
    classificationId: 3,
    relPath: 'Storage/Videos/Video_Tap_huan_Bao_ve_Muc_tieu_Quan_trong.mp4',
    lectureId: 5
  },
  {
    source: baseImage,
    targetDir: imagesDir,
    fileName: 'Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg',
    mime: 'image/jpeg',
    fileType: 'IMAGE',
    ext: '.jpg',
    classificationId: 3,
    relPath: 'Storage/Images/Ban_do_Dien_tap_Thuc_dia_Phuong_an_A2.jpg',
    lectureId: 5
  },
  {
    source: baseVideo,
    targetDir: videosDir,
    fileName: 'Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4',
    mime: 'video/mp4',
    fileType: 'VIDEO',
    ext: '.mp4',
    classificationId: 2,
    relPath: 'Storage/Videos/Video_Phan_tich_Ma_doc_va_Truy_vet_IP.mp4',
    lectureId: 6
  },
  {
    source: basePdf,
    targetDir: pdfsDir,
    fileName: 'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf',
    mime: 'application/pdf',
    fileType: 'PDF',
    ext: '.pdf',
    classificationId: 2,
    relPath: 'Storage/PDFs/So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf',
    lectureId: 6
  },
  {
    source: baseSlide,
    targetDir: slidesDir,
    fileName: 'Slide_Phan_tich_Chung_cu_Dien_tu.svg',
    mime: 'image/svg+xml',
    fileType: 'SLIDE',
    ext: '.svg',
    classificationId: 2,
    relPath: 'Storage/Slides_PPT/Slide_Phan_tich_Chung_cu_Dien_tu.svg',
    lectureId: 6
  },
  {
    source: baseXlsx,
    targetDir: docsDir,
    fileName: 'Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileType: 'DOCUMENT',
    ext: '.xlsx',
    classificationId: 2,
    relPath: 'Storage/Documents/Bieu_mau_Danh_gia_Hoc_vien_T04.xlsx',
    lectureId: 1
  }
];

let sql = `USE training_management;\n\n`;

for (const item of operationalFiles) {
  const dest = path.join(item.targetDir, item.fileName);
  if (fs.existsSync(item.source)) {
    fs.copyFileSync(item.source, dest);
  } else {
    fs.writeFileSync(dest, 'Dữ liệu học liệu nghiệp vụ chuẩn hóa trường T04');
  }
  const buf = fs.readFileSync(dest);
  item.fileSize = buf.length;
  item.sha256 = crypto.createHash('sha256').update(buf).digest('hex');

  sql += `-- File: ${item.fileName}\n`;
  sql += `INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
VALUES ('${item.fileName}', '${item.fileName}', '${item.mime}', '${item.ext}', '${item.fileType}', ${item.fileSize}, '${item.relPath}', '${item.sha256}', ${item.classificationId}, 1, 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path), file_size = VALUES(file_size), checksum_sha256 = VALUES(checksum_sha256);\n\n`;

  sql += `SET @fId = (SELECT id FROM files WHERE original_name = '${item.fileName}' LIMIT 1);\n`;
  sql += `INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
VALUES (@fId, 1, '${item.fileName}', '${item.relPath}', '${item.sha256}', 1, 'Nhập liệu học liệu lưu trữ', NOW())
ON DUPLICATE KEY UPDATE storage_path = VALUES(storage_path);\n\n`;

  if (item.lectureId) {
    sql += `INSERT IGNORE INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
VALUES (${item.lectureId}, @fId, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM lecture_files lf WHERE lf.lecture_id = ${item.lectureId}), 1, ${item.fileType !== 'VIDEO' ? 1 : 0}, ${item.fileType === 'PDF' ? 1 : 0}, NOW());\n\n`;
  }
}

sql += `
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
`;

const sqlPath = path.join(__dirname, 'seed_operational_data.sql');
fs.writeFileSync(sqlPath, sql, 'utf8');
console.log('Đã tạo tệp SQL tại:', sqlPath);
