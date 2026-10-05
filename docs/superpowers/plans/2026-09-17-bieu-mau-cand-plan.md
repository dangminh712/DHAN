# Biểu Mẫu Nghiệp Vụ Công An Nhân Dân (CAND) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp toàn diện phần mềm Biểu mẫu Nghiệp vụ Công an nhân dân vào nền tảng DHAN, hỗ trợ điền trực tiếp vào các dấu `....`, lưu nháp trên `localStorage` trình duyệt, in ấn chuẩn A4 CAND, xuất file Word/HTML, và xử lý các định dạng HTML, DOC/DOCX, PDF.

**Architecture:** Tạo phân hệ Biểu mẫu CAND trên route `#/bieu-mau` với catalog 109+ biểu mẫu ANND và CSND. Xây dựng engine `bieuMauEngine.js` nhận diện dòng chấm `....` và chuyển thành trường nhập liệu tương tác. Cung cấp bộ công cụ xuất Word (`application/msword`), in ấn (@media print chuẩn A4), lưu nháp tự động qua `localStorage`, và phân tích file DOC/PDF tải lên.

**Tech Stack:** React, Vanilla CSS, Vite, HTML5 contenteditable, Web Storage API (localStorage), Word MIME XML export, window.print (@media print).

**Spec:** [docs/superpowers/specs/2026-09-17-bieu-mau-cand-design.md](file:///c:/Users/DangMinh/Documents/GitHub/DHAN/docs/superpowers/specs/2026-09-17-bieu-mau-cand-design.md)

## Global Constraints
- Toàn bộ văn bản biểu mẫu phải tuân thủ font **Times New Roman** và thể thức hành chính CAND.
- In ấn bắt buộc tuân thủ khổ **A4**, khử viền nhập liệu, ẩn thanh công cụ.
- Tự động lưu nháp vào `localStorage` với tiền tố `dhan_bm_draft_`.
- Không làm gãy hỏng bộ kiểm thử hiện tại (21/21 client unit tests, 3/3 server tests).

---

### Task 1: Sao chép & Chuẩn hóa Tài nguyên Biểu mẫu CAND

**Files:**
- Create/Copy: `client/public/bieumau/html/` (109 file HTML biểu mẫu)
- Create/Copy: `client/public/bieumau/pdf/` (103 file PDF viết tay)
- Create/Copy: `client/public/bieumau/tthd/` (11 file PDF hướng dẫn)
- Create/Copy: `client/public/bieumau/style/` (CSS styles)
- Create/Copy: `client/public/bieumau/image/` (Assets)
- Copy: `server/Storage/bieumau/` (Lưu trữ an toàn trên backend)
- Script: `server/scripts/sync_bieumau_assets.php`

**Interfaces:**
- Consumes: Thư mục nguồn `C:\Users\DangMinh\Desktop\thư mục không có tiêu đề\BieuMauHSNV`
- Produces: Thư mục tài nguyên web tĩnh `/bieumau/...` với đường dẫn liên kết CSS/JS tương đối, loại bỏ sạch `._*` và `.DS_Store`.

- [ ] **Step 1: Viết kịch bản PHP đồng bộ và làm sạch tài nguyên**
- [ ] **Step 2: Chạy kịch bản đồng bộ và kiểm tra số lượng tệp (109 HTML, 103 PDF, 11 TTHD)**
- [ ] **Step 3: Chuẩn hóa đường dẫn trong các file HTML (chuyển `C://BieuMauHSNV/Style/...` thành `/bieumau/style/...`)**

---

### Task 2: Xây dựng Catalog Dữ Liệu Biểu Mẫu CAND

**Files:**
- Create: `client/src/data/bieuMauCatalog.js`
- Test: `client/tests/bieuMauCatalog.test.js`

**Interfaces:**
- Produces: 
  - `BIEU_MAU_CATALOG`: Mảng danh mục các biểu mẫu (code, name, category, group, htmlFile, pdfFile, description)
  - `BIEU_MAU_CATEGORIES`: Danh mục các nhóm hồ sơ (ĐB, CN, VA, AK, TX, TT, NV, LL, HT, AT, XP...)
  - `getFormsByCategory(catKey)`: Lọc biểu mẫu theo nhóm hồ sơ
  - `searchForms(query, group)`: Tìm kiếm biểu mẫu theo mã hoặc tên

- [ ] **Step 1: Viết bài test kiểm tra catalog**
- [ ] **Step 2: Chạy test để xác nhận fail**
- [ ] **Step 3: Viết mã triển khai `bieuMauCatalog.js`**
- [ ] **Step 4: Chạy test xác nhận pass**

---

### Task 3: Xây dựng Engine Điền Dấu Chấm, Lưu LocalStorage & Xuất Word

**Files:**
- Create: `client/src/utils/bieuMauEngine.js`
- Test: `client/tests/bieuMauEngine.test.js`

**Interfaces:**
- Produces:
  - `transformDottedToInputs(htmlContent)`: Tìm các chuỗi dấu chấm `\.{3,}|…|_{3,}` và chuyển thành `<span class="bm-inline-input" contenteditable="true">`
  - `saveFormDraft(formCode, contentHtml)`: Lưu vào localStorage `dhan_bm_draft_{formCode}`
  - `getFormDraft(formCode)`: Lấy dữ liệu nháp từ localStorage
  - `clearFormDraft(formCode)`: Xóa dữ liệu nháp
  - `exportToWord(title, htmlElement)`: Tạo file `.doc` chuẩn MIME Word và kích hoạt tải về

- [ ] **Step 1: Viết unit tests cho `bieuMauEngine.js`**
- [ ] **Step 2: Chạy test để xác nhận fail**
- [ ] **Step 3: Viết mã triển khai `bieuMauEngine.js`**
- [ ] **Step 4: Chạy test xác nhận pass**

---

### Task 4: Xử Lý Logic Khi Biểu Mẫu Là File DOC hoặc PDF Tải Lên

**Files:**
- Create: `client/src/utils/documentFormParser.js`
- Test: `client/tests/documentFormParser.test.js`

**Interfaces:**
- Produces:
  - `parseCustomDocx(file)`: Phân tích nội dung file DOCX, nhận diện dòng chấm và tạo giao diện HTML tương tác
  - `detectPdfFormType(file)`: Nhận diện file PDF (mẫu viết tay hay biểu mẫu điền)

- [ ] **Step 1: Viết test cho `documentFormParser.js`**
- [ ] **Step 2: Chạy test xác nhận fail**
- [ ] **Step 3: Viết mã triển khai `documentFormParser.js`**
- [ ] **Step 4: Chạy test xác nhận pass**

---

### Task 5: Xây dựng Trình Soạn Thảo Biểu Mẫu A4 Thông Minh (`FormEditorModal.jsx`)

**Files:**
- Create: `client/src/components/bieumau/FormEditorModal.jsx`
- Create: `client/src/styles/bieumau.css`

**Interfaces:**
- Props: `isOpen`, `onClose`, `formItem`, `onOpenPdfViewer`
- Features:
  - Tải HTML biểu mẫu, áp dụng `transformDottedToInputs`
  - Tự động nạp bản nháp từ `localStorage` nếu có
  - Lắng nghe gõ phím để tự động auto-save kèm chỉ báo thời gian
  - Nút **"🖨️ In biểu mẫu (Ctrl+P)"** gọi `window.print()`
  - Nút **"💾 Tải file Word (.doc)"**
  - Nút **"📄 Xem bản viết tay (PDF)"**
  - Nút **"🔄 Xóa điền lại"**

- [ ] **Step 1: Tạo file CSS `client/src/styles/bieumau.css` với khổ giấy A4 và `@media print`**
- [ ] **Step 2: Xây dựng component `FormEditorModal.jsx`**
- [ ] **Step 3: Kiểm thử thủ công và kiểm tra tương tác điền**

---

### Task 6: Xây dựng Trang Trung Tâm Biểu Mẫu CAND (`BieuMauPage.jsx`)

**Files:**
- Create: `client/src/pages/BieuMauPage.jsx`

**Interfaces:**
- Features:
  - Tab 1: **An ninh nhân dân (HSAN)** (11 nhóm hồ sơ)
  - Tab 2: **Cảnh sát nhân dân (HSCS)** (23 nhóm hồ sơ)
  - Tab 3: **Văn bản & Hướng dẫn nghiệp vụ (TTHD)** (11 tài liệu PDF)
  - Thanh tìm kiếm thông minh theo mã (`B1`, `B20`...) hoặc từ khóa
  - Hàng lọc nhóm hồ sơ (ĐB, CN, VA, AK, TX, TT...)
  - Mỗi biểu mẫu có 2 nút: **"Viết máy (Điền online)"** và **"Viết tay (PDF)"**
  - Nút mở file biểu mẫu Word/PDF bên ngoài

- [ ] **Step 1: Viết component `BieuMauPage.jsx`**
- [ ] **Step 2: Tích hợp `FormEditorModal` và mở file PDF**

---

### Task 7: Tích Hợp Điều Hướng & Lối Tắt Hệ Thống

**Files:**
- Modify: `client/src/App.jsx` (Thêm route `#/bieu-mau` và nút trên Top Navigation Bar)
- Modify: `client/src/pages/HomePage.jsx` (Thêm thẻ lối tắt "Biểu Mẫu CAND")
- Modify: `client/src/pages/StudentPortalPage.jsx` (Thêm mục tra cứu biểu mẫu nghiệp vụ)

- [ ] **Step 1: Cập nhật `App.jsx` định tuyến và thêm tab "Biểu mẫu CAND"**
- [ ] **Step 2: Thêm thẻ điều hướng tại `HomePage.jsx`**
- [ ] **Step 3: Thêm thẻ điều hướng tại `StudentPortalPage.jsx`**

---

### Task 8: Kiểm Thử Toàn Diện & Đóng Gói Hoàn Thiện

**Files:**
- Verify: `npm test -- --run`
- Verify: `npm run build`
- Document: Cập nhật `walkthrough.md`

- [ ] **Step 1: Chạy toàn bộ unit tests client**
- [ ] **Step 2: Chạy bản dựng production build Vite**
- [ ] **Step 3: Soạn báo cáo hoàn thành chi tiết trong `walkthrough.md`**
