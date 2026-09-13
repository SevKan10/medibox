# Nhật ký phát triển Medibox

## Ngày 04/09/2026

- Xây dựng bộ khung frontend cho Medibox.
- Hoàn thiện giao diện dashboard, sidebar, header và các tab:
  - Tổng quan.
  - Lịch uống thuốc.
  - Thiết bị Medibox.
- Thêm giao diện các ngăn thuốc, lịch uống trong ngày và modal chỉnh sửa.
- Tích hợp Lucide Icons và Tailwind CSS CDN.

## Ngày 05/09/2026

- Hoàn thiện đăng ký, đăng nhập và quên mật khẩu bằng Firebase Authentication REST API.
- Lưu các thông tin đăng nhập vào PHP Session:
  - Email người dùng.
  - Tên hiển thị.
  - Firebase ID token.
  - Firebase local ID.
- Thêm kiểm tra đăng nhập để bảo vệ `index.php` và `api.php`.
- Kiểm tra chạy local bằng XAMPP, chức năng đăng nhập hoạt động.
- Xây dựng API PHP trung gian để frontend không gọi trực tiếp các thao tác nhạy cảm.
- Ban đầu đã thử triển khai giao tiếp MQTT để publish cấu hình thuốc và lệnh khóa/mở.
- Sau đó loại bỏ toàn bộ MQTT vì MQTT chỉ phù hợp cho dữ liệu tức thời, không phù hợp làm nơi lưu dữ liệu lâu dài.

## Ngày 06/09/2026

### 1. Chuyển dữ liệu sang Firebase Realtime Database

- Xóa toàn bộ code kết nối, publish và subscribe MQTT.
- Chuyển việc đọc/ghi dữ liệu sang Firebase Realtime Database REST API.
- Tách dữ liệu theo từng tài khoản bằng Firebase `localId`.
- Cấu trúc dữ liệu hiện tại:

```text
users/{USER_UID}/
  medibox_configs/{device_id}
  medibox_states/{device_id}
  medibox_commands/{device_id}
```

- `medibox_configs`: lưu lịch thuốc để ESP32 đọc.
- `medibox_states`: ESP32 ghi trạng thái thiết bị.
- `medibox_commands`: web ghi lệnh khóa/mở để ESP32 đọc.

### 2. Hoàn thiện dữ liệu lịch thuốc

- Mỗi ngăn thuốc có:
  - Tên thuốc.
  - Note: trước ăn, sau ăn hoặc ghi chú khác.
  - Nhiều lần uống trong ngày.
  - Giờ uống riêng cho từng lần.
  - Số lượng viên riêng cho từng giờ.
- Thêm nút `+ Thêm giờ`.
- Thêm nút xóa từng lần uống.
- Chuyển dữ liệu cũ từ dạng `next/detail` sang dạng mới:

```json
{
  "slot": 1,
  "name": "Vitamin D3",
  "detail": "Sau ăn sáng",
  "doses": [
    {"time": "07:00", "quantity": 1},
    {"time": "19:00", "quantity": 2}
  ]
}
```

- Hiển thị lịch theo trạng thái:
  - Đã lấy thuốc.
  - Sắp tới.
  - Chưa lấy thuốc.

### 3. Đọc trạng thái ESP32

- Web đọc trạng thái ESP tại:

```text
users/{USER_UID}/medibox_states/{device_id}
```

- Web đã đọc các dữ liệu:
  - `online`.
  - `last_seen`.
  - `mac_address`.
  - `medicine_taken`.
- ESP đã gửi thêm `battery_percent`, nhưng web chưa hoàn thiện phần đọc/hiển thị.
- Nếu `last_seen` quá thời gian timeout thì thiết bị được hiển thị là không trực tuyến.
- Thời gian timeout hiện tại là 120 giây và có thể chỉnh trong `config.php`.
- Web đọc lại trạng thái định kỳ, không yêu cầu ESP gửi toàn bộ lịch thuốc liên tục.
- Hỗ trợ trường hợp ESP dùng `online: false` khi mất kết nối.

### 4. Điều khiển khóa/mở khóa

