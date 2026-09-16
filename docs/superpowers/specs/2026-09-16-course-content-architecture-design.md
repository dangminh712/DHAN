# Thiết kế kiến trúc Môn học – Chương – Tài liệu

**Ngày:** 2026-09-16  
**Trạng thái:** Đã duyệt thiết kế trong hội thoại, chờ duyệt đặc tả viết  
**Phạm vi:** MySQL/EF Core, ASP.NET Core API, React/Vite client

## 1. Mục tiêu

Thay đơn vị nội dung chính “Bài giảng” bằng mô hình:

> **Môn học → Chương → Tài liệu**

Người học có thể mở tài liệu trong tối đa ba thao tác: chọn môn học, chọn chương, mở tài liệu. Hệ thống phải hỗ trợ tìm kiếm toàn môn học, lọc theo chương và định dạng, hiển thị tốt trên máy tính lẫn điện thoại, đồng thời giữ nguyên các quy tắc bảo mật và quyền tải tệp đang có.

## 2. Quyết định kiến trúc

### 2.1 Domain chính

- `Subject` tiếp tục đại diện cho **Môn học** vì bảng `subjects` đã có đúng ý nghĩa, mã môn, tên, mô tả và đơn vị quản lý.
- Tạo entity `Chapter` đại diện cho **Chương**. Mỗi chương thuộc đúng một môn học, có thứ tự linh hoạt và không bị giới hạn ở tám chương.
- Tạo entity nối `ChapterMaterial` đại diện cho **Tài liệu trong chương**. Entity này liên kết tới `FileRecord` và giữ metadata theo ngữ cảnh như nhóm tài liệu, thứ tự, trạng thái hiển thị, quyền tải và quyền in.
- Không dùng `Lecture` làm chương. `lectures`, `lecture_files`, `lecture_parts` và API `/api/training/lectures` trở thành legacy sau khi dữ liệu cần thiết được migrate.

### 2.2 Lý do

Ánh xạ `Lecture = Chapter` sẽ nhanh hơn nhưng tiếp tục mang theo trạng thái xuất bản, tác giả, bài kiểm tra và tiến độ vốn thuộc nghiệp vụ bài giảng. Domain mới tách rõ trách nhiệm, giúp API, database và giao diện cùng sử dụng một ngôn ngữ, tránh việc đổi nhãn nhưng giữ logic cũ.

## 3. Mô hình dữ liệu

### 3.1 Bảng `subjects`

Giữ các trường hiện có và bổ sung khi cần:

- `id`, `code`, `name`, `description`, `organizational_unit_id`
- `image_url` hoặc `icon_name` cho ảnh/biểu tượng đại diện
- `status`, `created_at`, `updated_at`

`credits` vẫn được giữ vì phục vụ quản lý đào tạo nhưng không bắt buộc hiển thị trên thẻ môn học.

### 3.2 Bảng `chapters`

