// ========================================================================
// HỆ THỐNG CƠ SỞ DỮ LIỆU BÀI GIẢNG SỐ HÓA & HỌC LIỆU ĐA PHƯƠNG TIỆN (T04)
// Schema Relational DBMS:
// - Bảng MediaFiles: Quản lý độc lập các tập tin (PDF, Video, PPT, Ảnh sơ đồ)
// - Bảng Lectures: Quản lý thực thể Bài giảng (Khóa học)
// - Bảng LectureMediaItems: Khóa ngoại liên kết nhiều học liệu vào 1 bài giảng
// ========================================================================

export const INITIAL_LECTURES = [
  {
    id: 1,
    code: 'ANĐT.401',
    title: 'Khám nghiệm Hiện trường và Thu thập Dấu vết Tội phạm',
    departmentId: 'andieu-tra',
    departmentName: 'Khoa An ninh điều tra',
    lecturer: 'TS. Nguyễn Văn An (Trưởng khoa)',
    description: 'Chuyên đề đào tạo kỹ năng thực hành tiếp cận, bảo vệ hiện trường và thu thập bảo toàn dấu vết vật chứng hình sự, phục vụ công tác điều tra phá án an ninh quốc gia.',
    creditHours: 45,
    securityLevel: 'LƯU HÀNH NỘI BỘ',
    createdAt: '2026-09-01T08:00:00Z',
    // 1 BÀI GIẢNG GỒM NHIỀU HỌC LIỆU ĐÍNH KÈM (PDF, VIDEO, SLIDE, ẢNH SƠ ĐỒ)
    mediaItems: [
      {
        mediaFileId: 4,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Đề cương chi tiết & Căn cứ pháp lý khám nghiệm hiện trường',
        type: 'document'
      },
      {
        mediaFileId: 7,
        sectionIndex: 2,
        role: 'video',
        label: 'Video hướng dẫn quy chuẩn thao tác nghiệp vụ của Sĩ quan',
        type: 'video'
      },
      {
        mediaFileId: 1,
        sectionIndex: 2,
        role: 'slide',
        label: 'Giáo trình & Slide lý thuyết chuyên sâu Chương 1',
        type: 'document'
      },
      {
        mediaFileId: 6,
        sectionIndex: 3,
        role: 'situation_diagram',
        label: 'Sơ đồ tổ chức lực lượng và khoanh vùng tác chiến hiện trường',
        type: 'image'
      },
      {
        mediaFileId: 10,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Tài liệu quy trình nghiệp vụ & Quy định an ninh trật tự',
        type: 'document'
      }
    ]
  },
  {
    id: 2,
    code: 'ANM.502',
    title: 'Kỹ thuật Tác chiến Không gian mạng & Phòng chống Tội phạm CNC',
    departmentId: 'an-ninh-mang',
    departmentName: 'Khoa An ninh mạng & PCTP Công nghệ cao',
    lecturer: 'PGS.TS. Lê Hoàng Cường (Giảng viên chính)',
    description: 'Nghiên cứu kiến trúc phòng thủ hệ thống thông tin trọng yếu quốc gia, kỹ thuật bóc gỡ mã độc APT và quy trình thu thập bảo toàn chứng cứ số trong điều tra án mạng.',
    creditHours: 60,
    securityLevel: 'MẬT - AN NINH',
    createdAt: '2026-09-03T09:30:00Z',
    mediaItems: [
      {
        mediaFileId: 5,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Văn bản bảo vệ bí mật dữ liệu trong không gian mạng',
        type: 'document'
      },
      {
        mediaFileId: 3,
        sectionIndex: 2,
        role: 'slide',
        label: 'Slide phân tích kỹ thuật nhận diện mã độc & Tấn công mạng',
        type: 'image'
      },
      {
        mediaFileId: 8,
        sectionIndex: 3,
        role: 'situation_diagram',
        label: 'Bản đồ kiến trúc Trung tâm Giám sát An toàn Thông tin SOC',
        type: 'image'
      },
      {
        mediaFileId: 10,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Quy trình xử lý sự cố an ninh mạng cấp độ quốc gia',
        type: 'document'
      }
    ]
  },
  {
    id: 3,
    code: 'NVAN.305',
    title: 'Công tác Bảo vệ Bí mật Nhà nước trong Lực lượng CAND',
    departmentId: 'nghiep-vu-an',
    departmentName: 'Khoa Nghiệp vụ An ninh',
    lecturer: 'ThS. Trần Thị Bình (Phó Trưởng khoa)',
    description: 'Hệ thống hóa các quy tắc phân loại tài liệu mật, quản lý lưu trữ hồ sơ nghiệp vụ và các biện pháp phòng ngừa lộ, lọt bí mật nhà nước trong thời kỳ chuyển đổi số.',
    creditHours: 30,
    securityLevel: 'TUYỆT MẬT',
    createdAt: '2026-09-04T10:15:00Z',
    mediaItems: [
      {
        mediaFileId: 5,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Tài liệu hướng dẫn Luật Bảo vệ Bí mật Nhà nước',
        type: 'document'
      },
      {
        mediaFileId: 2,
        sectionIndex: 2,
        role: 'video',
        label: 'Video mô phỏng các tình huống vi phạm quy chế bảo mật',
        type: 'video'
      },
      {
        mediaFileId: 4,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Trích lục văn bản quy phạm pháp luật và biểu mẫu nghiệp vụ',
        type: 'document'
      },
      {
        mediaFileId: 9,
        sectionIndex: 5,
        role: 'audio',
        label: 'Ghi âm tọa đàm giải đáp vướng mắc bảo vệ bí mật tại địa phương',
        type: 'audio'
      }
    ]
  },
  {
    id: 4,
    code: 'LUAT.201',
    title: 'Thẩm quyền và Trình tự Tố tụng của Cơ quan An ninh Điều tra',
    departmentId: 'luat-qlnn',
    departmentName: 'Khoa Luật & QLNN về ANTT',
    lecturer: 'TS. Phạm Minh Đức (Giảng viên)',
    description: 'Phân tích các quy định của Bộ luật Tố tụng hình sự về khởi tố, điều tra các tội phạm xâm phạm an ninh quốc gia, thẩm quyền áp dụng các biện pháp ngăn chặn.',
    creditHours: 45,
    securityLevel: 'LƯU HÀNH NỘI BỘ',
    createdAt: '2026-09-05T14:20:00Z',
    mediaItems: [
      {
        id: 14,
        mediaFileId: 4,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Đề cương học phần Luật Tố tụng hình sự T04',
        type: 'document'
      },
      {
        id: 15,
        mediaFileId: 1,
        sectionIndex: 2,
        role: 'slide',
        label: 'Giáo trình căn bản thẩm quyền và quyền hạn của Điều tra viên',
        type: 'document'
      },
      {
        id: 16,
        mediaFileId: 10,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Tổng tập văn bản hướng dẫn thi hành Bộ luật TTHS',
        type: 'document'
      }
    ]
  },
  {
    id: 5,
    code: 'QSVT.102',
    title: 'Kỹ thuật, Chiến thuật Tác chiến & Sử dụng Vũ khí CCHT CAND',
    departmentId: 'quan-su-vo-thuat',
    departmentName: 'Khoa Quân sự - Võ thuật',
    lecturer: 'Thượng tá Trần Quốc Việt (Phó Khoa)',
    description: 'Huấn luyện kỹ năng sử dụng thành thạo vũ khí quân dụng, công cụ hỗ trợ, thế võ tác chiến áp sát và quy trình trấn áp đối tượng nguy hiểm trong mọi tình huống.',
    creditHours: 45,
    securityLevel: 'LƯU HÀNH NỘI BỘ',
    createdAt: '2026-09-06T08:00:00Z',
    mediaItems: [
      {
        id: 17,
        mediaFileId: 4,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Quy chuẩn huấn luyện thể lực, võ thuật CAND 2026',
        type: 'document'
      },
      {
        id: 18,
        mediaFileId: 7,
        sectionIndex: 2,
        role: 'video',
        label: 'Video thị phạm các đòn đánh đối kháng và khóa trói mục tiêu',
        type: 'video'
      },
      {
        id: 19,
        mediaFileId: 6,
        sectionIndex: 3,
        role: 'situation_diagram',
        label: 'Sơ đồ thế trận vây bắt đối tượng tại địa hình phức tạp',
        type: 'image'
      },
      {
        id: 20,
        mediaFileId: 10,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Luật Quản lý, sử dụng vũ khí, vật liệu nổ và CCHT',
        type: 'document'
      }
    ]
  },
  {
    id: 6,
    code: 'LLCT.101',
    title: 'Xây dựng Lực lượng CAND Thật sự Trong sạch, Vững mạnh, Cách mạng',
    departmentId: 'ly-luan-chinh-tri',
    departmentName: 'Khoa Lý luận chính trị & KHXHNV',
    lecturer: 'Đại tá, PGS.TS. Đỗ Thanh Bình (Chủ nhiệm Bộ môn)',
    description: 'Quán triệt Nghị quyết số 12-NQ/TW của Bộ Chính trị về đẩy mạnh xây dựng lực lượng CAND thật sự trong sạch, vững mạnh, chính quy, tinh nhuệ, hiện đại đáp ứng yêu cầu nhiệm vụ.',
    creditHours: 30,
    securityLevel: 'LƯU HÀNH NỘI BỘ',
    createdAt: '2026-09-07T07:30:00Z',
    mediaItems: [
      {
        id: 21,
        mediaFileId: 5,
        sectionIndex: 1,
        role: 'syllabus',
        label: 'Giáo trình Triết học Mác - Lênin & Tư tưởng Hồ Chí Minh trong CAND',
        type: 'document'
      },
      {
        id: 22,
        mediaFileId: 3,
        sectionIndex: 2,
        role: 'slide',
        label: 'Slide trình chiếu chuyên đề học tập và làm theo 6 điều Bác Hồ dạy',
        type: 'image'
      },
      {
        id: 23,
        mediaFileId: 9,
        sectionIndex: 5,
        role: 'audio',
        label: 'Ghi âm bài nói chuyện chuyên đề truyền thống anh hùng T04',
        type: 'audio'
      },
      {
        id: 24,
        mediaFileId: 10,
        sectionIndex: 4,
        role: 'reference_law',
        label: 'Văn kiện Nghị quyết 12-NQ/TW của Bộ Chính trị',
        type: 'document'
      }
    ]
  }
];