- Web ghi lệnh khóa/mở vào đúng thiết bị:

```text
users/{USER_UID}/medibox_commands/{device_id}
```

- Payload lệnh:

```json
{
  "command": "UNLOCK",
  "locked": false,
  "updated_at": "2026-09-06T..."
}
```

- Không ghi đè `locked` hoặc `medicine_taken` trong `medibox_states` vì đây là dữ liệu trạng thái do ESP gửi.
- Khi có nhiều thiết bị, mỗi thiết bị có nút khóa/mở riêng.

### 5. Nhận diện nhiều thiết bị

- ESP32 tạo `device_id` từ địa chỉ MAC.
- Với code hiện tại:

```cpp
String deviceIdFromMac() {
  String id = WiFi.macAddress();
  id.replace(":", "");
  id.toUpperCase();
  return "device_" + id.substring(id.length() - 6);
}
```

- Ví dụ:

```text
MAC:        C8:2E:18:F8:FD:00
device_id: device_F8FD00
```

- Web lấy tên node trong Firebase làm `device_id`, nên các thiết bị được dẫn đúng nhánh.
- Danh sách thiết bị không giới hạn số lượng.
- Mỗi thiết bị hiển thị:
  - Device ID.
  - Địa chỉ MAC.
  - Trạng thái online.
  - Trạng thái khóa.
  - Trạng thái cảm biến thuốc.
  - Dữ liệu pin do ESP gửi, web chưa hiển thị hoàn chỉnh.

### 6. Xóa thiết bị

- Thêm nút xóa trên từng thiết bị.
- Khi xóa một `device_id`, API xóa toàn bộ dữ liệu của thiết bị đó:

```text
users/{USER_UID}/medibox_states/{device_id}
users/{USER_UID}/medibox_configs/{device_id}
users/{USER_UID}/medibox_commands/{device_id}
```

- Các nhánh cha vẫn được giữ lại.
- Thiết bị được tạo bởi ESP, web không tự tạo thiết bị thủ công.
- Danh sách thiết bị được đọc trực tiếp từ `medibox_states`.

### 7. Các lỗi đã sửa

- Sửa lỗi dữ liệu các tài khoản bị dùng chung bằng cách thêm `localId` vào đường dẫn Firebase.
- Sửa đường dẫn trạng thái từ node cố định sang node theo `device_id`.
- Sửa lỗi web đọc lịch cố định `device_01` trong khi ESP dùng `device_F8FD00`.
- Sửa lỗi danh sách thiết bị bị đứng ở trạng thái `Đang tải...`.
- Sửa vòng lặp request do đọc trạng thái xong lại render giao diện và gọi tải danh sách liên tục.
- Thêm timeout khi gọi API và hiển thị lỗi rõ ràng.
- Sửa lỗi trạng thái khóa bị xung đột khi ESP không còn ghi `locked` vào `medibox_states`.
- Sử dụng trạng thái lệnh cuối trong `medibox_commands` để hiển thị khóa/mở.
- Sửa giao diện hiển thị tên thiết bị, không còn hard-code `Medibox 01`.
- Sửa phần cài đặt tài khoản chỉ hiển thị thông tin người dùng, bỏ Device ID và MAC khỏi khu vực tài khoản.
- Ghi nhận dữ liệu ESP có thể gửi `battery_percent`; phần web đọc và hiển thị pin chưa hoàn thiện.
- Sửa lỗi 502 để API hiển thị chi tiết lỗi cURL hoặc lỗi HTTP từ Firebase.

### 8. Kiểm tra cuối

- Kiểm tra cú pháp `api.php`, `config.php`, `index.php` bằng PHP XAMPP.
- Kiểm tra cú pháp `script_3.js` bằng Node.js.
- Các file đã kiểm tra không có lỗi cú pháp hoặc lỗi diagnostics tại thời điểm ghi nhật ký.

## Ghi chú phát triển tiếp theo

