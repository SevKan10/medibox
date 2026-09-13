# 💊 MEDIBOX — Smart Automatic Medicine Dispenser

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Platform](https://img.shields.io/badge/Platform-ESP32--S3-blue)
![Firmware](https://img.shields.io/badge/Firmware-C%2FC%2B%2B-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)

<p>
  <a href="#english">🇬🇧 English</a> ·
  <a href="#vietnamese">🇻🇳 Tiếng Việt</a>
</p>

> **Smart medication management and automatic dispensing system for elderly users and patients requiring scheduled medication.**

MEDIBOX is a smart automatic medicine dispensing system that combines **embedded systems, IoT, mechanical design, PCB design, and web-based management**.

The system is designed to automatically dispense medication according to a predefined schedule, provide voice reminders, verify whether the medication has been taken, and allow family members or caregivers to remotely configure and monitor the device through a web dashboard.

---

<a id="english"></a>

# 🇬🇧 English

## 📖 Overview

**MEDIBOX** is an IoT-enabled automatic medicine dispenser designed to support elderly users and patients who need to take medication on a fixed schedule.

The system combines an **ESP32-S3 embedded controller**, real-time clock, sensors, motors, audio playback, a protective locking mechanism, and a web dashboard.

The main goal is to reduce medication-related mistakes such as:

- Forgetting to take medication
- Taking medication at the wrong time
- Taking an incorrect dosage
- Accidentally accessing medication outside the scheduled time

MEDIBOX is developed as an educational and research project focusing on practical applications of **Embedded Systems, Electronics, IoT, and Telecommunications Engineering**.

---

## ✨ Main Features

### 💊 Automatic Medication Dispensing

The system uses a motorized dispensing mechanism to automatically move and dispense the scheduled medication.

The mechanical system can be implemented using:

- Rotary dosing disc
- Stepper motor
- Servo motor
- IR sensors for pill detection
- Other custom mechanical dispensing mechanisms

---

### ⏰ Scheduled Medication Management

Users can configure medication schedules through the Web Dashboard.

Each medication slot can contain information such as:

- Medication name
- Dosage
- Scheduled time
- Number of pills
- Medication slot
- Reminder settings

---

### 🔊 Voice Medication Reminder

MEDIBOX uses a **DFPlayer Mini** audio module and speaker to provide voice reminders.

Example:

> *"Ngoại ơi, tới giờ uống thuốc rồi."*

This approach is intended to provide a more natural and friendly reminder compared with a simple buzzer.

---

### ⚖️ Medication Intake Detection

A **Load Cell + HX711** module can be installed underneath the medication tray.

The system can monitor changes in weight to determine whether the medication tray has been removed or the medication has been taken.

If the medication has not been taken after a configurable period, the system can trigger another reminder and optionally send a notification to a registered caregiver.

---

### 🔐 Medication Compartment Protection

The medication storage area is protected by a locking mechanism.

The lock can be controlled by the system to prevent unauthorized access to medication outside the scheduled period.

---

### 🌐 Web & IoT Connectivity

MEDIBOX can communicate with the Web Dashboard through an Internet-connected backend.

The system is designed around a centralized backend that manages user information, medication schedules, device configuration, and synchronization between the Web Dashboard and the ESP32-S3.

```text
[ Web Dashboard ]
        │
        │ Internet
        ▼
[ Backend / API ]
        │
        ├── Database
        │
        └── Device Communication
                │
                ▼
           [ ESP32-S3 ]
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Sensors   Motors   Audio
```

The communication architecture may be implemented using HTTP/HTTPS APIs or another suitable lightweight communication mechanism depending on the final system design.

---

### 🕒 Real-Time Clock

A **DS3231 RTC module** is used to maintain accurate time.

This allows the device to continue operating according to the medication schedule even when the Internet connection is temporarily unavailable.

---

# 🧩 System Architecture

```text
                         ┌──────────────────────┐
                         │    Web Dashboard     │
                         │                      │
                         │ • User Management    │
                         │ • Medication Setup   │
                         │ • Schedule Setup     │
                         │ • Device Monitoring  │
                         └──────────┬───────────┘
                                    │
                               HTTPS / API
                                    │
                         ┌──────────▼───────────┐
                         │   Backend / Server   │
                         │                      │
                         │ • Authentication     │
                         │ • Database           │
                         │ • Device Management  │
                         └──────────┬───────────┘
                                    │
                               Device API
                                    │
                         ┌──────────▼───────────┐
                         │      ESP32-S3        │
                         │                      │
                         │ • Control Logic      │
                         │ • Medication Schedule│
                         │ • Sensor Processing  │
                         └──────────┬───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
   │  DS3231 RTC │          │   Sensors   │          │   Motors    │
   │             │          │             │          │             │
   │ Timekeeping │          │ IR / HX711  │          │ Stepper /   │
   └─────────────┘          └─────────────┘          │ Servo       │
                                                     └──────┬──────┘
                                                            │
                                                            ▼
                                                   Medication System
```

---

# 🔌 Hardware

The current hardware architecture includes:

| Component | Function |
|---|---|
| **ESP32-S3** | Main controller |
| **DS3231 RTC** | Real-time clock |
| **Stepper / Servo Motor** | Medication dispensing mechanism |
| **IR Sensor** | Pill / mechanism detection |
| **Load Cell** | Medication tray weight detection |
| **HX711** | Load cell amplifier and ADC |
| **DFPlayer Mini** | Audio playback |
| **Speaker** | Voice reminder |
| **OLED Display** | Device information and status |
| **Electronic Lock** | Medication compartment protection |
| **LED Indicators** | System status |

---

# 💻 Software

## Firmware

The firmware is developed using:

- **C/C++**
- **PlatformIO**
- **ESP32-S3**
- Arduino Framework

Potential libraries include:

```text
RTClib
HX711
DFPlayer Mini
WiFi
HTTPClient
ArduinoJson
```

The firmware is responsible for:

- Connecting to Wi-Fi
- Communicating with the backend
- Receiving medication schedules
- Processing the RTC schedule
- Controlling motors
- Reading sensors
- Playing voice reminders
- Controlling the locking mechanism
- Publishing device status
- Detecting medication intake

---

## Web Dashboard

The Web Dashboard provides an interface for users or caregivers to configure and monitor MEDIBOX.

Planned functions include:

```text
Authentication
├── Register
├── Login
└── User Profile

Dashboard
├── Device Status
├── Medication Status
├── Today's Schedule
└── Notifications

Medication Management
├── Medication Name
├── Dosage
├── Slot Assignment
└── Schedule

Device Management
├── Lock / Unlock
├── Manual Control
└── Device Configuration
```

---

# 📂 Repository Structure

```text
MEDIBOX/
│
├── firmware/
├── web/
├── pcb/
├── cad/
├── docs/
└── README.md
```

---

# 🛠️ Development

## 1. Firmware

Install:

- VS Code
- PlatformIO
- ESP32 platform package

Then open:

```text
MEDIBOX/firmware/
```

Build and upload the firmware to the ESP32-S3.

---

## 2. Web Dashboard

The Web Dashboard is developed as a separate component of the project.

The web system follows this architecture:

```text
User
  ↓
Web Dashboard
  ↓
Backend / API
  ↓
Database
  ↓
ESP32-S3
```

The backend handles authentication, user data, medication schedules, device configuration, and communication with the embedded device.

---

## 3. PCB Design

PCB development is performed using **Altium Designer**.

The `pcb/` directory contains:

- Schematic files
- PCB layout
- Component libraries
- Manufacturing files
- Gerber files

---

## 4. Mechanical Design

Mechanical components are designed using CAD software such as:

- SolidWorks
- Fusion 360
- Other compatible CAD tools

Supported file formats may include:

```text
.STEP
.STL
.SLDPRT
.SLDASM
```

The mechanical design includes:

- Medication storage compartments
- Rotary dispensing mechanism
- Medication tray
- Motor mounting system
- Locking mechanism
- Main enclosure

---

# 🔄 System Workflow

```text
1. User configures medication
              │
              ▼
2. User creates medication schedule
              │
              ▼
3. Data is stored in the backend
              │
              ▼
4. ESP32-S3 synchronizes the schedule
              │
              ▼
5. DS3231 checks current time
              │
              ▼
6. Medication dispensing mechanism operates
              │
              ▼
7. DFPlayer Mini plays voice reminder
              │
              ▼
8. User takes medication
              │
              ▼
9. Load Cell / Sensor verifies the action
              │
              ▼
10. System updates medication status
              │
              ▼
11. Backend can notify the caregiver
    if medication has not been taken
```

---

# 🚧 Project Status

**Status: In Development**

Current development focuses on:

- [x] Initial project architecture
- [x] Repository structure
- [ ] ESP32-S3 firmware
- [ ] RTC scheduling
- [ ] Medication dispensing mechanism
- [ ] Sensor integration
- [ ] DFPlayer Mini integration
- [ ] Lock mechanism
- [x] Web Dashboard
- [x] Backend API
- [x] Database
- [x] Device communication
- [ ] Notification system
- [ ] PCB prototype
- [ ] Mechanical prototype
- [ ] Full system integration

---

# 🔮 Future Development

Possible future improvements include:

- Mobile application
- Zalo / SMS notifications
- Medication history
- Multiple caregiver accounts
- Cloud synchronization
- OTA firmware updates
- Offline operation
- Medication statistics
- Improved pill-counting accuracy
- Camera-based medication verification
- AI-assisted medication management
- Battery backup
- Power failure detection

---

# 👥 Project

MEDIBOX is developed as an educational and research project in the field of:

- Embedded Systems
- Electronics
- IoT
- Telecommunications
- Automation
- Mechanical Design
- Web Development

The project aims to explore how embedded technology and IoT can be applied to real-world healthcare-support applications.

---

# 📄 License

MEDIBOX is released under the **GNU General Public License v3.0 (GPL-3.0)**.

You are free to use, study, modify, and redistribute this project under the terms of the GPL-3.0 license.

See the `LICENSE` file for the full license text.

---

© 2026 — **MEDIBOX Project**

---

<a id="vietnamese"></a>

# 🇻🇳 Tiếng Việt

## 📖 Tổng quan

**MEDIBOX** là thiết bị cấp thuốc tự động tích hợp IoT, được thiết kế để hỗ trợ người cao tuổi và những bệnh nhân cần uống thuốc theo lịch cố định.

Hệ thống kết hợp bộ điều khiển **ESP32-S3**, đồng hồ thời gian thực, cảm biến, động cơ, phát âm thanh, cơ cấu khóa bảo vệ và bảng điều khiển web.

Mục tiêu chính là giảm các lỗi liên quan đến việc uống thuốc như quên uống, uống sai giờ, dùng sai liều hoặc lấy thuốc ngoài thời gian được thiết lập.

MEDIBOX được phát triển cho mục đích giáo dục và nghiên cứu, tập trung vào các ứng dụng thực tế của **hệ thống nhúng, điện tử, IoT và kỹ thuật viễn thông**.

---

## ✨ Tính năng chính

### 💊 Cấp thuốc tự động

Cơ cấu cấp thuốc điều khiển bằng động cơ sẽ đưa đúng loại thuốc theo lịch đến khay nhận thuốc. Cơ cấu có thể sử dụng đĩa định lượng xoay, động cơ bước, động cơ servo và cảm biến hồng ngoại.

### ⏰ Quản lý lịch uống thuốc

Người dùng có thể cấu hình lịch uống thuốc trên Web Dashboard, bao gồm tên thuốc, liều lượng, thời gian, số viên, ngăn thuốc và cài đặt nhắc nhở.

### 🔊 Nhắc uống thuốc bằng giọng nói

Mô-đun **DFPlayer Mini** và loa phát lời nhắc bằng giọng nói, mang lại trải nghiệm tự nhiên và thân thiện hơn so với chuông báo đơn giản.

### ⚖️ Phát hiện việc uống thuốc

Load Cell kết hợp với HX711 có thể theo dõi thay đổi trọng lượng của khay thuốc. Nếu người dùng chưa uống thuốc sau một khoảng thời gian được cài đặt, hệ thống có thể nhắc lại và gửi thông báo cho người chăm sóc.

### 🔐 Bảo vệ ngăn thuốc

Khu vực chứa thuốc được bảo vệ bằng cơ cấu khóa. Hệ thống có thể khóa hoặc mở khóa để ngăn việc tiếp cận thuốc ngoài lịch cho phép.

### 🌐 Kết nối Web và IoT

Web Dashboard giao tiếp với backend để quản lý người dùng, lịch uống thuốc, cấu hình thiết bị và đồng bộ dữ liệu giữa dashboard với ESP32-S3.

### 🕒 Đồng hồ thời gian thực

Mô-đun **DS3231 RTC** duy trì thời gian chính xác, giúp thiết bị tiếp tục hoạt động theo lịch ngay cả khi kết nối Internet tạm thời bị gián đoạn.

---

## 🔌 Phần cứng

| Linh kiện | Chức năng |
|---|---|
| **ESP32-S3** | Bộ điều khiển chính |
| **DS3231 RTC** | Đồng hồ thời gian thực |
| **Động cơ bước / servo** | Cơ cấu cấp thuốc |
| **Cảm biến hồng ngoại** | Phát hiện viên thuốc hoặc cơ cấu |
| **Load Cell** | Đo trọng lượng khay thuốc |
| **HX711** | Khuếch đại và chuyển đổi tín hiệu Load Cell |
| **DFPlayer Mini** | Phát âm thanh nhắc nhở |
| **Loa** | Phát lời nhắc bằng giọng nói |
| **Màn hình OLED** | Hiển thị thông tin và trạng thái |
| **Khóa điện tử** | Bảo vệ ngăn thuốc |
| **Đèn LED** | Hiển thị trạng thái hệ thống |

---

## 💻 Phần mềm

### Firmware

Firmware được phát triển bằng **C/C++**, **PlatformIO**, nền tảng **ESP32-S3** và Arduino Framework. Firmware chịu trách nhiệm kết nối Wi-Fi, đồng bộ lịch, xử lý RTC, điều khiển động cơ, đọc cảm biến, phát lời nhắc, điều khiển khóa và cập nhật trạng thái thiết bị.

### Web Dashboard

Web Dashboard cho phép người dùng hoặc người chăm sóc xác thực tài khoản, quản lý thuốc, thiết lập lịch, theo dõi trạng thái thiết bị, khóa/mở khóa và điều khiển thiết bị thủ công.

---

## 📂 Cấu trúc repository

```text
MEDIBOX/
├── firmware/
├── web/
├── pcb/
├── cad/
├── docs/
└── README.md
```

---

## 🔄 Quy trình hoạt động

1. Người dùng cấu hình thông tin thuốc và lịch uống.
2. Dữ liệu được lưu ở backend.
3. ESP32-S3 đồng bộ lịch uống thuốc.
4. DS3231 kiểm tra thời gian hiện tại.
5. Cơ cấu cấp thuốc hoạt động đúng thời điểm.
6. DFPlayer Mini phát lời nhắc bằng giọng nói.
7. Người dùng uống thuốc.
8. Load Cell hoặc cảm biến xác nhận hành động.
9. Hệ thống cập nhật trạng thái và thông báo cho người chăm sóc nếu cần.

---

## 🚧 Trạng thái dự án

**Trạng thái: Đang phát triển**

Đã hoàn thành kiến trúc repository, Web Dashboard, Backend API, cơ sở dữ liệu và giao tiếp với thiết bị. Firmware ESP32-S3, lập lịch RTC, cơ cấu cấp thuốc, tích hợp cảm biến, DFPlayer Mini, khóa, PCB, mô hình cơ khí và tích hợp toàn hệ thống vẫn đang được phát triển.

---

## 🔮 Định hướng phát triển

Các hướng phát triển có thể bao gồm ứng dụng di động, thông báo Zalo/SMS, lịch sử uống thuốc, nhiều tài khoản người chăm sóc, đồng bộ đám mây, cập nhật firmware OTA, chế độ ngoại tuyến, thống kê thuốc, xác minh bằng camera, hỗ trợ AI, pin dự phòng và phát hiện mất điện.

---

## 👥 Dự án

MEDIBOX là dự án giáo dục và nghiên cứu trong các lĩnh vực hệ thống nhúng, điện tử, IoT, viễn thông, tự động hóa, thiết kế cơ khí và phát triển web.

## 📄 Giấy phép

MEDIBOX được phát hành theo **GNU General Public License phiên bản 3.0 (GPL-3.0)**. Bạn có thể sử dụng, nghiên cứu, chỉnh sửa và phân phối dự án theo các điều khoản của giấy phép này.

Xem đầy đủ nội dung tại file `LICENSE`.

© 2026 — **Dự án MEDIBOX**