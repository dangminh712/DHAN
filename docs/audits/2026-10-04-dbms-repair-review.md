# Kết quả sửa học liệu và DBMS — 04/10/2026

Đã thực hiện trên ứng dụng React/.NET và MySQL cục bộ, sau khi sao lưu DB ngoài repository. Đây là đánh giá theo dữ liệu và tải thử hiện có, không phải chứng nhận vận hành sản xuất hay bảo đảm điểm chấm.

## Nội dung và giảng viên

- NVCB2: xác nhận **Thượng tá, TS. Đặng Bình Dương** phụ trách môn từ `server/Storage/courses/NVCB2/TAP3/1. KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf`, trang 6. Trang 1 ghi **2 tín chỉ**; đã sửa dữ liệu từ 3 xuống 2 và hiển thị tên/nguồn xác nhận trong trang môn học.
- Thông tin phụ trách là metadata có nguồn; chưa có tài khoản giảng viên đã xác minh tương ứng. Không tạo tài khoản hoặc gán quyền cho tài khoản khác thay thế.
- TCDT_403: thêm 3 chủ đề tham khảo công khai ở chương 2–4, mỗi chủ đề có PDF nguyên bản, nguồn và phiên bản. Chương 1 (id 12) giữ nguyên nội dung và trạng thái **DRAFT**.

