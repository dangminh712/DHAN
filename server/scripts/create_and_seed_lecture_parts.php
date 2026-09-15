<?php
$m = new mysqli('127.0.0.1', 'root', '87A8Rqp1npAuTZk0UfIoaGDJriTtIEuvtqcazPCB4rg', 'training_management', 3307);
if ($m->connect_error) {
    die("Connect failed: " . $m->connect_error . "\n");
}

// 1. Create table lecture_parts
$sqlCreateTable = "
CREATE TABLE IF NOT EXISTS `lecture_parts` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if (!$m->query($sqlCreateTable)) {
    die("Failed to create lecture_parts table: " . $m->error . "\n");
}
echo "Table lecture_parts checked/created successfully.\n";

// 2. Clear old parts if re-seeding
$m->query("TRUNCATE TABLE lecture_parts");

// 3. Define 5 parts tailored for each lecture
$lecturePartsData = [
    1 => [ // Kỹ thuật Khám nghiệm hiện trường
        [1, 'Phần 1: Mục tiêu & Yêu cầu Khám nghiệm Hiện trường', 'Đề cương, căn cứ pháp lý theo BLTTHS & yêu cầu nghiệp vụ khám nghiệm', '15 phút', 15, 'doc', 'BookOpen', 'Yêu cầu sĩ quan điều tra nắm vững nguyên tắc bảo vệ hiện trường, phương pháp tiếp cận và ghi nhận dấu vết ban đầu.'],
        [2, 'Phần 2: Lý thuyết Khám nghiệm Chuyên đề & Trình chiếu', 'Slide bài giảng kỹ thuật bảo vệ hiện trường & Video thực địa trinh sát viên', '45 phút', 45, 'video', 'Video', 'Theo dõi video hướng dẫn kỹ thuật thu thập dấu vết vân tay, mẫu sinh học và slide bài giảng điện tử của Trưởng khoa ANDT.'],
        [3, 'Phần 3: Sơ đồ Hiện trường Vụ án & Tình huống Thực địa', 'Bản đồ tác chiến hiện trường vụ án, sơ đồ bố trí lực lượng & tọa độ dấu vết', '30 phút', 30, 'image', 'ImageIcon', 'Phân tích bản đồ hiện trường vụ án mạng, đánh giá hướng tẩu thoát của đối tượng và vị trí thu giữ hung khí.'],
        [4, 'Phần 4: Văn bản Quy phạm & Biên bản Khám nghiệm mẫu', 'Bộ luật TTHS 2015, Thông tư Bộ Công An về công tác khám nghiệm hiện trường', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu biểu mẫu biên bản khám nghiệm hiện trường, quy định niêm phong vật chứng và chứng cứ pháp lý.'],
        [5, 'Phần 5: Đánh giá Kỹ năng Khám nghiệm & Sổ tay Thu hoạch', 'Trắc nghiệm đánh giá nghiệp vụ điều tra & sổ tay thu hoạch cán bộ', '20 phút', 20, 'quiz', 'HelpCircle', 'Học viên hoàn thành 5 câu hỏi ôn tập chuyên đề và ghi chép kinh nghiệm nghiệp vụ vào sổ tay điện tử.']
    ],
    2 => [ // Phòng chống Tấn công mạng & Bảo vệ Bí mật Nhà nước
        [1, 'Phần 1: Mục tiêu & Căn cứ Pháp lý An ninh mạng', 'Luật An ninh mạng 2018, Luật Bảo vệ Bí mật Nhà nước & Tiêu chuẩn bảo mật', '15 phút', 15, 'doc', 'BookOpen', 'Nắm vững các hành vi bị cấm trên không gian mạng và trách nhiệm bảo vệ dữ liệu bí mật nhà nước độ Tối Mật, Tuyệt Mật.'],
        [2, 'Phần 2: Kỹ thuật Phòng thủ Mạng & Video Huấn luyện', 'Slide phân tích kỹ thuật APT & Video thao diễn ngăn chặn mã độc nguy hiểm', '45 phút', 45, 'video', 'Video', 'Video thực nghiệm phân tích chuỗi tấn công APT của nhóm gián điệp mạng và các biện pháp ứng cứu sự cố khẩn cấp.'],
        [3, 'Phần 3: Sơ đồ Kiến trúc Mạng & Bản đồ Luồng tấn công', 'Sơ đồ mạng bảo vệ nội bộ T04, luồng bóc tách dữ liệu và vùng phi quân sự DMZ', '30 phút', 30, 'image', 'ImageIcon', 'Quan sát bản đồ phân luồng truy cập và các điểm giám sát an ninh (IDS/IPS) trên mạng diện rộng ngành CAND.'],
        [4, 'Phần 4: Quy chế An toàn Thông tin & Nghị định Chính phủ', 'Nghị định 53/2022/NĐ-CP và Quy định sử dụng thiết bị lưu trữ di động', '25 phút', 25, 'doc', 'FileText', 'Tra cứu văn bản quy định điều kiện an ninh mạng đối với hệ thống thông tin quan trọng về an ninh quốc gia.'],
        [5, 'Phần 5: Kiểm tra Đánh giá Phòng thủ Mạng & Thu hoạch', 'Bài kiểm tra tình huống ứng phó tấn công mạng và thu hoạch bài học', '20 phút', 20, 'quiz', 'HelpCircle', 'Thực hiện bài kiểm tra trắc nghiệm nhận diện nguy cơ mã độc và biện pháp bảo mật thiết bị nghiệp vụ.']
    ],
    3 => [ // Quy trình Tố tụng Hình sự
        [1, 'Phần 1: Căn cứ Khởi tố Vụ án & Quyền hạn Điều tra viên', 'Thẩm quyền của Cơ quan An ninh điều tra theo BLTTHS 2015', '15 phút', 15, 'doc', 'BookOpen', 'Xác định các dấu hiệu tội phạm cấu thành căn cứ khởi tố vụ án hình sự về xâm phạm an ninh quốc gia.'],
        [2, 'Phần 2: Trình tự Tố tụng & Video Thực hành Diễn án', 'Slide trình tự giải quyết tin báo & Video thực hành diễn án khởi tố bị can', '45 phút', 45, 'video', 'Video', 'Theo dõi diễn án thực hành quy trình tống đạt quyết định khởi tố và kiểm sát viên tham gia giám sát.'],
        [3, 'Phần 3: Sơ đồ Quy trình Tố tụng & Sơ đồ Tổ chức Khởi tố', 'Sơ đồ phân định thẩm quyền khởi tố, thời hạn tạm giam và gia hạn điều tra', '30 phút', 30, 'image', 'ImageIcon', 'Sơ đồ hóa các mốc thời gian tố tụng từ khi thụ lý nguồn tin đến khi ban hành kết luận điều tra.'],
        [4, 'Phần 4: Hệ thống Văn bản Mẫu Tố tụng Hình sự', 'Các biểu mẫu tố tụng theo Thông tư liên tịch VKS - BCA - TANDTC', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu các mẫu lệnh bắt, lệnh tạm giữ, quyết định khởi tố vụ án và lệnh khám xét khẩn cấp.'],
        [5, 'Phần 5: Trắc nghiệm Quy trình Khởi tố & Thu hoạch Tố tụng', 'Bài kiểm tra năng lực áp dụng pháp luật tố tụng và thu hoạch cá nhân', '20 phút', 20, 'quiz', 'HelpCircle', 'Đánh giá kiến thức về căn cứ phê chuẩn của Viện kiểm sát và thẩm quyền điều tra viên.']
    ],
    4 => [ // Hồ sơ an ninh mạng chuyên sâu
        [1, 'Phần 1: Căn cứ Lập hồ sơ & Nguyên tắc Bảo mật', 'Quy chế công tác hồ sơ nghiệp vụ an ninh và bảo mật tài liệu chuyên môn', '15 phút', 15, 'doc', 'BookOpen', 'Quy định về lập, đăng ký, quản lý và sử dụng hồ sơ nghiệp vụ trong công tác an ninh mạng.'],
        [2, 'Phần 2: Lý thuyết Phân loại & Hồ sơ Số hóa', 'Slide quy chuẩn lập hồ sơ điện tử và video hướng dẫn tra cứu hồ sơ', '40 phút', 40, 'slide', 'Video', 'Hệ thống hóa tiêu chuẩn số hóa hồ sơ nghiệp vụ theo quy chuẩn của Cục Hồ sơ nghiệp vụ (V06).'],
        [3, 'Phần 3: Sơ đồ Quản lý & Vòng đời Hồ sơ Nghiệp vụ', 'Sơ đồ tiếp nhận, phân loại, giải mật và lưu trữ hồ sơ nghiệp vụ chuyên án', '30 phút', 30, 'image', 'ImageIcon', 'Mô hình hóa chu trình bảo quản tài liệu chuyên án từ giai đoạn khởi lập đến nộp lưu trữ vĩnh viễn.'],
        [4, 'Phần 4: Quy chế Quản lý Hồ sơ & Pháp lệnh Bảo vệ', 'Văn bản hướng dẫn của Bộ Công An về công tác lưu trữ hồ sơ đặc thù', '25 phút', 25, 'doc', 'FileText', 'Văn bản quy định chế độ bảo vệ bí mật hồ sơ nghiệp vụ đối với các vụ án xâm phạm an ninh quốc gia.'],
        [5, 'Phần 5: Kiểm tra Nghiệp vụ Hồ sơ & Sổ tay Thu hoạch', 'Đánh giá kỹ năng lập và khai thác hồ sơ lưu trữ an ninh', '20 phút', 20, 'quiz', 'HelpCircle', 'Học viên kiểm tra nhận thức về thời hạn bảo quản hồ sơ và thẩm quyền giải mật tài liệu.']
    ],
    5 => [ // Chiến thuật Trinh sát Thực địa & Bảo vệ Mục tiêu
        [1, 'Phần 1: Mục tiêu & Yêu cầu Chiến thuật Trinh sát', 'Mục tiêu tác chiến, đối tượng giám sát và phạm vi bảo vệ mục tiêu trọng yếu', '15 phút', 15, 'doc', 'BookOpen', 'Các nguyên tắc bí mật, linh hoạt, chủ động trong bố trí lực lượng trinh sát thực địa.'],
        [2, 'Phần 2: Kỹ năng Trinh sát & Video Diễn tập Thực địa', 'Slide chiến thuật tiếp cận mục tiêu & Video diễn tập phương án tác chiến A2', '45 phút', 45, 'video', 'Video', 'Ghi hình thực hành kỹ thuật theo dõi, giám sát bí mật và phối hợp tác chiến đón lõng đối tượng nguy hiểm.'],
        [3, 'Phần 3: Bản đồ Tác chiến & Phương án Bố trí Lực lượng', 'Bản đồ diễn tập thực địa, các chốt chặn và cung đường cơ động chiến đấu', '30 phút', 30, 'image', 'ImageIcon', 'Phương án bố trí đội hình bảo vệ mục tiêu trọng yếu và sơ đồ thoát hiểm khi xảy ra tình huống khẩn cấp.'],
        [4, 'Phần 4: Kế hoạch Tác chiến & Mệnh lệnh Hành động', 'Kế hoạch bảo vệ mục tiêu của Công an thành phố và quy trình sử dụng vũ khí', '25 phút', 25, 'doc', 'FileText', 'Nghiên cứu quy định pháp luật về nổ súng cảnh cáo và sử dụng công cụ hỗ trợ theo Luật CAND.'],
        [5, 'Phần 5: Sát hạch Chiến thuật Thực địa & Bài học Kinh nghiệm', 'Đánh giá khả năng xử lý tình huống thực địa và thu hoạch nghiệp vụ', '20 phút', 20, 'quiz', 'HelpCircle', 'Trả lời các câu hỏi tình huống về cách xử lý khi lộ bí mật trinh sát hoặc đối tượng chống trả.']
    ],
    6 => [ // Giám định Kỹ thuật hình sự & Phân tích Chứng cứ số
        [1, 'Phần 1: Nguyên tắc Thu thập & Bảo quản Chứng cứ số', 'Tiêu chuẩn bảo đảm tính toàn vẹn của dữ liệu điện tử theo ISO/IEC 27037', '15 phút', 15, 'doc', 'BookOpen', 'Nguyên tắc bất biến của chứng cứ số: Chain of Custody, Write Blocker và Hash Verification.'],
        [2, 'Phần 2: Kỹ thuật Giám định Số & Video Trích xuất Dữ liệu', 'Slide phương pháp dump RAM, phục hồi dữ liệu ổ cứng & Video thực hành', '45 phút', 45, 'video', 'Video', 'Video thao diễn sử dụng thiết bị trích xuất dữ liệu chuyên dụng Tableau và phần mềm phân tích EnCase.'],
        [3, 'Phần 3: Sơ đồ Luồng Dữ liệu & Cấu trúc Phân vùng Bộ nhớ', 'Sơ đồ cấu trúc Master Boot Record, phân vùng GPT và log hệ thống sự kiện', '30 phút', 30, 'image', 'ImageIcon', 'Phân tích cấu trúc bảng phân vùng ổ đĩa và vị trí lưu trữ dấu vết xóa file của đối tượng vi phạm.'],
        [4, 'Phần 4: Quy chuẩn Giám định Tư pháp & Biểu mẫu Báo cáo', 'Luật Giám định tư pháp và Mẫu kết luận giám định kỹ thuật số phục vụ tòa án', '25 phút', 25, 'doc', 'FileText', 'Quy cách lập bản kết luận giám định chứng cứ điện tử đáp ứng yêu cầu tranh tụng tại phiên tòa.'],
        [5, 'Phần 5: Đánh giá Năng lực Phân tích Chứng cứ số & Thu hoạch', 'Bài tập phân tích giá trị chứng minh của dấu vết kỹ thuật số', '20 phút', 20, 'quiz', 'HelpCircle', 'Kiểm tra hiểu biết về thuật toán băm SHA-256, chữ ký số và điều kiện chứng cứ số được công nhận.']
    ]
];

// Seed for remaining lectures (7 to 12) with standard high-standard CAND curriculum
for ($lecId = 1; $lecId <= 12; $lecId++) {
    $resLec = $m->query("SELECT id, title FROM lectures WHERE id = $lecId");
    $lec = $resLec ? $resLec->fetch_assoc() : null;
    if (!$lec) continue;

    $parts = $lecturePartsData[$lecId] ?? [
        [1, "Phần 1: Mục tiêu & Yêu cầu Nghiệp vụ ({$lec['title']})", "Đề cương chi tiết học phần, yêu cầu đào tạo và chuẩn đầu ra", "15 phút", 15, "doc", "BookOpen", "Nắm vững lý luận nghiệp vụ và phương châm công tác đối với chuyên đề {$lec['title']}."],
        [2, "Phần 2: Lý thuyết Chuyên sâu & Trình chiếu Minh họa", "Slide bài giảng số hóa và tư liệu video ghi hình giảng viên", "45 phút", 45, "video", "Video", "Bài giảng chuyên sâu phân tích thực tiễn công tác phòng chống tội phạm và các tình huống nghiệp vụ."],
        [3, "Phần 3: Tình huống Thực địa & Sơ đồ Tác chiến Nghiệp vụ", "Tư liệu sơ đồ hiện trường, bản đồ phối hợp tác chiến các đơn vị", "30 phút", 30, "image", "ImageIcon", "Phân tích sơ đồ tác chiến, đánh giá các điểm then chốt và kế hoạch điều hành tác chiến."],
        [4, "Phần 4: Văn bản Quy phạm Pháp luật & Hồ sơ Mẫu", "Hệ thống văn bản quy phạm pháp luật, chỉ thị, thông tư của Bộ Công An", "25 phút", 25, "doc", "FileText", "Tra cứu và đối chiếu các quy định pháp luật hiện hành áp dụng trực tiếp cho chuyên đề."],
        [5, "Phần 5: Câu hỏi Đánh giá & Sổ tay Thu hoạch Nghiệp vụ", "Bài tập đánh giá nhận thức và ghi nhận thu hoạch học phần", "20 phút", 20, "quiz", "HelpCircle", "Kiểm tra trắc nghiệm đánh giá kiến thức chuyên môn và tổng kết kinh nghiệm vào sổ tay nghiệp vụ."]
    ];

    $stmt = $m->prepare("
        INSERT INTO lecture_parts (lecture_id, part_number, title, subtitle, duration_text, duration_minutes, default_tab, icon_name, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            subtitle = VALUES(subtitle),
            duration_text = VALUES(duration_text),
            duration_minutes = VALUES(duration_minutes),
            default_tab = VALUES(default_tab),
            icon_name = VALUES(icon_name),
            description = VALUES(description)
    ");

    foreach ($parts as $p) {
        $partNum = $p[0];
        $title = $p[1];
        $subtitle = $p[2];
        $durText = $p[3];
        $durMin = $p[4];
        $defTab = $p[5];
        $icon = $p[6];
        $desc = $p[7];

        $stmt->bind_param("iisssisss", $lecId, $partNum, $title, $subtitle, $durText, $durMin, $defTab, $icon, $desc);
        $stmt->execute();
    }
    echo "Seeded 5 parts for Lecture $lecId: {$lec['title']}\n";
}

$countRes = $m->query("SELECT COUNT(*) FROM lecture_parts");
$total = $countRes->fetch_row()[0];
echo "=== TOTAL LECTURE PARTS IN DATABASE: $total ===\n";
