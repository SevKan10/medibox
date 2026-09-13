# HƯỚNG DẪN CÀI ĐẶT VÀ CẤU HÌNH HỆ THỐNG MEDIBOX

Tài liệu này mô tả cấu trúc các tệp mã nguồn của hệ thống quản lý hộp
thuốc thông minh Medibox, bao gồm giao diện, phần xử lý Backend bảo mật
bằng PHP và cơ chế lưu trữ dữ liệu qua Firebase Realtime Database.

------------------------------------------------------------------------

## 1. Cấu trúc các tệp trong dự án

``` text
├── login.php        # Trang đăng nhập / đăng ký (Xử lý xác thực qua PHP Backend & Firebase REST API)
├── index.php        # Trang Dashboard chính (Yêu cầu đăng nhập Session mới được truy cập)
├── api.php          # Backend Controller (Nhận lệnh từ giao diện và lưu Firebase)
├── script_3.js        # File xử lý giao diện Frontend (Tab, Modal, render động các ngăn thuốc)
└── style.css        # Tệp CSS tuỳ chỉnh giao diện chung
```

Tài liệu thiết kế chuẩn cho phiên bản phần cứng tiếp theo:

- [MEDIBOX_DATA_SCHEMA_V1.md](MEDIBOX_DATA_SCHEMA_V1.md): cấu trúc Firebase, kiểu dữ liệu, versioning và migration.
- [MEDIBOX_HARDWARE_WEB_CONTRACT_V1.md](MEDIBOX_HARDWARE_WEB_CONTRACT_V1.md): hợp đồng giao tiếp giữa firmware ESP và web, gồm heartbeat, command, lịch uống và xóa thiết bị.

## 2. Chi tiết chức năng từng tệp

-   **`login.php`**:
    -   Cung cấp giao diện đăng nhập và đăng ký đồng bộ tone màu xanh
        dương.
    -   Xử lý xác thực bảo mật tài khoản người dùng thông qua PHP (sử
        dụng cURL gọi trực tiếp đến Firebase Authentication REST API).
    -   Khởi tạo phiên làm việc `session_start()` khi đăng nhập thành
        công.
-   **`index.php`**:
    -   Giao diện quản lý chính (Dashboard) với các tab: *Tổng quan*,
        *Lịch uống thuốc*, và *Thiết bị Medibox*.
    -   Kiểm tra tính hợp lệ của `$_SESSION['user_email']` ở đầu file để
        chặn người dùng truy cập trái phép khi chưa đăng nhập.
-   **`api.php`**:
    -   Đóng vai trò là cổng API trung gian bảo mật.
    -   Nhận dữ liệu cấu hình thuốc, lịch trình và trạng thái khóa/mở từ
        phía Client, sau đó lưu trực tiếp vào Firebase Realtime Database.
-   **`script.js`**:
    -   Quản lý các sự kiện chuyển đổi qua lại giữa các tab (Tổng quan
        chỉ xem, Lịch uống để cấu hình, Thiết bị Medibox để điều khiển
        phần cứng).
    -   Điều khiển hiển thị Modal chỉnh sửa ngăn thuốc và gọi các yêu
        cầu bất đồng bộ (`fetch`) về `api.php`.

## 3. Cấu hình thông số kết nối

Dưới đây là các vị trí bạn **bắt buộc** phải thay thế thông tin thật của
mình trước khi chạy hệ thống:

### A. Điền Firebase API Key trong `login.php`

Mở file `login.php`, tìm đến đoạn khai báo biến `$firebaseApiKey` và
thay thế đoạn mã mẫu bằng **Web API Key** của dự án trên Firebase
Console của bạn:

``` php
// --- VỊ TRÍ CHỜ CẦN ĐIỀN ---
$firebaseApiKey = "YOUR_FIREBASE_WEB_API_KEY";
```

**Hướng dẫn lấy:** Truy cập Firebase Console → Project Settings →
General → mục Web API Key.

### B. Dữ liệu lưu trong Firebase

Mỗi tài khoản có một nhánh riêng theo Firebase `localId`:

```text
users/{localId}/
├── profile/
├── user_settings/
└── devices/{device_id}/
        ├── meta/
        ├── config/
        ├── state/
        ├── command/
        └── events/{event_id}/
```

Các node trong `devices/{device_id}` có vai trò rõ ràng:

- `meta`: thông tin thiết bị, firmware, MAC và vòng đời `active`, `disabled` hoặc `deleted`.
- `config`: Web ghi cấu hình thuốc; ESP đọc lịch uống từ đây.
- `state`: ESP ghi trạng thái thực tế; Web chỉ đọc và tính trạng thái hiển thị.
- `command`: Web ghi lệnh; ESP đọc, thực hiện và phản hồi `pending`, `done` hoặc `failed`.
- `events`: lịch sử các sự kiện như phát thuốc, lấy thuốc, pin thấp và lỗi cảm biến.

