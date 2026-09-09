# Hướng Dẫn Môi Trường Làm Việc & Vận Hành Mạng Nội Bộ (Intranet)

Hệ thống được thiết kế đặc thù cho **mạng nội bộ (Intranet / Offline)**:
- **Frontend**: React 18 + Vite (Đóng gói 100% offline, không tải CDN ngoài).
- **Backend**: ASP.NET Core 8 Web API (Kestrel lắng nghe `0.0.0.0:5000`, hỗ trợ CORS mạng LAN).
- **Cơ sở dữ liệu**: MySQL (Lưu trữ metadata tập tin, ngày giờ, mã băm SHA-256).
- **Lưu trữ đa phương tiện (PDF, Ảnh, Video)**: Lưu trữ trên ổ cứng cục bộ (`server/Storage`) với API Streaming chuẩn HTTP 206 Partial Content (tua video mượt mà, tải từng trang PDF).

---

## 1. Cách khởi động nhanh (1-Click)

### Cách 1: Chạy trực tiếp toàn bộ dự án
Chỉ cần nhấp đúp vào file:
👉 **`chay_toan_bo.bat`** (ở thư mục gốc)

Hệ thống sẽ tự động bật 2 cửa sổ terminal:
- **Backend .NET 8**: `http://localhost:5000` (hoặc `http://<IP-LAN>:5000`)
- **Frontend React**: `http://localhost:5173` (hoặc `http://<IP-LAN>:5173`)

### Cách 2: Mở Backend bằng Visual Studio 2022 (VS Tím)
Chỉ cần nhấp đúp vào file:
👉 **`mo_visual_studio_2022.bat`** (ở thư mục gốc) hoặc nhấp đúp file **`DoAnKhoaHoc.sln`**.
- Visual Studio 2022 sẽ tự động nhận diện SDK .NET 8 và nạp toàn bộ project `Server` mà không bị báo lỗi thiếu SDK `Microsoft.NET.Sdk.Web`.
- Nhấn phím **F5** hoặc nút **Play (Server)** trên Visual Studio để chạy Backend.

---

## 2. Kết nối Cơ sở dữ liệu MySQL

Hệ thống kết nối MySQL qua chuỗi kết nối trong file [appsettings.json](file:///c:/Users/DangMinh/Desktop/Đồ%20án%20khoa%20học/server/appsettings.json):
```json
"DefaultConnection": "Server=localhost;Port=3306;Database=media_intranet_db;User=root;Password=;CharSet=utf8mb4;"
```

### Nếu bạn dùng MySQL Workbench (đã cài sẵn trên máy):
1. Mở **MySQL Workbench 8.0 CE**.
2. Kết nối vào Local instance (Port 3306).
3. Mở file [init_db.sql](file:///c:/Users/DangMinh/Desktop/Đồ%20án%20khoa%20học/server/init_db.sql) và nhấn **Execute (biểu tượng tia sét)** để tạo database và bảng `MediaFiles`.
4. Nếu tài khoản `root` của bạn có mật khẩu, hãy cập nhật lại mục `Password=...` trong file [appsettings.json](file:///c:/Users/DangMinh/Desktop/Đồ%20án%20khoa%20học/server/appsettings.json).

---

## 3. Cho phép các máy khác trong mạng LAN truy cập (Tường lửa Windows)

Để máy tính hoặc điện thoại khác cùng mạng Wi-Fi/LAN mở được trang web:

1. Mở **PowerShell (Run as Administrator)** và chạy 1 dòng lệnh để mở cổng tường lửa nội bộ:
```powershell
New-NetFirewallRule -DisplayName "DoAnKhoaHoc_Intranet" -Direction Inbound -LocalPort 5000,5173 -Protocol TCP -Action Allow
```
2. Mở trình duyệt trên máy khách và gõ địa chỉ IP hiển thị trên thanh trên cùng của giao diện Web (Ví dụ: `http://192.168.1.15:5173`).

---

## 4. Cấu trúc thư mục dự án

```
Đồ án khoa học/
├── client/                     # Frontend React.js (Vite)
│   ├── src/
│   │   ├── App.jsx             # Giao diện chính (Dashboard, Upload, Video/PDF player)
│   │   └── index.css           # Giao diện Dark mode hiện đại, không dùng CDN
│   └── vite.config.js          # Cấu hình host 0.0.0.0 & proxy /api sang port 5000
│
├── server/                     # Backend ASP.NET Core 8 Web API
│   ├── Controllers/
│   │   └── MediaController.cs  # Upload, Stream HTTP 206 (Video/PDF), Download, Delete
│   ├── Data/
│   │   └── AppDbContext.cs     # Entity Framework Core kết nối MySQL
│   ├── Models/
│   │   └── MediaFile.cs        # Model dữ liệu tập tin
│   ├── Storage/                # Thư mục chứa các file vật lý (PDF, MP4, PNG...)
│   ├── appsettings.json        # Cấu hình kết nối MySQL & thư mục lưu trữ
│   └── init_db.sql             # Script SQL tạo CSDL
│
├── chay_backend.bat            # File chạy nhanh Backend
├── chay_frontend.bat           # File chạy nhanh Frontend
├── chay_toan_bo.bat            # File chạy nhanh cả 2 dịch vụ
└── HUONG_DAN_SU_DUNG.md        # Tài liệu hướng dẫn này
```
