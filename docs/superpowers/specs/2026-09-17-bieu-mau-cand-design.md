# Thiết Kế Phân Hệ Biểu Mẫu Nghiệp Vụ Công An Nhân Dân (CAND)

- **Ngày ban hành:** 17/09/2026
- **Phạm vi áp dụng:** Nền tảng Đào tạo Trực tuyến & Học liệu Số DHAN (Học viện ANND)
- **Nguồn tài nguyên:** Phần mềm Biểu mẫu Hồ sơ Nghiệp vụ Công an nhân dân (`C:\Users\DangMinh\Desktop\thư mục không có tiêu đề\BieuMauHSNV`)

---

## 1. Mục Tiêu & Bối Cảnh

Hệ thống biểu mẫu nghiệp vụ Công an nhân dân (gồm biểu mẫu An ninh nhân dân và Cảnh sát nhân dân) là công cụ bắt buộc trong công tác hồ sơ, điều tra cơ bản, xác minh, lập chuyên án, quản lý nghiệp vụ CAND theo các Thông tư và Hướng dẫn của Bộ Công an.

Trước đây, phần mềm biểu mẫu chạy dưới dạng ứng dụng web offline đóng gói cùng OperaPortable36 với các hạn chế:
1. Bị phụ thuộc đường dẫn tĩnh ổ đĩa `C:\BieuMauHSNV\...`.
2. Chưa tích hợp vào hệ thống DHAN của Nhà trường.
3. Thiếu cơ chế tự động chuyển đổi các chỗ có dấu chấm chấm `........` thành ô nhập liệu thông minh.
4. Chưa hỗ trợ lưu nháp an toàn trên trình duyệt và xuất file Word (.doc/.docx) linh hoạt.

Mục tiêu thiết kế: Tích hợp hoàn chỉnh phân hệ **"Biểu mẫu Nghiệp vụ CAND"** vào DHAN với giao diện hiện đại, dễ sử dụng nhất, hỗ trợ cả 3 định dạng: **HTML điền trực tiếp, DOC/DOCX, và PDF viết tay/in ấn**, có khả năng lưu trữ cục bộ vào `localStorage` của trình duyệt và in ấn chuẩn khổ giấy A4.

---

## 2. Kiến Trúc & Xử Lý Các Loại Định Dạng Biểu Mẫu (HTML, DOC, PDF)

### 2.1. Phân loại và Logic xử lý cho từng định dạng

| Định dạng mẫu | Tình huống sử dụng | Logic xử lý trong hệ thống |
|---|---|---|
| **HTML (Biểu mẫu đánh máy chuẩn)** | 109 biểu mẫu có sẵn trong kho `Bieumau/*.html` | Hiển thị trong khung soạn thảo chuẩn A4. Các chỗ dấu `.....` và ô thông tin biến thành `contenteditable` / input inline. Tự động lưu `localStorage`. Hỗ trợ in trực tiếp và tải về file Word/HTML. |
| **DOC / DOCX (Tập tin Word)** | Biểu mẫu nghiệp vụ dưới dạng file Word do cán bộ tải lên hoặc mẫu lưu trữ dạng Word | Bộ phân tích (Parser) trích xuất nội dung, nhận diện các chuỗi dấu chấm `\.{3,}\|…\|_{3,}` để thay bằng ô nhập liệu trên giao diện web; cho phép điền xong tải về file Word (.doc/.docx) hoặc tải file gốc ban đầu. |
| **PDF (Bản viết tay & Mẫu trắng)** | 103 mẫu viết tay `HS_VIETTAY/*.pdf` và 11 văn bản hướng dẫn `TTHD/*.pdf` | **Chế độ Viết tay:** Mở trực tiếp trên PDF Viewer để in ra giấy viết bút mực.<br>**Chế độ Điền máy:** Đồng bộ chuyển sang mẫu HTML tương ứng (tỷ lệ 1:1 giữa 103 PDF và 109 HTML) hoặc hỗ trợ gõ chữ phủ lên vị trí dòng chấm của PDF. |

### 2.2. Chi tiết logic xử lý tự động biến dấu `....` thành ô nhập liệu (Fill-in Logic)
1. **Nhận diện mẫu ký tự trống:**
   - Hệ thống quét nội dung văn bản tìm các chuỗi dấu chấm liên tục: `\.{3,}`, dấu chấm lửng `…+`, gạch dưới `_{3,}`.
   - Nhận diện các thẻ `<span class="o_nhap_...">`, `<span contenteditable>`.
