# Medibox Hardware ↔ Web Contract v1

Đây là hợp đồng giao tiếp giữa firmware ESP và web Medibox mới. Hai bên phải thống nhất tài liệu này trước khi chốt mạch, firmware và API.

## 1. Phạm vi và vai trò

### Web/backend

- Xác thực người dùng.
- Tạo và lưu cấu hình thuốc.
- Tạo command điều khiển.
- Đọc state do ESP báo cáo.
- Tính trạng thái hiển thị offline dựa trên `last_seen`.
- Không tự ghi đè trạng thái cảm biến hoặc trạng thái khóa thực tế.

### ESP

- Định danh bằng MAC phần cứng.
- Đọc `meta`, `config` và `command`.
- Ghi `state` và event.
- Thực thi command một lần theo `command_id`.
- Báo lỗi phần cứng, pin, cảm biến và kết quả thao tác.
- Không tự tạo lại thiết bị đã bị web đánh dấu `deleted`.

## 2. Điều kiện một thiết bị được chấp nhận

Firmware build phải có các giá trị cấu hình sau:

```text
FIREBASE_DATABASE_URL
FIREBASE_API_KEY hoặc credential tương đương
OWNER_UID
DEVICE_ID
FIRMWARE_VERSION
DEVICE_TIMEZONE
```

Khuyến nghị không hardcode `OWNER_UID` trong firmware phát hành hàng loạt. Dùng quy trình provisioning để ghép thiết bị với tài khoản.

`DEVICE_ID` phải ổn định:

```text
MAC C8:2E:18:F8:FD:00 -> device_C82E18F8FD00
```

ESP không được lấy `device_id` theo số lần boot, SSID hoặc vị trí lắp đặt.

## 3. Chu kỳ giao tiếp

Khi khởi động:

1. Kết nối mạng.
2. Đọc `meta`.
3. Nếu `lifecycle=deleted` hoặc `disabled`, không vận hành bình thường.
4. Đọc config và command mới nhất.
5. Ghi state `connection=online`, firmware version và `last_seen`.

Trong thời gian chạy:

- heartbeat/state: mỗi 15-30 giây
- đọc command: realtime listener nếu thư viện hỗ trợ; nếu không, polling mỗi 5-10 giây
- đọc config: khi `revision` thay đổi hoặc tối đa mỗi 5 phút
- ghi event: ngay sau sự kiện quan trọng, có retry

Timeout web mặc định: 120 giây. Firmware phải gửi heartbeat thường xuyên hơn giá trị này.

## 4. Quy tắc timestamp

- Tất cả timestamp giao tiếp là Unix seconds UTC.
- `time` trong lịch thuốc là giờ địa phương `HH:mm`.
- ESP phải đồng bộ NTP trước khi thực hiện lịch.
- Nếu chưa có thời gian hợp lệ, ESP không tự phát thuốc theo lịch; phải báo fault `CLOCK_NOT_SYNCED`.
- Không dùng chuỗi ngày giờ không có timezone trong state/command.

## 5. Contract đọc cấu hình

ESP đọc:

```text
users/{OWNER_UID}/devices/{DEVICE_ID}/meta
users/{OWNER_UID}/devices/{DEVICE_ID}/config
users/{OWNER_UID}/devices/{DEVICE_ID}/command
```

ESP phải kiểm tra:

- `schema_version == 1`
- `device_id` đúng với thiết bị hiện tại
- `revision` hợp lệ
- slot không trùng và nằm trong số ngăn thực tế
- dose có giờ `HH:mm` và quantity dương

Khi config hợp lệ:

1. lưu bản mới vào flash/NVS trước khi áp dụng
2. tăng `config_revision_applied` trong state
3. áp dụng lịch sau khi lưu thành công

Nếu config lỗi, giữ bản cuối cùng hợp lệ và báo:

```json
{
  "faults": ["CONFIG_INVALID"]
}
```

## 6. Contract command khóa/mở

Web ghi:

```json
{
  "schema_version": 1,
  "command_id": "cmd_000003",
  "type": "set_lock",
  "requested_lock": "unlocked",
  "created_at": 1760000300,
  "created_by": "web",
  "status": "pending"
}
```

ESP xử lý theo trình tự:

1. kiểm tra `command_id` đã xử lý chưa
2. kiểm tra trạng thái an toàn và cảm biến cửa
3. điều khiển motor/solenoid
4. cập nhật command thành `accepted`, sau đó `done` hoặc `failed`
5. ghi `state.lock` là trạng thái vật lý thực tế

Ví dụ thành công:

```json
{
  "status": "done",
  "ack_at": 1760000304,
  "error_code": null
}
```

Ví dụ thất bại:

```json
{
  "status": "failed",
  "ack_at": 1760000304,
  "error_code": "LOCK_MOTOR_JAMMED"
}
```

Web chỉ hiển thị “đã mở” khi `state.lock=unlocked`, không chỉ dựa vào việc command được tạo thành công.