Ví dụ một thiết bị:

```text
users/{localId}/devices/device_C82E18F8FD00/
├── meta
├── config
├── state
├── command
└── events
```

Quy ước tạo `device_id` từ toàn bộ MAC để tránh trùng:

```text
MAC:        C8:2E:18:F8:FD:00
device_id: device_C82E18F8FD00
```

Quy tắc: phần MAC viết hoa, bỏ dấu `:`, định dạng phải là
`device_` + 12 ký tự hex. `device_id` phải ổn định sau mỗi lần khởi động.

### C. Cấu hình thuốc chuẩn

Path:

```text
users/{localId}/devices/{device_id}/config
```

Payload chuẩn:

```json
{
    "schema_version": 1,
    "revision": 3,
    "updated_at": 1760000100,
    "updated_by": "web",
    "slots": [
        {
            "slot_id": 1,
            "enabled": true,
            "medicine_name": "Vitamin D3",
            "note": "Sau ăn sáng",
            "doses": [
                { "dose_id": "1-1", "time": "07:00", "quantity": 1 },
                { "dose_id": "1-2", "time": "19:00", "quantity": 2 }
            ]
        }
    ]
}
```

`revision` tăng sau mỗi lần Web lưu cấu hình. ESP chỉ áp dụng bản có
`revision` lớn hơn bản đang dùng và phải giữ bản hợp lệ cuối cùng trong bộ nhớ
cục bộ nếu Firebase tạm thời mất kết nối.

### D. Trạng thái ESP chuẩn

Path:

```text
users/{localId}/devices/{device_id}/state
```

```json
{
    "schema_version": 1,
    "reported_at": 1760000200,
    "last_seen": 1760000200,
    "connection": "online",
    "lock": "locked",
    "medicine": {
        "last_action": "taken",
        "last_slot_id": 1,
        "last_dose_id": "1-1",
        "last_action_at": 1760000180
    },
    "battery": {
        "percent": 78,
        "charging": false,
        "voltage_mv": 3890
    },
    "sensors": {
        "door_open": false,
        "pill_detected": true
    },
    "faults": []
}
```

ESP nên cập nhật heartbeat mỗi 15-30 giây. Web coi thiết bị offline nếu:

- ESP báo `connection: "offline"`; hoặc
- `last_seen` quá `DEVICE_OFFLINE_TIMEOUT_SECONDS` (hiện là 120 giây).

`battery.percent` nhận giá trị từ 0 đến 100; `0` là giá trị hợp lệ, không được
coi là thiếu dữ liệu.

### E. Lệnh từ Web đến ESP

Path:

```text
users/{localId}/devices/{device_id}/command
```

Ví dụ lệnh mở khóa:

```json
{
    "schema_version": 1,
    "command_id": "cmd_abc123",
    "type": "set_lock",
    "requested_lock": "unlocked",
    "created_at": 1760000300,
    "created_by": "web",
    "status": "pending",
    "ack_at": null,
    "error_code": null
}
```

ESP phải xử lý mỗi `command_id` tối đa một lần, sau đó cập nhật `status` thành
`done` hoặc `failed`. Web chỉ hiển thị khóa/mở theo `state.lock`, tức trạng
thái vật lý thực tế, không chỉ dựa vào command đã gửi thành công.

### F. Xóa thiết bị

Web không xóa ngay các node mà ESP cần đọc. Quy trình là:

1. Ghi `meta.lifecycle = "deleted"`.
2. Ghi command `type = "delete_device"`.
3. ESP dừng lịch, xóa cache/credential cục bộ và gửi acknowledgement nếu còn mạng.
4. Web ẩn thiết bị đã bị xóa.
5. Server dọn `config`, `state` và `events` sau thời gian lưu giữ.

Nếu ESP offline lúc xóa, khi kết nối lại phải đọc `meta.lifecycle` trước khi ghi
state. Thiết bị đã bị xóa không được tự tạo lại trong tài khoản cũ.

### G. Tương thích dữ liệu cũ

Trong giai đoạn chuyển tiếp, backend vẫn có thể đọc các nhánh cũ:

```text
users/{localId}/medibox_configs/{device_id}
users/{localId}/medibox_states/{device_id}
users/{localId}/medibox_commands/{device_id}
```

Mapping sang schema mới:

```text
medibox_configs/{device_id}  -> devices/{device_id}/config
medibox_states/{device_id}   -> devices/{device_id}/state
medibox_commands/{device_id} -> devices/{device_id}/command
```

Firmware mới chỉ nên dùng cây `users/{localId}/devices/{device_id}`. Sau khi
firmware và backend mới chạy ổn định, dừng ghi nhánh cũ rồi mới xóa adapter.