2. **Chuyển đổi thành trường nhập liệu tương tác (Smart Input Fields):**
   - Thay thế các dấu chấm bằng phần tử có thuộc tính `contenteditable="true"` hoặc `<input class="bm-inline-input" />`.
   - Có đường kẻ chân mờ tinh tế (dashes/dots underline) định vị dòng kẻ như trong văn bản gốc.
   - Khi người dùng click chuột vào, dấu chấm ẩn đi, chữ hiển thị rõ nét font **Times New Roman** chuẩn hành chính CAND.
   - Nếu để trống, đường kẻ chấm vẫn hiển thị khi in ra giấy (nếu muốn in mẫu bán điền).
3. **Đồng bộ tự động các trường liên quan (Auto-sync Fields):**
   - Các trường như "Họ và tên cán bộ thụ lý", "Cấp bậc", "Chức vụ", "Đơn vị" được gán ID liên kết; khi điền ở Điều 1, hệ thống tự động điền vào Điều 2 và bảng xác nhận phía sau.

### 2.3. Logic Lưu trữ cục bộ (Browser LocalStorage Engine)
* **Khóa lưu trữ (Storage Key):** `dhan_form_draft_{formId}` (ví dụ: `dhan_form_draft_B1`).
* **Cơ chế Auto-save:**
  - Lắng nghe sự kiện `input` trên toàn bộ vùng soạn thảo.
  - Sử dụng debounce 500ms để ghi dữ liệu vào `localStorage`.
  - Cập nhật chỉ báo trạng thái thời gian thực: `"🟢 Đã lưu vào trình duyệt lúc 15:20:05"`.
* **Khôi phục & Xóa:**
  - Khi người dùng mở lại biểu mẫu, hệ thống tự động kiểm tra `localStorage`, nếu có dữ liệu đã điền sẽ tự động tải lên nguyên vẹn.
  - Có nút *"🔄 Làm mới / Xóa bản nháp"* để quay về mẫu trắng gốc khi cần.
  - Có nút *"📥 Xuất bản sao lưu"* để người dùng tải file bản thảo về máy tính cá nhân.

### 2.4. Logic In ấn chuẩn A4 CAND (Print Engine)
* **CSS `@media print` chuyên dụng:**
  - Định dạng khổ giấy: `@page { size: A4 portrait; margin: 20mm 15mm 15mm 25mm; }` (chuẩn Nghị định 30/2020/NĐ-CP: lề trái 25-30mm, lề phải 15-20mm, lề trên 20-25mm, lề dưới 20-25mm).
  - Ẩn toàn bộ thanh điều hướng, nút bấm công cụ, thông báo trạng thái (`.no-print`, `button`, `.bm-toolbar`).
  - Khử bỏ viền khung nhập liệu (`border: none !important`), giữ lại nội dung văn bản sắc nét.
  - Xử lý ngắt trang tự động và ngắt trang cưỡng bức (`page-break-before: always`) cho mặt sau (trang 2) của biểu mẫu.

### 2.5. Logic Xuất file Word (.doc / .docx)
* Khi bấm **"Tải file Word (.doc)"**:
  - Hệ thống thu thập toàn bộ DOM hiện tại của biểu mẫu (đã chứa nội dung người dùng điền).
  - Đóng gói tài liệu kèm tiêu đề MIME `application/msword;charset=utf-8` và namespace XML của Microsoft Office (`urn:schemas-microsoft-com:office:word`).
  - Định nghĩa sẵn kích thước A4 và căn lề Word, đảm bảo khi cán bộ mở file trên Word 2016/2019/2021/365 sẽ giữ nguyên cấu trúc bảng biểu, quốc hiệu tiêu ngữ và chữ ký.

---

## 3. Cấu Trúc Dữ Liệu & Danh Mục Biểu Mẫu CAND

### 3.1. Phân hệ 1: Hồ Sơ An Ninh Nhân Dân (HSAN) - 11 nhóm hồ sơ
1. **ĐB**: Hồ sơ Điều tra cơ bản (17 biểu mẫu: B1, B3, B4, B19a, B20, B24, B26, B27a...)
2. **CN**: Hồ sơ Cá nhân (16 biểu mẫu: B1, B3, B4, B7a, B8, B9, B10, B11...)
3. **VA**: Hồ sơ Chuyên án (19 biểu mẫu: B1, B3, B4, B12, B13, B14, B15, B16...)
4. **AK**: Hồ sơ Vụ án hình sự (8 biểu mẫu: B1, B3, B4, B2...)
5. **TX**: Hồ sơ Truy xét (12 biểu mẫu)
6. **TT**: Hồ sơ Truy tìm (11 biểu mẫu)
7. **NV**: Hồ sơ Vấn đề nghiệp vụ (10 biểu mẫu)
8. **LL**: Hồ sơ Lực lượng bí mật (16 biểu mẫu)
9. **HT**: Hồ sơ Hộp thư bí mật (12 biểu mẫu)
10. **AT**: Hồ sơ Nhà an toàn (11 biểu mẫu)
11. **XP**: Hồ sơ Xử phạt hành chính (11 biểu mẫu)

