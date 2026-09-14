const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

async function main() {
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
  const baseAudio = path.join(storageRoot, 'audio_on_tap.wav');
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
      classificationId: 2, // LƯU HÀNH NỘI BỘ
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
      classificationId: 3, // MẬT
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

  console.log('--- Chuẩn bị tệp học liệu vào các thư mục phân loại ---');
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
    console.log(`[FILE] ${item.targetDir.split(path.sep).pop()}/${item.fileName} (${item.fileSize} bytes)`);
  }

  console.log('--- Kết nối MySQL port 3307 ---');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg',
    database: 'training_management'
  });

  console.log('--- Nạp học liệu vào bảng files & lecture_files ---');
  for (const item of operationalFiles) {
    const [existing] = await conn.execute(
      'SELECT id FROM files WHERE original_name = ? AND status != "DELETED"',
      [item.fileName]
    );

    let fileId;
    if (existing.length > 0) {
      fileId = existing[0].id;
      await conn.execute(
        'UPDATE files SET storage_path = ?, file_size = ?, checksum_sha256 = ? WHERE id = ?',
        [item.relPath, item.fileSize, item.sha256, fileId]
      );
    } else {
      const [res] = await conn.execute(
        `INSERT INTO files (original_name, stored_name, mime_type, extension, file_type, file_size, storage_path, checksum_sha256, classification_level_id, uploaded_by, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE', NOW())`,
        [item.fileName, item.fileName, item.mime, item.ext, item.fileType, item.fileSize, item.relPath, item.sha256, item.classificationId]
      );
      fileId = res.insertId;

      await conn.execute(
        `INSERT INTO file_versions (file_id, version, stored_name, storage_path, checksum_sha256, uploaded_by, change_note, created_at)
         VALUES (?, 1, ?, ?, ?, 1, 'Nhập liệu học liệu lưu trữ', NOW())`,
        [fileId, item.fileName, item.relPath, item.sha256]
      );
    }

    if (item.lectureId) {
      const [existingLink] = await conn.execute(
        'SELECT id FROM lecture_files WHERE lecture_id = ? AND file_id = ?',
        [item.lectureId, fileId]
      );
      if (existingLink.length === 0) {
        const [orderRes] = await conn.execute(
          'SELECT COALESCE(MAX(display_order), 0) + 1 AS nextOrder FROM lecture_files WHERE lecture_id = ?',
          [item.lectureId]
        );
        const nextOrder = orderRes[0].nextOrder;
        await conn.execute(
          `INSERT INTO lecture_files (lecture_id, file_id, display_order, is_visible, is_downloadable, is_printable, created_at)
           VALUES (?, ?, ?, 1, ?, ?, NOW())`,
          [item.lectureId, fileId, nextOrder, item.fileType !== 'VIDEO', item.fileType === 'PDF']
        );
        console.log(` -> Đã liên kết File ${fileId} vào Bài giảng ${item.lectureId}`);
      }
    }
  }

  console.log('--- Bổ sung ngân hàng câu hỏi trắc nghiệm cho Bài giảng 3, 4, 5, 6 ---');
  const quizSeeds = [
    {
      lectureId: 3,
      q: 'Thẩm quyền ra quyết định khởi tố vụ án hình sự thuộc về cơ quan nào sau đây?',
      opts: JSON.stringify(['Cơ quan điều tra và Viện kiểm sát', 'Tòa án nhân dân cấp xã', 'Ủy ban nhân dân cấp quận', 'Văn phòng Luật sư']),
      correct: 0,
      exp: 'Theo Bộ luật TTHS, Cơ quan điều tra, Viện kiểm sát có thẩm quyền ra quyết định khởi tố vụ án hình sự.'
    },
    {
      lectureId: 3,
      q: 'Thời hạn tạm giữ thông thường theo quy định của Bộ luật Tố tụng Hình sự là bao lâu?',
      opts: JSON.stringify(['Không quá 3 ngày', 'Không quá 7 ngày', 'Không quá 15 ngày', 'Không quá 30 ngày']),
      correct: 0,
      exp: 'Thời hạn tạm giữ không được quá 03 ngày kể từ khi Cơ quan điều tra nhận người bị giữ.'
    },
    {
      lectureId: 4,
      q: 'Nguyên tắc cơ bản nhất trong công tác trinh sát thực địa là gì?',
      opts: JSON.stringify(['Bí mật, bất ngờ và chủ động', 'Công khai trên mạng xã hội', 'Báo cáo qua tin nhắn không mã hóa', 'Thực hiện đơn độc không phối hợp']),
      correct: 0,
      exp: 'Bí mật, bất ngờ và chủ động nắm bắt diễn biến là nguyên tắc sống còn của công tác trinh sát CAND.'
    },
    {
      lectureId: 5,
      q: 'Khi bảo vệ mục tiêu trọng điểm, phương án bảo vệ nào có tính chất quyết định?',
      opts: JSON.stringify(['Phương án phòng thủ nhiều lớp kết hợp tuần tra cơ động', 'Chỉ bố trí 01 trạm gác cổng chính', 'Không cần phân công ca trực', 'Sử dụng lực lượng dân sự thay thế']),
      correct: 0,
      exp: 'Bố trí nhiều lớp bảo vệ (vành đai ngoài, khu trung tâm, cốt lõi) kết hợp tuần tra cơ động bảo đảm mục tiêu an toàn tuyệt đối.'
    },
    {
      lectureId: 6,
      q: 'Khi thu thập dấu vết kỹ thuật số trên máy tính tang vật đang hoạt động, thao tác đầu tiên là gì?',
      opts: JSON.stringify(['Bảo toàn RAM (Live Memory Acquisition) trước khi ngắt nguồn', 'Ngắt nguồn điện ngay lập tức', 'Format lại toàn bộ ổ đĩa cứng', 'Cài thêm phần mềm diệt virus vào máy']),
      correct: 0,
      exp: 'Cần trích xuất dữ liệu bộ nhớ RAM ngay khi máy đang mở để thu thập tiến trình, mật mã và khóa bảo mật chưa ghi xuống đĩa.'
    },
    {
      lectureId: 6,
      q: 'Thuật toán băm nào thường được dùng để niêm phong tính toàn vẹn của chứng cứ số?',
      opts: JSON.stringify(['SHA-256', 'MD4 (đã lỗi thời)', 'DES 56-bit', 'Base64']),
      correct: 0,
      exp: 'SHA-256 là chuẩn băm mã hóa kháng va chạm cao được chấp nhận pháp lý trong giám định kỹ thuật số.'
    }
  ];

  for (const q of quizSeeds) {
    const [existingQ] = await conn.execute(
      'SELECT id FROM quiz_questions WHERE lecture_id = ? AND question = ?',
      [q.lectureId, q.q]
    );
    if (existingQ.length === 0) {
      await conn.execute(
        `INSERT INTO quiz_questions (lecture_id, question, options_json, correct_index, explanation, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [q.lectureId, q.q, q.opts, q.correct, q.exp]
      );
      console.log(` -> Đã thêm câu hỏi trắc nghiệm cho Bài giảng ${q.lectureId}`);
    }
  }

  // Đảm bảo bài giảng 6 có trạng thái PUBLISHED
  await conn.execute('UPDATE lectures SET status = "PUBLISHED" WHERE id = 6');

  await conn.end();
  console.log('=== HOÀN TẤT NHẬP LIỆU HỌC LIỆU VÀO CSDL MYSQL & CÁC FOLDER THÀNH CÔNG ===');
}

main().catch(err => {
  console.error('Lỗi khi nạp dữ liệu:', err);
  process.exit(1);
});