// Định nghĩa lược đồ DBMS quan hệ chuẩn
export const RELATIONAL_DBMS_SCHEMA = {
  database: 'DHAN_ELEANING_DB',
  version: '2.0.0',
  description: 'Cơ sở dữ liệu quan hệ quản lý bài giảng số hóa và kho học liệu đa phương tiện Intranet T04',
  tables: [
    {
      name: 'Lectures',
      description: 'Thực thể Bài giảng / Khóa học số hóa',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', nullable: false, description: 'Khóa chính tự tăng' },
        { name: 'code', type: 'VARCHAR(20)', nullable: false, description: 'Mã học phần' },
        { name: 'title', type: 'NVARCHAR(255)', nullable: false, description: 'Tên bài giảng' },
        { name: 'departmentId', type: 'VARCHAR(50)', nullable: false, description: 'Khoa chuyên ngành' },
        { name: 'departmentName', type: 'NVARCHAR(150)', nullable: false, description: 'Tên khoa phụ trách' },
        { name: 'lecturer', type: 'NVARCHAR(100)', nullable: false, description: 'Cán bộ / Giảng viên chính' },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true, description: 'Tóm tắt nội dung' },
        { name: 'creditHours', type: 'INT', nullable: false, description: 'Số tiết đào tạo' },
        { name: 'securityLevel', type: 'VARCHAR(30)', nullable: false, description: 'Cấp độ bảo mật' },
        { name: 'createdAt', type: 'DATETIME', nullable: false, description: 'Thời điểm tạo' }
      ]
    },
    {
      name: 'MediaFiles',
      description: 'Thực thể Tập tin đa phương tiện trong Kho tài liệu độc lập',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', nullable: false, description: 'Khóa chính' },
        { name: 'originalFileName', type: 'NVARCHAR(255)', nullable: false, description: 'Tên file gốc' },
        { name: 'storedFileName', type: 'VARCHAR(255)', nullable: false, description: 'Tên file lưu trên đĩa server' },
        { name: 'contentType', type: 'VARCHAR(100)', nullable: false, description: 'MIME type' },
        { name: 'fileSize', type: 'BIGINT', nullable: false, description: 'Dung lượng bytes' },
        { name: 'category', type: 'VARCHAR(30)', nullable: false, description: 'Loại học liệu (document, video, image, audio)' },
        { name: 'checksum', type: 'CHAR(64)', nullable: false, description: 'Mã băm SHA-256 xác thực bản quyền' },
        { name: 'createdAt', type: 'DATETIME', nullable: false, description: 'Thời điểm tải lên' }
      ]
    },
    {
      name: 'LectureMediaItems',
      description: 'Bảng liên kết quan hệ 1-nhiều / nhiều-nhiều giữa Bài giảng và Học liệu đính kèm',
      primaryKey: 'id',
      foreignKeys: [
        { column: 'lectureId', references: 'Lectures(id)', onDelete: 'CASCADE' },
        { column: 'mediaFileId', references: 'MediaFiles(id)', onDelete: 'RESTRICT' }
      ],
      columns: [
        { name: 'id', type: 'INT', nullable: false, description: 'Khóa chính' },
        { name: 'lectureId', type: 'INT', nullable: false, description: 'FK trỏ đến Lectures' },
        { name: 'mediaFileId', type: 'INT', nullable: false, description: 'FK trỏ đến MediaFiles' },
        { name: 'sectionIndex', type: 'TINYINT', nullable: false, description: 'Phân hệ trong bài giảng (1..5)' },
        { name: 'role', type: 'VARCHAR(50)', nullable: false, description: 'Vai trò: syllabus, video, slide, situation_diagram, reference_law, audio' },
        { name: 'label', type: 'NVARCHAR(255)', nullable: false, description: 'Nhãn mô tả học liệu trong bài giảng' },
        { name: 'type', type: 'VARCHAR(30)', nullable: false, description: 'Loại định dạng' }
      ]
    }
  ]
};