### 3.2. Phân hệ 2: Hồ Sơ Cảnh Sát Nhân Dân (HSCS) - 23 nhóm hồ sơ
- Danh mục hồ sơ nghiệp vụ cảnh sát theo các quy định, thông tư nghiệp vụ CSND.

### 3.3. Phân hệ 3: Văn Bản & Hướng Dẫn Nghiệp Vụ (TTHD) - 11 tài liệu
- Hướng dẫn 3754/HD-A61-A93 về lập, đăng ký hồ sơ ANND.
- Hướng dẫn công tác hồ sơ CSND.
- Hướng dẫn công tác lưu trữ hồ sơ nghiệp vụ CAND.
- Hướng dẫn tàng thư căn cước can phạm.
- Hướng dẫn ứng dụng tin học trong công tác hồ sơ.
- Tài liệu hướng dẫn sử dụng phần mềm.

---

## 4. Giao Diện Người Dùng & Trải Nghiệm Tương Tác (UI/UX)

1. **Trang trung tâm Biểu mẫu (`#/bieu-mau`):**
   - Thanh tìm kiếm nhanh (gõ mã mẫu `B1`, `B20` hoặc tên `quyết định`, `thống kê`...).
   - Bộ lọc phân hệ: `Tất cả`, `An ninh nhân dân (HSAN)`, `Cảnh sát nhân dân (HSCS)`, `Hướng dẫn nghiệp vụ (TTHD)`.
   - Bộ lọc loại hồ sơ: Lọc nhanh theo `ĐB`, `CN`, `VA`, `LL`...
   - Nút "Mở file biểu mẫu ngoài (DOCX/PDF)": Cho phép người dùng tải file Word/PDF cá nhân lên để tự động điền trực tuyến.
2. **Hộp thoại / Màn hình Soạn thảo Biểu mẫu (Smart Form Modal / View):**
   - **Thanh công cụ đỉnh:**
     - Tên & mã biểu mẫu, căn cứ ban hành (Thông tư 60/2020/TT-BCA...).
     - Trạng thái lưu: `🟢 Đã lưu vào trình duyệt`.
     - Nút **"🖨️ In biểu mẫu (Ctrl+P)"** (nổi bật, 1-click in ngay).
     - Nút **"💾 Tải file Word (.doc)"**.
     - Nút **"📄 Xem bản viết tay (PDF)"**.
     - Nút **"🔄 Xóa điền lại"**.
     - Nút **"✕ Đóng"**.
   - **Vùng văn bản A4:**
     - Nền sáng trang nhã, hiệu ứng đổ bóng mô phỏng tờ giấy A4 đặt trên bàn làm việc.
     - Các trường điền có con trỏ gõ trực tiếp, phản hồi mượt mà không giật lắc.

---

## 5. Kế Hoạch Triển Khai

1. **Bước 1:** Sao chép và tổ chức tài nguyên từ thư mục Desktop vào thư mục lưu trữ của DHAN:
   - `client/public/bieumau/html/`: 109 biểu mẫu HTML (chuẩn hóa lại CSS liên kết).
   - `client/public/bieumau/pdf/`: 103 file PDF mẫu viết tay.
   - `client/public/bieumau/tthd/`: 11 file PDF văn bản hướng dẫn.
2. **Bước 2:** Xây dựng catalog dữ liệu `client/src/data/bieuMauCatalog.js` chứa đầy đủ metadata, mã hồ sơ, tên biểu mẫu, loại hồ sơ.
3. **Bước 3:** Xây dựng component `FormFillEditor.jsx` với engine nhận diện dấu `....`, auto-save `localStorage`, in A4, và xuất Word.
4. **Bước 4:** Xây dựng logic đọc và điền file biểu mẫu dạng DOC/DOCX và PDF (Parser & Overlay fill).
5. **Bước 5:** Xây dựng trang `BieuMauPage.jsx` với bộ lọc HSAN / HSCS / TTHD và tìm kiếm thông minh.
6. **Bước 6:** Tích hợp đường dẫn điều hướng trên Top Navigation Bar và thẻ truy cập nhanh trên `HomePage` và `StudentPortalPage`.
7. **Bước 7:** Kiểm thử toàn diện các luồng: Điền thử -> Lưu LocalStorage -> Đóng mở lại -> In trực tiếp -> Tải file Word -> Mở PDF viết tay -> Chạy test suite `node --test` và `npm run build`.
