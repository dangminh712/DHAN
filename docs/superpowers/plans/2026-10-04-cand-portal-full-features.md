# Hoàn thiện Toàn diện Tính năng và Giao diện Hệ thống Học liệu CAND T04

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện 100% tính năng sử dụng, khôi phục luồng Cổng Học viên và Phòng Giảng viên, liên kết Môn học với Phòng học 5 phần, chuẩn hóa giao diện chính quy CAND (xóa bỏ alert/confirm thô, tối ưu bản in A4 biểu mẫu, thêm CRUD môn học), bảo đảm sẵn sàng vận hành nội bộ (Intranet/Offline).

**Architecture:** 
- Frontend React 18: Điều hướng Hash-based (`portalNavigation.js`, `Navbar.jsx`, `App.jsx`), khôi phục kết nối `StudentPortalPage` và `TeacherPortalPage`, bổ sung `ConfirmModal` dùng chung thay thế `window.confirm`/`alert`.
- Liên kết học liệu: Nối trực tiếp từ Môn học/Chương (`CourseDetailPage`, `ChapterDetailPage`) sang Phòng học đa phương tiện 5 phần (`LectureStudyPage`).
- Biểu mẫu nghiệp vụ (`BieuMauPage`): Bổ sung CSS in ấn A4 chuẩn thể thức văn bản Bộ Công an.
- Môn học: Tích hợp modal Thêm/Sửa môn học trên `CoursesPage` sử dụng API sẵn có `/api/academic/subjects`.

**Tech Stack:** React 18, Vite, Lucide-React, ASP.NET Core 8 Web API, MySQL, CSS3 (@media print).

---

### Task 1: Khôi phục Cổng Học viên và Phòng Giảng viên trên Điều hướng chính

**Files:**
- Modify: `client/src/portalNavigation.js`
- Modify: `client/src/components/layout/Navbar.jsx`
- Modify: `client/src/App.jsx:380-405`

- [ ] **Step 1: Cập nhật danh mục điều hướng `portalNavigation.js`**
Bổ sung các mục điều hướng:
- "Cổng Học viên" (`#/hoc-vien`, icon `graduationCap`)
- "Phòng Giảng viên" (`#/giang-vien`, icon `presentation` hoặc `award`)
- [ ] **Step 2: Cập nhật icon trong `Navbar.jsx`**
Khai báo bổ sung icon `GraduationCap` và `Presentation`/`Award` cho các mục mới.
- [ ] **Step 3: Khôi phục kết nối render trong `App.jsx`**
Thay thế `CoursesPage` tại nhánh `route === '/hoc-vien'` bằng `<StudentPortalPage />` và tại nhánh `route === '/giang-vien'` bằng `<TeacherPortalPage />`, truyền đầy đủ props (`files`, `lectures`, `currentUser`, `academicUnits`, `onSelectFile`, `onCopyHash`, `onOpenUpload`, `onDeleteFile`, v.v.).

---

### Task 2: Liên kết Chương Môn học vào Phòng học 5 phần & Thêm Modal Môn học

**Files:**
- Modify: `client/src/pages/CoursesPage.jsx`
- Modify: `client/src/pages/CourseDetailPage.jsx`
- Modify: `client/src/pages/ChapterDetailPage.jsx`
- Create/Modify: `client/src/components/course/SubjectEditModal.jsx`

- [ ] **Step 1: Bổ sung nút "Vào phòng học chuyên đề" trong `CourseDetailPage.jsx` và `ChapterDetailPage.jsx`**
Đối với mỗi chương hoặc bài giảng tương ứng, hiển thị nút dẫn trực tiếp tới `#/study/{lectureId}` để học viên và giảng viên có thể xem video, đọc PDF giáo trình, ghi chú và làm bài trắc nghiệm ngay.
- [ ] **Step 2: Tạo Modal Thêm / Chỉnh sửa Môn học trên `CoursesPage.jsx`**
Cho phép thêm môn học mới hoặc sửa môn học (Mã môn, Tên môn, Số tín chỉ, Mô tả, Đơn vị/Khoa) gọi trực tiếp đến `academicService.createSubject` và `academicService.updateSubject`.
- [ ] **Step 3: Thêm nút "Thêm môn học mới" trên header của `CoursesPage.jsx`**
Giúp giảng viên và quản trị viên tạo mới môn học ngay trên giao diện web.

---

### Task 3: Chuẩn hóa Hộp thoại Xác nhận CAND (Thay thế `window.confirm` & `alert`)

**Files:**
- Create: `client/src/components/common/ConfirmModal.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/AcademicPage.jsx`
- Modify: `client/src/pages/AdminPortalPage.jsx`

- [ ] **Step 1: Xây dựng `ConfirmModal.jsx` phong cách trang trọng CAND**
Modal gồm biểu tượng Khiên an ninh, tiêu đề trang nghiêm, lời nhắn chi tiết, nút "Hủy bỏ" (viền xám nhạt) và nút "Xác nhận thực hiện" (màu đỏ đô hoặc xanh rêu an ninh).
- [ ] **Step 2: Thay thế `window.confirm` trong `App.jsx` (khi xóa file học liệu)**
- [ ] **Step 3: Thay thế `window.confirm` trong `AcademicPage.jsx` (khi xóa môn học, xóa lớp học)**
- [ ] **Step 4: Thay thế `window.confirm` trong `AdminPortalPage.jsx` (khi khóa tài khoản, thu hồi phiên làm việc)**

---

### Task 4: Tối ưu Hóa Bản In A4 Biểu mẫu Nghiệp vụ CAND

**Files:**
- Modify: `client/src/styles/bieumau.css`
- Modify: `client/src/pages/BieuMauPage.jsx`

- [ ] **Step 1: Bổ sung CSS `@media print` đạt chuẩn văn bản hành chính Bộ Công an**
- Ẩn toàn bộ thanh điều hướng navbar, nút công cụ, thanh tìm kiếm khi in.
- Cấu hình trang in A4 dọc (`size: A4 portrait; margin: 20mm 15mm 20mm 30mm;`).
- Đảm bảo lề trái 30mm đúng chuẩn đóng tập hồ sơ vụ án/nghiệp vụ an ninh.
- [ ] **Step 2: Kiểm tra nút "In biểu mẫu" trên `FormEditorModal` và `BieuMauPage`**
Bảo đảm nhấn nút In sẽ kích hoạt cửa sổ in sạch sẽ, nội dung sắc nét.

---

### Task 5: Kiểm tra Tổng thể & Xác minh Hoàn thành

- [ ] **Step 1: Chạy kiểm tra build Frontend** (`npm run build` trong thư mục `client`)
- [ ] **Step 2: Kiểm tra tính toàn vẹn của mã nguồn và các liên kết offline**
- [ ] **Step 3: Tổng kết và báo cáo kết quả nghiệm thu cho người dùng**
