# Portal UI Refresh Design

## Mục tiêu

Làm mới trang chủ, danh sách môn học và khung giao diện dùng chung để cổng học liệu rõ ràng, hiện đại, đồng bộ và dễ dùng trên desktop lẫn mobile, đồng thời giữ nhận diện đỏ–xanh navy của Trường Đại học An ninh nhân dân.

## Phạm vi

- Header, thanh tài khoản, điều hướng chính và footer dùng chung.
- Trang chủ có vai trò tổng quan và lối tắt, không trùng lặp với trang danh sách môn học.
- Trang `/mon-hoc`, thẻ môn học, trạng thái tải/rỗng/lỗi và các trang chi tiết môn học dùng chung token.
- Responsive ở 375px, 768px, 1024px và 1440px; điều hướng bàn phím và reduced motion.

## Hướng thị giác

- Phong cách institutional modern: nền trung tính sáng, mặt thẻ trắng, navy cho cấu trúc, đỏ sẫm cho hành động chính, vàng kim dùng tiết chế làm điểm nhấn.
- Hệ token duy nhất cho màu, bán kính, đổ bóng, khoảng cách và chiều rộng nội dung.
- Typography dùng system font để hoạt động tốt trong mạng nội bộ và không phụ thuộc CDN.
- Không dùng emoji làm icon; toàn bộ icon giao diện dùng Lucide.

## Kiến trúc giao diện

- `portalNavigation.js` là nguồn dữ liệu duy nhất cho điều hướng và xác định route active.
- `Header`, `Navbar`, `Footer` chỉ chịu trách nhiệm khung ứng dụng.
- `HomePage` là dashboard giới thiệu, hiển thị lời chào theo người dùng, thống kê kho học liệu, môn học nổi bật và lối tắt.
- `CoursesPage` chỉ tập trung tìm kiếm và duyệt toàn bộ môn học.
- `portal.css` chứa style cho shell dùng chung và Home; `courses.css` chứa style catalog/chi tiết nhưng dùng chung token toàn cục.

## Responsive và tương tác

- Desktop: header hai tầng gọn, navigation ngang, card grid 3 cột.
- Tablet: navigation cuộn ngang có chủ đích, card grid 2 cột.
- Mobile: ẩn dải đổi nhanh tài khoản dư thừa, gom brand và hành động, navigation dạng thanh ngang có snap, card 1 cột.
- Mọi nút/link có vùng chạm tối thiểu 44px và focus ring rõ.
- Animation chỉ dùng opacity/transform ngắn và tắt khi `prefers-reduced-motion`.

## Kiểm thử

- Unit test cấu hình navigation và route matching.
- Chạy toàn bộ `npm test` và `npm run build`.
- Kiểm tra trực quan desktop/mobile bằng trình duyệt ở Home, `/mon-hoc` và một trang chi tiết môn học.

