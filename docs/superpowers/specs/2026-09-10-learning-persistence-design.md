# Thiết kế hoàn thiện luồng học tập nhẹ trên MySQL

**Ngày:** 2026-09-10

## Mục tiêu

Hoàn thiện luồng học bài giảng hiện tại để PDF có tổng số trang chính xác và tiếp tục từ trang cuối, ghi chú gắn với từng trang, video tiếp tục từ thời điểm cuối và tự hoàn thành theo thời lượng, quiz có kết quả chính thức trong MySQL, file lớn luôn được stream, và các API danh sách lớn có phân trang/projection. Hệ thống tiếp tục dùng một React frontend, một ASP.NET Core Web API, MySQL và file storage trên disk.

## Phạm vi và thứ tự triển khai

Phạm vi được chia thành sáu lát dọc có thể build và kiểm tra độc lập:

1. PDF navigation, tổng số trang, resume theo file và ghi chú theo trang.
2. Tiến độ part/lecture, video resume và tự hoàn thành ở ngưỡng 90%.
3. Quiz draft ở `localStorage` và kết quả submit chính thức trong MySQL.
4. Chuẩn hóa lỗi API, bỏ SQLite/JSON fallback, bỏ `EnsureCreated()` và đưa schema sang EF Core migrations.
5. Pagination, projection, loại bỏ truy vấn dư/N+1 và bổ sung index theo query thực tế.
6. Tài liệu backup/restore MySQL + file storage và cơ chế dọn log có kiểm soát, không dùng background service chạy liên tục.

Không redesign UI, không xây RBAC mới, không thêm Redis, queue, search engine, transcoding, HLS, CDN hay microservice.

## Các phương án đã cân nhắc

### A. Lát dọc trên mô hình hiện tại — chọn

Mỗi nhóm được triển khai xuyên React, API, entity, migration và test trước khi sang nhóm sau. Phương án này tái sử dụng `TrainingDbContext`, `FilesController`, `FileStorageService`, `LectureStudyPage` và giảm rủi ro với worktree đang có nhiều thay đổi chưa commit.

### B. Viết lại learning module

Tạo module/controller/page mới sạch hơn nhưng phải thay nhiều interface đang chạy, dễ phá luồng hiện hữu và tăng phạm vi không cần thiết. Không chọn.

### C. Chỉ lưu trạng thái ở client

Rẻ về backend nhưng không đáp ứng persistence lâu dài, đổi thiết bị và điểm quiz chính thức. Không chọn.

## Kiến trúc dữ liệu

### `pdf_notes`

- `id` bigint unsigned, khóa chính.
- `user_id`, `file_id` bigint unsigned, khóa ngoại.
- `pdf_page` int unsigned, bắt đầu từ 1.
- `content` text.
- `created_at`, `updated_at` datetime.
- Index `(user_id, file_id, pdf_page)` phục vụ đúng truy vấn trang hiện tại.

Một người dùng có nhiều bản ghi trên cùng một trang. API không tải note của cả lecture.

### `learning_part_progress`

- `id`, `user_id`, `lecture_id`, `part_id`.
- `file_id` nullable để phân biệt tiến độ theo học liệu khi part có nhiều file.
- `completed`, `last_pdf_page`, `last_video_second`, `video_duration_second`.
- `created_at`, `updated_at`.
- Unique `(user_id, lecture_id, part_id, file_id)` và index `(user_id, lecture_id)`.

`last_pdf_page` được lưu theo file. `last_video_second` và duration dùng `decimal`/`double` hữu hạn, không âm. Lecture progress được tổng hợp bằng projection từ năm part, không ghi trùng trạng thái từng giây.

### `quiz_attempts`

- `id`, `quiz_id`, `user_id`, `lecture_id`.
- `answers_json`, `score`, `completed`, `submitted_at`, `created_at`, `updated_at`.
- Index `(user_id, lecture_id, quiz_id, submitted_at)`.

Quiz đang làm chỉ lưu trong `localStorage` theo user + lecture + quiz. MySQL chỉ nhận dữ liệu khi submit; kết quả chính thức được chấm lại ở backend từ định nghĩa quiz đáng tin cậy, không tin điểm do client gửi.

## API và luồng dữ liệu

### PDF và note

- React dùng `pdfjs-dist` đọc metadata trực tiếp từ URL stream có Range để lấy `numPages`; backend không parse PDF.
- Điều khiển First/Previous/Next/Last/Jump luôn clamp trong `[1, totalPages]` và hiển thị `currentPage / totalPages`.
- Khi đổi file PDF, client tải progress của đúng user + lecture và chọn `lastPdfPage` tương ứng; nếu chưa có thì trang 1.
- Client debounce PATCH trang cuối khoảng 2 giây và flush khi đổi file/rời trang bằng request thông thường; không gửi request cho từng lần Next.
- `GET /api/training/pdf-notes?userId=&fileId=&pdfPage=` chỉ trả note đúng trang.
- `POST`, `PATCH /{id}` và `DELETE /{id}` thao tác từng note. UI giữ vùng hiện tại làm composer và hiển thị danh sách note của trang bên dưới.