- ESP32 cần dùng đúng `USER_UID` của tài khoản sở hữu thiết bị.
- ESP32 cần dùng cùng `device_id` cho ba nhánh `medibox_configs`, `medibox_states` và `medibox_commands`.
- Nên dùng toàn bộ địa chỉ MAC để tạo `device_id` nếu muốn giảm nguy cơ trùng ID.
- Có thể phát triển thêm gửi thông báo email hoặc Zalo trong tương lai.
- Nếu triển khai email tự động, nên dùng Firebase Cloud Functions hoặc Firebase Extension Trigger Email thay vì gửi trực tiếp từ ESP32.

## Cập nhật bổ sung ngày 06/09/2026

### Quản lý nhiều thiết bị

- Bỏ chức năng thêm thiết bị thủ công trên web vì ESP32 tự tạo `device_id` từ MAC và tự ghi node trạng thái.
- Web đọc danh sách thiết bị trực tiếp từ:

```text
users/{USER_UID}/medibox_states
```

- Khi mở tab Thiết bị Medibox, web lấy tên node, ví dụ `device_F8FD00`, làm `device_id`.
- Mỗi thiết bị được chọn độc lập để đọc lịch, đọc trạng thái và điều khiển khóa.
- Nút xóa thiết bị xóa đúng ba node theo `device_id`, trong khi vẫn giữ các node cha.

### Trạng thái khóa và cảm biến

- ESP không còn ghi `locked` vào `medibox_states`.
- Web ghi lệnh khóa/mở tại:

```text
users/{USER_UID}/medibox_commands/{device_id}
```

- Web đọc `locked` từ lệnh cuối cùng trong `medibox_commands`.
- ESP tiếp tục ghi các trạng thái thực tế tại `medibox_states`, gồm:
  - `online`.
  - `last_seen`.
  - `mac_address`.
  - `medicine_taken`.
  - `battery_percent`.
- Mỗi thẻ thiết bị có nút khóa/mở riêng và hiển thị trạng thái cảm biến thuốc riêng.

### Dữ liệu phần trăm pin từ ESP32

- ESP32 đã gửi `battery_percent` vào state của từng thiết bị.
- Web hiện chưa đọc và hiển thị phần trăm pin hoàn chỉnh.
- Tính năng cần triển khai tiếp theo: đọc `battery_percent` từ
  `users/{USER_UID}/medibox_states/{device_id}` và hiển thị ở từng thiết bị.
- Khi triển khai, giá trị `0` phải được xem là dữ liệu hợp lệ, không được coi là thiếu dữ liệu.

### Ổn định trạng thái online

- Sửa lỗi giao diện chập chờn online/offline do timeout chỉ có 30 giây.
- Tăng `DEVICE_OFFLINE_TIMEOUT_SECONDS` lên 120 giây.
- Tạo hàm dùng chung để tính trạng thái online cho một thiết bị và danh sách nhiều thiết bị.
- Nếu ESP gửi `online: false`, web ưu tiên hiển thị không trực tuyến.
- Nếu ESP không gửi `online: false`, web dùng `last_seen` để phát hiện timeout.
- Web đọc lại trạng thái theo chu kỳ 15 giây, không yêu cầu ESP gửi toàn bộ lịch thuốc liên tục.

### Sửa lỗi tải danh sách thiết bị

- Sửa vòng lặp request do render giao diện lại gọi `loadDevices()` liên tục.
- Bổ sung dữ liệu thiết bị ban đầu từ PHP khi tải `index.php`.
- Thêm timeout và thông báo lỗi khi API hoặc Firebase không phản hồi.
- Sửa đường dẫn đọc lịch để dùng đúng `medibox_configs/{device_id}` thay vì cố định `device_01`.

### Thông báo trong tương lai

- Đã xác định các loại thông báo có thể phát triển:
  - Thiết bị offline.
  - Thiết bị online lại.
  - Người bệnh chưa lấy thuốc.
  - Người bệnh đã lấy thuốc.
  - Pin thấp.
  - Cảm biến không phản hồi.
  - Khoang bị mở bất thường.
- Zalo và email chưa triển khai trong phiên bản hiện tại.
- Hướng triển khai dự kiến là Firebase Cloud Functions hoặc Firebase Extension để phát hiện sự kiện và chống gửi trùng, kể cả khi web đã đóng.
