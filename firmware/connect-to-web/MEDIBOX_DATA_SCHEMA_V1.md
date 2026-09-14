# Medibox Data Schema v1

Tài liệu này là schema dữ liệu chuẩn cho Medibox mới. Mục tiêu là tách rõ dữ liệu cấu hình, trạng thái thực tế, lệnh điều khiển và vòng đời thiết bị.

## 1. Nguyên tắc

- Mọi dữ liệu thuộc một người dùng nằm dưới `users/{uid}`.
- `device_id` là định danh ổn định của thiết bị, không đổi sau khi thiết bị khởi động lại.
- Web là nguồn ghi cấu hình và lệnh.
- ESP là nguồn ghi trạng thái và sự kiện phần cứng.
- Không dùng `online`, `locked` hoặc `medicine_taken` làm dữ liệu đa nghĩa.
- Thời gian lưu dạng Unix timestamp giây UTC; giờ uống lưu dạng `HH:mm` theo timezone của người dùng.
- Schema mới có `schema_version: 1` ở các object chính.

## 2. Cây Firebase chuẩn

```text
users/{uid}/
  profile/
    display_name
    timezone
    created_at

  devices/{device_id}/
    meta/
    config/
    state/
    command/
    events/{event_id}/

  user_settings/
    low_battery_threshold_percent
    offline_timeout_seconds
```

`devices` là cấu trúc duy nhất được web và firmware sử dụng. Web không đọc,
ghi hoặc ánh xạ dữ liệu từ các nhánh cũ.

## 3. Định danh thiết bị

Khuyến nghị dùng toàn bộ MAC đã bỏ dấu `:` để tránh trùng:

```text
MAC:        C8:2E:18:F8:FD:00
device_id:  device_C82E18F8FD00
```

Quy tắc:

- regex: `^device_[A-F0-9]{12}$`
- viết hoa phần MAC
- không lấy chỉ 6 ký tự cuối
- `device_id` không lấy từ tên người dùng hoặc số thứ tự hiển thị

## 4. Meta thiết bị

Path: `users/{uid}/devices/{device_id}/meta`

```json
{
  "schema_version": 1,
  "device_id": "device_C82E18F8FD00",
  "mac_address": "C8:2E:18:F8:FD:00",
  "model": "medibox-v2",
  "firmware_version": "1.0.0",
  "display_name": "Medibox phòng ngủ",
  "timezone": "Asia/Ho_Chi_Minh",
  "lifecycle": "active",
  "registered_at": 1760000000,
  "last_boot_at": 1760000000,
  "deleted_at": null
}
```

`lifecycle` chỉ nhận: `active`, `disabled`, `deleted`.

- `active`: thiết bị được phép hoạt động.
- `disabled`: tạm khóa logic, không xóa dữ liệu.
- `deleted`: web đã yêu cầu xóa; ESP phải dừng sử dụng tài khoản hiện tại và chờ ghép nối lại.

## 5. Cấu hình thuốc