| Chủ đề | Tài liệu | Nguồn | Trang |
|---|---|---|---:|
| Quản trị rủi ro và bảo vệ không gian mạng | NIST CSF 2.0, 2024 | [NIST](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf) | 32 |
| Quản lý và ứng phó sự cố | NIST SP 800-61 Rev.3, 2025 | [NIST](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf) | 48 |
| Cơ sở tín hiệu và hệ thống | MIT OCW 6.01SC, Chapter 5, 2011 | [MIT OCW](https://ocw.mit.edu/courses/6-01sc-introduction-to-electrical-engineering-and-computer-science-i-spring-2011/1268f3289b19d628e9be3bd2ecfb4f44_MIT6_01SCS11_chap05.pdf) | 65 |

Các PDF này là tài liệu tiếng Anh tham khảo, **không thay thế giáo trình nghiệp vụ được phê duyệt**. Đã kiểm tra đọc PDF, kích thước và SHA-256 khớp DB. Giữ nguyên nguồn/ghi công và giấy phép của MIT OCW.

## Tệp nhỏ và liên kết sai môn

- 8 tệp id 1, 3, 4, 5, 10, 11, 15, 16 đều đọc được nhưng chủ yếu là minh họa định dạng, không đủ làm giáo trình thực tế. Đã đổi tên rõ `Minh họa…` và chuyển nhóm học liệu sang `OTHER`.
- File 11 có nội dung chiến thuật trinh sát thực địa/bảo vệ mục tiêu, giữ ở NVAN_305 và sửa tên đang gây nhầm với kế hoạch NVCB2. File 15 là minh họa khám nghiệm dấu vết kỹ thuật số, phù hợp KTHS_402.
- Ẩn có thể khôi phục liên kết 20 và 22 (đề cương minh họa pháp luật gắn ANKT/ANTT), 24 và 25 (wallpaper/video mẫu TCDT). Giữ tệp và bản ghi liên kết, không xóa.
- Một số video seed vẫn trùng checksum video mẫu; chưa có nguồn bài giảng thật để thay thế. Không xem chúng là bằng chứng chất lượng nội dung môn.

## DBMS, tốc độ và dung lượng

- MySQL 8.0.43: **35 bảng**, **53 khóa ngoại**, **154 chỉ mục** sau khi thêm 4 chỉ mục. Đối chiếu khóa ngoại không phát hiện bản ghi mồ côi.
- Dữ liệu bảng + chỉ mục theo metadata InnoDB: **2.61 MiB**. Tệp hoạt động trong danh mục: **338,229,000 B ≈ 322.56 MiB**. Toàn bộ thư mục Storage: **538 tệp, 416,730,168 B ≈ 397.43 MiB**, bao gồm tài nguyên ngoài danh mục học liệu.
- Ổ máy chủ còn khoảng **183 GiB**. Dung lượng đủ rộng cho dữ liệu hiện tại; không có căn cứ phải chuyển DBMS hoặc lưu PDF vào blob trong DB.
- Tổng quan DBMS đã sửa endpoint sai `/api/system/overview` thành `/api/training/system/overview`, bỏ số liệu giả dự phòng, đọc bảng/thống kê thật. Tổng số dòng từ metadata có ghi **ước tính**, khác số đếm chính xác.
- Rút tổng quan từ khoảng 30 lượt truy vấn nối tiếp xuống 4 lượt đọc DB. API không tải nội dung tệp/bảng nhật ký vào bộ nhớ để tính dung lượng.
- Thêm chỉ mục theo thời gian/id cho audit, cảnh báo, phiên; chỉ mục tổ hợp lọc chương công bố và sắp xếp. EXPLAIN truy vấn chương chọn `IX_chapters_published_order` và không còn `Using filesort`. Nhật ký/phiên còn filesort ở tập dữ liệu rất nhỏ; không ép optimizer hoặc xóa chỉ mục khác để làm đẹp kết quả.
- Schema, EF snapshot và migration mới được đồng bộ; script bảo trì chỉ ghi lịch sử migration sau khi xác minh cấu trúc cột/chỉ mục đã khớp. Script kiểm tra không sửa DB mặc định; chế độ áp dụng yêu cầu đường dẫn bản sao lưu.

| API | Trung vị HTTP (20 lượt tuần tự) | P95 | 10 yêu cầu đồng thời | Lỗi |
|---|---:|---:|---:|---:|
| Tổng quan DBMS | 23.33 ms | 34.31 ms | 112.96 ms cho cả đợt | 0 |
| Danh mục môn | 18.60 ms | 24.37 ms | 79.11 ms cho cả đợt | 0 |

Trước sửa, 4 lượt tổng quan đã làm nóng đo được 29–55 ms; số mẫu nhỏ nên không suy ra phần trăm cải thiện đáng tin cậy. Lần đầu sau khởi động có chi phí khởi tạo lớn hơn (~1.54 s đọc DB/EF); cần phân biệt với các lượt đã làm nóng. Thử 10 yêu cầu chỉ là kiểm tra cục bộ giới hạn, chưa xác định số người dùng tối đa hay hiệu năng với hàng triệu bản ghi.

## Giao diện và kiểm chứng

- DBMS dùng màu xanh ngành, điểm nhấn vàng, bố cục thống nhất với cổng T04; hiển thị dung lượng học liệu, DB và ổ đĩa riêng. Có làm mới, tìm bảng, trạng thái tải/lỗi và thử lại.
- Đã kiểm tra trình duyệt ở desktop và 375 × 812: bố cục chuyển một cột, nội dung không tràn ngang. Giảng viên NVCB2 và 3 chủ đề TCDT hiển thị đúng.
- **71 kiểm thử client** và **6 kiểm thử miền môn học/migration backend** đạt. Kiểm thử phân trang trên MySQL thật đạt 12 nhóm endpoint, kiểm tra sắp xếp ổn định, giới hạn trang và tổng số sau lọc.
- Build client/backend thành công. Client còn cảnh báo bundle lớn (~2.27 MB chưa gzip, ~634 KB gzip) và PDF import chung; phù hợp thử nghiệm nội bộ hiện tại nhưng chưa tối ưu thời gian tải ban đầu trên mạng chậm.
- Audit sau sửa: **9 môn, 21 chương công bố, 226 liên kết học liệu hiển thị, 218 tệp khác nhau; 221 tài nguyên biểu mẫu đọc được; 0 lỗi kiểm tra**.

Các bằng chứng: `2026-10-04-data-audit.json`, `2026-10-04-data-repair.json`, `2026-10-04-dbms-before.json`, `2026-10-04-dbms-after.json`, `2026-10-04-performance.json`. Chạy lại `php server/scripts/verify_data_quality.php` để kiểm tra sửa dữ liệu; `node client/scripts/audit-data.mjs` kiểm tra API và tài nguyên.

Để nâng chất lượng học thuật tiếp, cần thay tài liệu minh họa/video seed bằng học liệu thực tế đã được giảng viên xác nhận. Bản hiện tại vẫn có cơ chế đổi tài khoản demo; các kết quả trên không xác nhận hệ thống đủ điều kiện tiếp nhận dữ liệu nghiệp vụ thật khi triển khai.
