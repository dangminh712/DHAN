# Portal UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ và hiện đại hóa Home, danh sách môn học và khung giao diện chung của cổng học liệu.

**Architecture:** Tách cấu hình điều hướng thành module thuần để kiểm thử, dùng một bộ token CSS toàn cục và hai lớp style theo trách nhiệm: portal shell/Home và catalog môn học. Home lấy dữ liệu môn học bằng service hiện có; các route nghiệp vụ khác không đổi.

**Tech Stack:** React 18, Vite 5, Lucide React, CSS thuần, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-01-portal-ui-refresh-design.md`

## Global Constraints

- Giữ nhận diện đỏ–xanh navy của trường và không thêm phụ thuộc runtime.
- Dùng Lucide thay emoji cho icon giao diện mới.
- Hỗ trợ 375px, 768px, 1024px và 1440px.
- Mọi điều khiển mới có semantic HTML, focus visible và vùng chạm tối thiểu 44px.

---

### Task 1: Điều hướng dùng chung

**Files:**
- Create: `client/src/portalNavigation.js`
- Create: `client/src/portalNavigation.test.js`
- Modify: `client/src/components/layout/Navbar.jsx`

**Interfaces:**
- Produces: `portalNavigation`, `isPortalRouteActive(item, route)`.

- [ ] Viết test route Home chỉ active tại `/`, route Môn học active cho route con, và mỗi item có nhãn/href/icon key.
- [ ] Chạy `npm test -- src/portalNavigation.test.js` và xác nhận test fail vì module chưa tồn tại.
- [ ] Viết module navigation và chuyển Navbar sang render từ cấu hình.
- [ ] Chạy lại test và xác nhận pass.

### Task 2: Khung portal và Home riêng biệt

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/HomePage.jsx`
- Modify: `client/src/components/layout/Header.jsx`
- Modify: `client/src/components/layout/Footer.jsx`
- Create: `client/src/styles/portal.css`

**Interfaces:**
- Consumes: `courseService.list`, `portalNavigation`.
- Produces: Home dashboard và portal shell responsive.

- [ ] Chuyển route `/` sang `HomePage` và giữ `/mon-hoc` ở `CoursesPage`.
- [ ] Rút gọn header thành brand, tình trạng intranet, tài khoản và hành động có phân cấp rõ.
- [ ] Xây Home gồm hero, thống kê, môn nổi bật và quick actions.
- [ ] Chuẩn hóa footer và responsive shell trong `portal.css`.

### Task 3: Catalog môn học đồng bộ

**Files:**
- Modify: `client/src/pages/CoursesPage.jsx`
- Modify: `client/src/components/course/CourseCard.jsx`
- Modify: `client/src/styles/courses.css`

**Interfaces:**
- Consumes: global portal tokens và `courseService.list`.
- Produces: catalog, card và trạng thái responsive nhất quán.

- [ ] Bổ sung thanh tiêu đề/catalog có số kết quả và nút xóa tìm kiếm truy cập được.
- [ ] Làm toàn bộ card thành vùng tương tác rõ ràng, giữ thống kê và CTA nhất quán.
- [ ] Đồng bộ CSS catalog và các trang chi tiết với portal tokens.

### Task 4: Xác minh end-to-end

**Files:**
- Verify: `client/src/**`

**Interfaces:**
- Consumes: toàn bộ thay đổi Task 1–3.
- Produces: bằng chứng test, build và QA trực quan.

- [ ] Chạy `npm test` và xác nhận không có test fail.
- [ ] Chạy `npm run build` và xác nhận Vite build thành công.
- [ ] Kiểm tra Home, `/mon-hoc`, trang chi tiết ở desktop và mobile; sửa lỗi overflow/focus/contrast nếu có.