Path: `users/{uid}/devices/{device_id}/config`

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
    },
    {
      "slot_id": 2,
      "enabled": false,
      "medicine_name": "",
      "note": "",
      "doses": []
    }
  ]
}
```

Quy tắc:

- `slot_id` là số nguyên dương, bắt đầu từ 1.
- `enabled=false` thì ESP bỏ qua ngăn đó.
- `medicine_name` và `note` là chuỗi UTF-8.
- `time` dùng 24 giờ `HH:mm`.
- `quantity` là số nguyên từ 1 trở lên.
- `revision` tăng đúng 1 sau mỗi lần web lưu thành công.
- ESP chỉ áp dụng bản config mới khi đọc đủ object và `revision` lớn hơn bản đang dùng.
- Lịch lặp hằng ngày trong timezone của thiết bị; chưa dùng ngày trong tuần ở v1.

## 6. Trạng thái thực tế của thiết bị

Path: `users/{uid}/devices/{device_id}/state`

```json
{
  "schema_version": 1,
  "reported_at": 1760000200,
  "last_seen": 1760000200,
  "connection": "online",
  "lock": "locked",
  "medicine": {
    "last_action": "dispensed",
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

Giá trị chuẩn:

- `connection`: `online`, `offline`.
- `lock`: `locked`, `unlocked`, `unknown`.
- `medicine.last_action`: `none`, `dispensed`, `taken`, `missed`.
- `battery.percent`: số nguyên 0-100; giá trị `0` là hợp lệ.
- `faults`: mảng mã lỗi, ví dụ `DOOR_SENSOR`, `MOTOR`, `LOW_BATTERY`.

Web xác định offline như sau:

1. Nếu `connection=offline`, hiển thị offline.
2. Nếu `last_seen` quá `offline_timeout_seconds`, hiển thị offline.
3. Không tự sửa `state.connection` từ web; web chỉ tính trạng thái hiển thị.

## 7. Lệnh từ web đến ESP

Path: `users/{uid}/devices/{device_id}/command`

```json
{
  "schema_version": 1,
  "command_id": "cmd_000003",
  "type": "set_lock",
  "requested_lock": "unlocked",
  "created_at": 1760000300,
  "created_by": "web",
  "status": "pending",
  "ack_at": null,
  "error_code": null
}
```

`type` v1:

- `set_lock`: `requested_lock` là `locked` hoặc `unlocked`.
- `sync_config`: yêu cầu ESP đọc lại config.
- `factory_reset`: chỉ thêm khi có cơ chế xác nhận riêng, không bật mặc định.
- `delete_device`: đánh dấu thiết bị bị thu hồi, xem mục 9.

ESP phải xử lý idempotent:

- nếu `command_id` đã xử lý, không thực hiện lại hành động cơ khí
- ghi `status=accepted`, `done` hoặc `failed`
- cập nhật `ack_at`
- khi lỗi, ghi `error_code` và không giả vờ thành công

## 8. Sự kiện tùy chọn

Path: `users/{uid}/devices/{device_id}/events/{event_id}`

```json
{
  "schema_version": 1,
  "event_id": "evt_1760000180_001",
  "type": "dose_taken",
  "slot_id": 1,
  "dose_id": "1-1",
  "occurred_at": 1760000180,
  "source": "esp",
  "payload": {}
}
```

Các event nên dùng: `dose_dispensed`, `dose_taken`, `dose_missed`, `door_opened`, `low_battery`, `fault_detected`, `device_booted`.

## 9. Xóa thiết bị và chống tái xuất hiện

Không xóa ngay toàn bộ node mà ESP đang đọc. Quy trình chuẩn:

1. Web ghi `meta.lifecycle=deleted`.
2. Web ghi command `type=delete_device`, `status=pending`.
3. ESP đọc command, xóa credential/cache cục bộ, ngừng ghi state và trả `status=done` nếu còn kết nối.
4. Web ẩn thiết bị có lifecycle `deleted`.
5. Sau thời gian lưu trữ, server mới xóa `config`, `state`, `events`.

Nếu ESP đang offline lúc xóa, khi nó online lại phải đọc `meta.lifecycle` trước khi ghi state. Nếu thấy `deleted`, nó không được tự tạo lại thiết bị cũ.

## 10. Phạm vi dữ liệu hiện tại

Web chỉ đọc và ghi schema v1 dưới `users/{uid}/devices/{device_id}`. Dữ liệu
trạng thái phải dùng các field chuẩn như `connection`, `lock`,
`medicine.last_action` và `battery.percent`; không chuyển đổi ngầm từ field
hoặc nhánh dữ liệu cũ.

## 11. Validation tối thiểu

API phải từ chối request nếu:

- `uid` không lấy từ session đã xác thực.
- `device_id` không đúng regex.
- `slot_id` nằm ngoài số ngăn phần cứng.
- giờ không đúng `HH:mm`.
- quantity nhỏ hơn 1 hoặc không phải số nguyên.
- revision không lớn hơn bản hiện tại khi ghi config.
- command type không thuộc danh sách cho phép.

Firmware phải từ chối config nếu sai `schema_version`, thiếu `slots`, trùng `slot_id` hoặc có dose không hợp lệ.