## 7. Contract lịch uống và phát thuốc

Mỗi dose có:

```text
slot_id
 dose_id
time
quantity
```

ESP phải:

- tính liều tiếp theo từ giờ hiện tại và timezone thiết bị
- không phát trùng cùng `dose_id` trong cùng một ngày
- ghi event `dose_dispensed` khi cơ cấu đã nhả thuốc
- ghi `dose_taken` khi cảm biến xác nhận người dùng lấy thuốc
- ghi `dose_missed` khi quá thời gian chờ đã định nghĩa

Payload event mẫu:

```json
{
  "schema_version": 1,
  "event_id": "evt_1760000180_001",
  "type": "dose_taken",
  "slot_id": 1,
  "dose_id": "1-1",
  "occurred_at": 1760000180,
  "source": "esp",
  "payload": {
    "quantity": 1
  }
}
```

V1 không yêu cầu ESP gửi lại toàn bộ lịch trong mỗi heartbeat.

## 8. Contract state và heartbeat

Heartbeat tối thiểu:

```json
{
  "schema_version": 1,
  "reported_at": 1760000200,
  "last_seen": 1760000200,
  "connection": "online",
  "lock": "locked",
  "battery": {
    "percent": 78,
    "charging": false
  },
  "sensors": {
    "door_open": false,
    "pill_detected": true
  },
  "faults": []
}
```

Quy tắc:

- cập nhật `last_seen` ở mọi heartbeat
- `connection=online` chỉ được ghi khi firmware thật sự kết nối được Firebase
- khi mất mạng, ESP không thể đảm bảo ghi `connection=offline`; web dùng timeout
- khi dùng Firebase presence/onDisconnect, có thể ghi offline tự động nhưng vẫn phải duy trì `last_seen`
- battery `0` là hợp lệ; không thay bằng null hoặc bỏ field

## 9. Xóa thiết bị và provisioning lại

Web không xóa ngay state/config/command đang cần để ESP đọc. Web thực hiện:

```text
meta.lifecycle = deleted
command.type = delete_device
command.status = pending
```

ESP khi đọc thấy `lifecycle=deleted` hoặc command `delete_device` phải:

1. dừng lịch phát thuốc và điều khiển từ xa
2. ghi acknowledgement nếu còn mạng
3. xóa OWNER_UID/token/cache cấu hình cục bộ
4. ngừng heartbeat vào tài khoản cũ
5. chuyển sang trạng thái chờ provisioning

Thiết bị chỉ được dùng lại sau khi được ghép với `OWNER_UID` mới. Web/server có thể dọn dữ liệu sau khi firmware đã acknowledge hoặc sau thời gian lưu giữ.

## 10. Lỗi và retry

Mã lỗi tối thiểu:

```text
NETWORK_UNAVAILABLE
FIREBASE_AUTH_FAILED
FIREBASE_PERMISSION_DENIED
CONFIG_INVALID
CLOCK_NOT_SYNCED
LOW_BATTERY
DOOR_SENSOR_FAILED
LOCK_MOTOR_JAMMED
DISPENSER_BLOCKED
UNKNOWN_COMMAND
DEVICE_DELETED
```

Quy tắc retry:

- retry mạng theo exponential backoff, giới hạn tối đa 5 phút
- không retry vô hạn một command cơ khí đã có kết quả không chắc chắn
- command phải idempotent theo `command_id`
- ghi lỗi vào state/event, không chỉ in log Serial

## 11. Quy ước phía web/API

API phải kiểm tra user session trước khi tạo path Firebase. `device_id` từ request phải được đối chiếu với node thuộc `users/{uid}`.

Các operation v1:

```text
GET  device meta/state
GET  device config
PUT  device config
PUT  device command
GET  device events
PUT  device lifecycle
```

Không cho frontend ghi trực tiếp vào Firebase trong production; frontend gọi PHP API. API phải validate schema trước khi ghi.

## 12. Checklist nghiệm thu phần cứng mới

- [ ] MAC tạo ra `device_id` 12 ký tự và ổn định.
- [ ] NTP hoạt động và timestamp là Unix seconds UTC.
- [ ] Heartbeat gửi ít nhất mỗi 30 giây.
- [ ] Web nhận biết offline sau tối đa 120 giây.
- [ ] ESP đọc được config mới theo `revision`.
- [ ] ESP không phát trùng một `dose_id` trong ngày.
- [ ] Command khóa/mở không bị thực hiện hai lần.
- [ ] State phản ánh khóa vật lý, không chỉ phản ánh command.
- [ ] Battery 0% vẫn hiển thị đúng.
- [ ] ESP không tái xuất hiện sau khi web xóa thiết bị.
- [ ] Thiết bị có thể provisioning lại bằng tài khoản mới.
- [ ] Mất mạng không làm mất config hợp lệ đã lưu trong flash.
- [ ] Motor, cửa, cảm biến thuốc và pin đều có mã lỗi rõ ràng.