- `id`
- `subject_id` — khóa ngoại tới `subjects`
- `chapter_number` — số chương hiển thị
- `title`
- `description`
- `display_order`
- `status` — `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `created_at`, `updated_at`, `deleted_at`

Ràng buộc:

- Unique `(subject_id, chapter_number)`.
- Index `(subject_id, display_order)`.
- Soft delete để tránh làm mất liên kết tài liệu và lịch sử truy cập.

### 3.3 Bảng `chapter_materials`

- `id`
- `chapter_id` — khóa ngoại tới `chapters`
- `file_id` — khóa ngoại tới `files`
- `material_group` — `LECTURE`, `LESSON_PLAN`, `EXERCISE`, `QA`, `REFERENCE`, `OTHER`
- `display_order`
- `is_visible`
- `is_downloadable`
- `is_printable`
- `created_at`, `updated_at`

Ràng buộc:

- Unique `(chapter_id, file_id)`.
- Index `(chapter_id, display_order)`.
- Loại định dạng hiển thị lấy từ `files.file_type`, MIME type và extension; `material_group` chỉ mô tả vai trò học thuật của tài liệu.

### 3.4 Quyền truy cập

Phân loại bảo mật của `FileRecord` và dịch vụ `AccessDecisionService` tiếp tục là lớp kiểm soát cuối cùng khi mở hoặc tải tệp. Quyền tải xuống lấy từ `chapter_materials.is_downloadable` kết hợp với quyền người dùng; frontend không tự quyết định quyền.

Trong phạm vi lần triển khai này, danh sách môn học/chương tuân theo quyền xem tài liệu hiện có của người dùng. Một môn học hoặc chương chỉ được hiển thị nếu có ít nhất một tài liệu người dùng được phép xem, ngoại trừ quản trị viên và giảng viên được phân công.

## 4. Migration dữ liệu

Migration thực hiện theo hướng không phá hủy:

1. Tạo `chapters` và `chapter_materials`.
2. Giữ nguyên `subjects` và `files`.
3. Với mỗi `Lecture` cũ, tạo một `Chapter` trong môn học tương ứng theo thứ tự ổn định (`created_at`, sau đó `id`).
4. Chuyển từng `LectureFile` sang `ChapterMaterial`, giữ thứ tự, quyền hiển thị, tải và in.
5. Suy luận `material_group` từ loại tệp và tên tệp; trường hợp không chắc chắn dùng `OTHER`.
6. Seed môn `NVCB2` với tám chương mẫu đã duyệt. Migration phải idempotent theo khóa tự nhiên để không nhân đôi dữ liệu khi chạy lại seed ở môi trường phát triển.
7. Không xóa bảng legacy trong cùng migration. Sau khi API mới và kiểm thử dữ liệu vượt qua, code mới ngừng đọc/ghi các bảng này. Việc xóa vật lý là một migration độc lập về sau.

Nếu NVCB2 đã tồn tại, seed cập nhật theo mã môn thay vì tạo bản ghi mới. Tám chương chỉ là dữ liệu mẫu của NVCB2, không phải khuôn bắt buộc cho môn khác.

## 5. Backend API

Base route mới: `/api/courses`.

### 5.1 Danh sách môn học

`GET /api/courses`

Query: `search`, `page`, `pageSize`, `sortBy`, `sortDir`.

Mỗi item trả về:

- `id`, `code`, `name`, `description`, `imageUrl`, `iconName`
- `chapterCount`
- `materialCount`
- các định dạng hiện có

### 5.2 Chi tiết môn học

`GET /api/courses/{courseId}`

Trả về thông tin môn học và danh sách chương đã sắp xếp. Mỗi chương gồm số chương, tên, mô tả, số tài liệu và tập định dạng hiện có.

### 5.3 Chi tiết chương

`GET /api/courses/{courseId}/chapters/{chapterId}`

Query: `format`, `group`, `search`, `page`, `pageSize`.

API xác thực chương thuộc đúng môn học, áp dụng quyền truy cập và trả metadata tài liệu, URL mở, cùng cờ `canDownload` do server quyết định.

### 5.4 Tìm kiếm toàn môn học

`GET /api/courses/{courseId}/materials/search`

Query: `q`, `chapterId`, `format`, `page`, `pageSize`.

Tìm trên:

- tên tài liệu;
- tên và mô tả chương;
- extension, MIME type và loại tệp;
- nhóm tài liệu.

Chuỗi tìm kiếm được trim, chuẩn hóa Unicode và so khớp không phân biệt hoa/thường hoặc dấu. Database dùng collation accent-insensitive phù hợp với MySQL; lớp ứng dụng có hàm chuẩn hóa thống nhất cho kiểm thử và môi trường không hỗ trợ collation tương đương. Query phải được giới hạn độ dài và phân trang.

### 5.5 Ghi dữ liệu

Để domain mới dùng được lâu dài, backend có CRUD dành cho giảng viên/quản trị viên:

- tạo/sửa/sắp xếp/ẩn chương;
- gắn hoặc gỡ tài liệu khỏi chương;
- đổi nhóm tài liệu;
- cập nhật quyền tải/in.

Các endpoint ghi tiếp tục tạo audit log và kiểm tra vai trò; người học chỉ có quyền đọc.

## 6. Frontend

### 6.1 Điều hướng

- `#/mon-hoc` — danh sách môn học.
- `#/mon-hoc/:courseId` — chi tiết môn học.
- `#/mon-hoc/:courseId/chuong/:chapterId` — chi tiết chương.
- `#/view/:fileId` — tiếp tục dùng trình xem tệp hiện có sau khi server xác thực quyền.

Navbar đổi nhãn chính thành **Môn học**. Các mục “Bài giảng điện tử”, “Phòng học bài giảng” và “Biên soạn bài giảng” không còn xuất hiện trong luồng điều hướng chính. Code legacy chưa được xóa cho tới khi migration và các trang mới hoạt động ổn định.

### 6.2 Trang danh sách môn học

- Tiêu đề gọn, không có hero/banner lớn.
- Thanh tìm kiếm rõ ràng ở đầu nội dung.
- Grid thẻ môn học responsive.
- Mỗi thẻ hiển thị tên, mã, ảnh/icon, số chương, tổng tài liệu và nút “Xem môn học”.
- Có trạng thái loading, lỗi, rỗng và không có kết quả.

### 6.3 Trang chi tiết môn học

- Header nhỏ gồm tên, mã, mô tả và thống kê.
- Thanh tìm kiếm toàn môn học nằm trong vùng nhìn đầu tiên và có nhãn truy cập được.
- Bộ lọc chương và định dạng xuất hiện cạnh hoặc ngay dưới thanh tìm kiếm.
- Desktop hiển thị danh sách chương dạng thẻ/hàng; mobile dùng nút chọn chương/menu thu gọn nhưng vẫn cho phép cuộn danh sách kết quả.
- Khi có từ khóa, kết quả tài liệu toàn môn học xuất hiện trực tiếp; không bắt người dùng phải đoán chương trước.

