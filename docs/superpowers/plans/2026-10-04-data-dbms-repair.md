# Sửa học liệu và DBMS

Mục tiêu: thực hiện ba hạng mục người dùng đã yêu cầu trên kiến trúc React/.NET/MySQL hiện có.

1. Sao lưu DB ngoài repository; lưu bằng chứng trước sửa và đối chiếu tệp nguồn.
2. Xác nhận người phụ trách NVCB2 bằng kế hoạch trang 6, ghi thông tin nguồn vào môn học; không tự cấp tài khoản hoặc gán người khác thay thế.
3. Bổ sung tài liệu tham khảo công khai cho TCDT_403 với nguồn/phiên bản rõ ràng; giữ nhận diện tài liệu tham khảo, không công bố wallpaper/video mẫu thành bài giảng thật.
4. Đánh dấu các tệp minh họa, sửa tên sai, ẩn có thể khôi phục các liên kết không phù hợp; giữ tệp và lịch sử.
5. Đổi tổng quan DBMS sang metadata thật, loại bỏ số liệu dự phòng giả, giảm các lượt truy vấn nối tiếp; hiển thị rõ ước tính số dòng, dung lượng DB khác dung lượng học liệu và thời gian đo khác benchmark tải.
6. Bổ sung chỉ mục phục vụ sắp xếp nhật ký, phiên và lọc chương theo kết quả EXPLAIN; không xóa bảng/chỉ mục cũ hoặc ép công bố chương nháp.
7. Chạy kiểm thử hồi quy, build, audit sau sửa và benchmark cục bộ có giới hạn; kiểm tra DBMS trong trình duyệt; báo cáo khả năng và giới hạn thực tế.

Thay đổi DB theo migration và script bảo trì có thể chạy lại; không lộ thông tin kết nối trong báo cáo.