const LOCAL_STORAGE_KEY = 'dhan:lectures_db:v2';

// Lấy danh sách bài giảng (tự động nạp dữ liệu mẫu mới nếu chưa có)
export function getStoredLectures() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_LECTURES));
      return INITIAL_LECTURES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_LECTURES));
    return INITIAL_LECTURES;
  } catch {
    return INITIAL_LECTURES;
  }
}

// Khởi tạo lại dữ liệu mẫu bài giảng (Reset / Seed database)
export function resetStoredLectures() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_LECTURES));
    return INITIAL_LECTURES;
  } catch {
    return INITIAL_LECTURES;
  }
}

// Lưu danh sách bài giảng
export function saveLectures(lectures) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lectures));
  } catch (e) {
    console.error('Lỗi lưu danh sách bài giảng:', e);
  }
}

// Tra cứu xem 1 file học liệu đang được dùng trong những bài giảng nào (Reverse FK lookup)
export function getLecturesUsingFile(mediaFileId, lectures = []) {
  if (!mediaFileId || !Array.isArray(lectures)) return [];
  return lectures.filter(lec =>
    (lec.mediaItems || []).some(m => Number(m.mediaFileId) === Number(mediaFileId))
  );
}

// Kết hợp bài giảng với thông tin các file thực tế từ Media API
export function enrichLectureWithFiles(lecture, mediaFiles = []) {
  if (!lecture) return null;
  const enrichedItems = (lecture.mediaItems || []).map(item => {
    const file = mediaFiles.find(f => Number(f.id) === Number(item.mediaFileId));
    return {
      ...item,
      file: file || null
    };
  });

  return {
    ...lecture,
    enrichedMediaItems: enrichedItems,
    totalAttachedFiles: enrichedItems.length,
    hasVideo: enrichedItems.some(i => i.type === 'video' || i.file?.category === 'video'),
    hasPdf: enrichedItems.some(i => i.type === 'document' || i.file?.category === 'document'),
    hasImage: enrichedItems.some(i => i.type === 'image' || i.file?.category === 'image'),
    hasAudio: enrichedItems.some(i => i.type === 'audio' || i.file?.category === 'audio')
  };
}