### 6.4 Trang chi tiết chương

- Breadcrumb `Môn học / Chương N`.
- Tiêu đề, mô tả và tổng số tài liệu.
- Filter chip/select: Tất cả, PDF, Video, PowerPoint, Word, Hình ảnh.
- Mỗi tài liệu hiển thị icon Lucide, tên đầy đủ qua tooltip/title, định dạng, dung lượng, nhóm học thuật, nút “Mở tài liệu” và nút “Tải xuống” khi `canDownload = true`.

### 6.5 Trạng thái và lỗi

- Skeleton hoặc loading indicator có thông báo ngắn.
- Lỗi API hiển thị thông điệp có thể hành động và nút thử lại.
- Route không hợp lệ hoặc dữ liệu không tồn tại có trang 404 trong layout.
- Khi quyền bị từ chối, hiển thị thông báo 403; không tiết lộ metadata nhạy cảm của tài liệu.

## 7. Hệ thống giao diện và khả năng truy cập

- Phong cách tối giản, content-first, phù hợp cổng tài liệu nội bộ.
- Màu chủ đạo xanh navy, trắng và xanh dương; màu trạng thái không dùng như tín hiệu duy nhất.
- Font hệ thống ưu tiên để chạy tốt trên intranet; cỡ nội dung tối thiểu 16px, line-height tối thiểu 1.5.
- Tương phản chữ tối thiểu 4.5:1.
- Mọi thao tác dùng được bằng bàn phím, có focus ring rõ ràng.
- Vùng chạm tối thiểu 44×44px, khoảng cách giữa thao tác tối thiểu 8px.
- Chỉ dùng Lucide/SVG, không dùng emoji làm icon giao diện.
- Chuyển động 150–250ms và tôn trọng `prefers-reduced-motion`.
- Không có cuộn ngang tại 375px, 768px, 1024px và 1440px.

## 8. Hiệu năng

- Frontend dùng `useDeferredValue` hoặc debounce ngắn cho ô tìm kiếm; hủy request cũ khi từ khóa thay đổi.
- API luôn phân trang và chỉ projection các cột cần thiết.
- Count tài liệu/chương được tính trong query tổng hợp, tránh N+1.
- Index phục vụ quan hệ chương và tìm kiếm metadata; kiểm tra execution plan với tập dữ liệu đại diện.
- Ảnh môn học dùng kích thước cố định, lazy loading và định dạng tối ưu; icon là fallback mặc định.

## 9. Kiểm thử và tiêu chí chấp nhận

### 9.1 Database/backend

- Migration tạo đúng khóa ngoại, unique constraint và index.
- Dữ liệu lecture/file cũ được chuyển mà không mất file hoặc quyền tải.
- API chỉ trả môn/chương/tài liệu người dùng được phép xem.
- `ke hoach giang day` tìm được `KẾ HOẠCH GIẢNG DẠY HP NVCB2.pdf`.
- Bộ lọc chương và định dạng kết hợp đúng với từ khóa.
- `canDownload` phản ánh cả cấu hình tài liệu và quyền người dùng.
- CRUD chương/tài liệu bị từ chối với người dùng không đủ vai trò.

### 9.2 Frontend

- Người dùng mở tài liệu trong tối đa ba thao tác từ danh sách môn học.
- Ô tìm kiếm và danh sách chương xuất hiện trong màn hình đầu ở desktop phổ biến.
- Tên dài không phá layout và vẫn xem được đầy đủ.
- Keyboard-only hoàn thành được luồng chọn môn, chọn chương, mở tài liệu.
- Các trạng thái loading, rỗng, lỗi, 403 và 404 đều có giao diện rõ ràng.
- Build production thành công; kiểm tra responsive ở 375/768/1024/1440px.

## 10. Ngoài phạm vi

- Xây mới trình chỉnh sửa PowerPoint/Word/PDF trong trình duyệt.
- Thay đổi cơ chế lưu file vật lý.
- Xóa ngay các bảng legacy hoặc lịch sử học tập cũ.
- Thiết kế lại toàn bộ khu vực quản trị không liên quan đến môn học.
- Thêm bài kiểm tra, chấm điểm hoặc tiến độ theo chương nếu chưa có yêu cầu riêng.

## 11. Trình tự chuyển đổi

1. Thêm domain, migration và seed mới.
2. Thêm API đọc/tìm kiếm và kiểm thử backend.
3. Thêm ba trang frontend và route mới.
4. Nối trình xem/tải tài liệu với quyền server.
5. Thêm CRUD chương/tài liệu vào luồng giảng viên/quản trị hiện có ở mức cần thiết.
6. Đổi navbar, nhãn và liên kết chính từ bài giảng sang môn học.
7. Chạy migration dữ liệu, kiểm thử hồi quy và responsive.
8. Ngừng đọc/ghi API lecture trong giao diện chính; giữ legacy code tạm thời để rollback an toàn.