### Progress và video

- `GET /api/training/progress/{lectureId}?userId=` trả duy nhất progress của người dùng và lecture đó.
- `PATCH /api/training/progress` nhận một phần trường thay đổi cùng khóa `lectureId`, `partId`, `fileId`; không yêu cầu gửi toàn object.
- Video khôi phục `currentTime` sau `loadedmetadata`.
- Client chỉ ghi video tối đa mỗi 30 giây khi đang phát, và ghi thêm khi pause, ended, đổi file hoặc rời trang. Không polling.
- Video tự completed khi vị trí lớn nhất đạt ít nhất 90% duration hợp lệ. Nút hoàn thành thủ công không được dùng để vượt qua điều kiện này.

### Quiz

- Draft answers phục hồi từ `localStorage` khi refresh và được xóa sau submit thành công.
- `POST /api/training/quiz-attempts/submit` lưu một kết quả chính thức, answers, score, completed và submitted time.
- `GET /api/training/quiz-attempts/{lectureId}?userId=&quizId=` trả attempt gần nhất của đúng user/lecture/quiz.

### File streaming

- Stream/download tiếp tục trả `FileStreamResult` hoặc `PhysicalFile` với `enableRangeProcessing: true`.
- Chỉ query metadata cần cho kiểm quyền và đường dẫn. Không dùng `ReadAllBytes` cho PDF/video/file lớn.
- File DB không tồn tại trả 404 có code riêng; file vật lý không tồn tại trả 404 code khác; range sai để middleware/FileResult trả 416; lỗi bất ngờ trả 500 có envelope thống nhất.

## Lỗi API

Các API mới và API quan trọng được sửa dùng envelope:

```json
{
  "success": false,
  "message": "Không thể tải dữ liệu",
  "code": "DATABASE_ERROR"
}
```

Danh sách rỗng hợp lệ vẫn là 200; database lỗi, file metadata thiếu, file vật lý thiếu và dữ liệu đầu vào sai có mã khác nhau. Không trả exception hoặc connection string cho client.

## MySQL và migrations

- Gỡ package `Microsoft.EntityFrameworkCore.Sqlite`, `JsonMediaService` registration và toàn bộ nhánh TCP fallback.
- Cả DbContext luôn cấu hình Pomelo MySQL. Kết nối lỗi phải làm health/startup status báo lỗi rõ, không đổi storage mode.
- Bỏ `EnsureCreated()`. Tạo baseline/migration có kiểm soát cho schema hiện tại rồi migration tăng dần cho learning tables/indexes.
- Không tự chạy `Database.Migrate()` mỗi lần start. Migration được chạy bằng lệnh `dotnet ef database update` trong development/deployment có kiểm soát.

## Pagination và query

- Các endpoint users, lectures, files, logs, classrooms, quiz results và activity history nhận `page`/`pageSize`, giới hạn page size, trả `items`, `totalCount`, `page`, `pageSize`, `totalPages`.
- Query đọc dùng `AsNoTracking()` và projection trước `ToListAsync()`; không `Include` nếu projection có thể tạo SQL cần thiết.
- Không dùng `SELECT *`; không query progress từng lecture trong vòng lặp. Nếu danh sách cần progress, dùng join/subquery projection trong một query.
- Chỉ thêm index cho khóa lookup/query/sort thực tế: user/lecture/file/page/quiz và created/submitted timestamps liên quan.

## Backup và log retention

- Cung cấp tài liệu/script vận hành gọi `mysqldump`/`mysql` và copy/restore nguyên cây storage; manifest ghi thời điểm và đường dẫn để đối chiếu metadata với file.
- Không tự chạy backup trong web process.
- Log retention chạy theo lệnh quản trị thủ công hoặc endpoint quản trị có giới hạn batch; không background loop. Xóa theo cutoff/index `created_at` với batch nhỏ và báo số dòng đã xóa.

## Kiểm thử và tiêu chí hoàn thành

- Unit test JavaScript cho clamp/jump, debounce scheduling, video completion threshold và quiz draft key.
- API/integration test cho filtering note theo page, PATCH partial progress, user/lecture scoping, quiz submit và structured errors.
- Build React và .NET sau mỗi lát; chạy toàn bộ test trước khi kết luận.
- Sinh migration và kiểm tra SQL migration có bảng/index dự kiến, không có SQLite hoặc `EnsureCreated`.
- Kiểm tra stream bằng request Range và xác nhận 206/416 phù hợp; scan code để không có `ReadAllBytes` trong luồng PDF/video.
- Chạy `EXPLAIN` cho các query trọng yếu khi MySQL development kết nối được; nếu môi trường không có MySQL, báo rõ phần kiểm chứng chưa thể chạy, không dùng fallback.
- Không sửa hoặc hoàn tác các thay đổi không liên quan đang có trong worktree.
