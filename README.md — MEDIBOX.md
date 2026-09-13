# 💊 MEDIBOX — Smart Automatic Medicine Dispenser

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Platform](https://img.shields.io/badge/Platform-ESP32--S3-blue)
![Firmware](https://img.shields.io/badge/Firmware-C%2FC%2B%2B-blue)
![IoT](https://img.shields.io/badge/IoT-MQTT-green)
![License](https://img.shields.io/badge/License-MIT-green)

> **Smart medication management and automatic dispensing system for elderly users and patients requiring scheduled medication.**

MEDIBOX is a smart automatic medicine dispensing system that combines **embedded systems, IoT, mechanical design, PCB design, and web-based management**.

The system is designed to automatically dispense medication according to a predefined schedule, provide voice reminders, verify whether the medication has been taken, and allow family members or caregivers to remotely configure and monitor the device through a web dashboard.

---

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

### 🌐 IoT & Remote Management

MEDIBOX can communicate with a Web Dashboard through an IoT communication layer.

The planned architecture uses:

```text
Web Dashboard
      │
      │ Internet
      ▼
 Backend / Database
      │
      │ MQTT
      ▼
   ESP32-S3
      │
      ├── Medication dispenser
      ├── Sensors
      ├── RTC
      ├── Audio
      └── Lock mechanism
```

MQTT is considered as the primary communication protocol between the backend and ESP32 because of its lightweight publish/subscribe architecture.

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
                              Internet / API
                                    │
                         ┌──────────▼───────────┐
                         │ Backend / Database   │
                         │                      │
                         │ • Authentication     │
                         │ • Database           │
                         │ • MQTT Broker        │
                         └──────────┬───────────┘
                                    │
                                   MQTT
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
- Arduino-compatible libraries

Potential libraries include:

```text
RTClib
HX711
DFPlayer Mini
PubSubClient
WiFi
ArduinoJson
```

The firmware is responsible for:

- Connecting to Wi-Fi
- Synchronizing with the backend
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
│   ├── src/
│   ├── include/
│   ├── lib/
│   └── platformio.ini
│
├── web/
│   ├── frontend/
│   ├── backend/
│   ├── assets/
│   └── README.md
│
├── pcb/
│   ├── schematic/
│   ├── pcb/
│   ├── gerber/
│   └── libraries/
│
├── cad/
│   ├── 3d-models/
│   ├── enclosure/
│   ├── mechanism/
│   ├── step/
│   └── stl/
│
├── docs/
│   ├── block-diagram/
│   ├── datasheets/
│   ├── technical-docs/
│   └── images/
│
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

The web system is responsible for:

```text
User
  ↓
Web Dashboard
  ↓
Backend
  ↓
Database
  ↓
MQTT
  ↓
ESP32-S3
```

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
4. ESP32-S3 receives the schedule
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
10. System updates status
              │
              ▼
11. Notification is sent if medication
    has not been taken within the allowed time
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
- [ ] Web Dashboard
- [ ] Backend API
- [ ] Database
- [ ] MQTT communication
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

This project is released under the **MIT License**.

---

<br>

# 🇻🇳 Tiếng Việt

## 📖 Giới thiệu

**MEDIBOX** là hệ thống máy phân thuốc tự động thông minh tích hợp **IoT, hệ thống nhúng, cảm biến, cơ cấu cơ khí, thiết kế PCB và Web Dashboard**.

Hệ thống được thiết kế nhằm hỗ trợ người cao tuổi hoặc những người cần uống thuốc theo lịch cố định.

MEDIBOX có khả năng:

- Tự động phân thuốc theo lịch
- Nhắc uống thuốc bằng giọng nói
- Theo dõi trạng thái lấy thuốc
- Phát hiện trường hợp chưa uống thuốc
- Bảo vệ ngăn chứa thuốc
- Quản lý lịch uống thuốc thông qua Web Dashboard
- Đồng bộ dữ liệu với thiết bị ESP32-S3

Mục tiêu của dự án là giảm các tình trạng:

- Quên uống thuốc
- Uống thuốc sai giờ
- Uống sai liều lượng
- Tự ý lấy thuốc ngoài lịch

Dự án được phát triển theo hướng **học tập, nghiên cứu và ứng dụng thực tế** trong lĩnh vực Kỹ thuật Điện tử - Viễn thông.

---

# ✨ Tính năng chính

### 💊 Phân thuốc tự động

MEDIBOX sử dụng cơ cấu cơ khí điều khiển bằng động cơ để đưa thuốc đến vị trí cấp thuốc theo lịch đã cài đặt.

Cơ cấu có thể sử dụng:

- Đĩa xoay định lượng
- Động cơ bước
- Servo
- Cảm biến hồng ngoại
- Các cơ cấu cấp thuốc tùy chỉnh

---

### ⏰ Quản lý lịch uống thuốc

Người dùng hoặc người chăm sóc có thể thiết lập lịch uống thuốc thông qua Web Dashboard.

Thông tin có thể bao gồm:

- Tên thuốc
- Liều lượng
- Thời gian uống
- Số lượng viên
- Ngăn thuốc
- Cài đặt nhắc nhở

---

### 🔊 Nhắc uống thuốc bằng giọng nói

MEDIBOX sử dụng **DFPlayer Mini** và loa để phát thông báo bằng giọng nói.

Ví dụ:

> *"Ngoại ơi, tới giờ uống thuốc rồi."*

Việc sử dụng giọng nói giúp hệ thống thân thiện hơn so với chỉ sử dụng còi báo.

---

### ⚖️ Xác nhận người dùng đã lấy thuốc

Một **Load Cell kết hợp HX711** có thể được đặt bên dưới khay nhận thuốc.

Hệ thống theo dõi sự thay đổi trọng lượng để xác định liệu người dùng đã lấy khay thuốc hoặc lấy thuốc hay chưa.

Nếu sau một khoảng thời gian cài đặt mà thuốc vẫn chưa được lấy, hệ thống có thể:

- Phát lại lời nhắc
- Cập nhật trạng thái
- Gửi thông báo đến người chăm sóc

---

### 🔐 Bảo vệ ngăn thuốc

Ngăn chứa thuốc được bảo vệ bằng cơ cấu khóa.

Khóa có thể được điều khiển bởi hệ thống nhằm hạn chế việc truy cập thuốc ngoài thời gian được cho phép.

---

### 🌐 Kết nối IoT

MEDIBOX có thể kết nối với Web Dashboard thông qua Internet.

Kiến trúc dự kiến:

```text
Web Dashboard
      │
      │ Internet
      ▼
 Backend / Database
      │
      │ MQTT
      ▼
   ESP32-S3
```

**MQTT** được định hướng sử dụng làm giao thức giao tiếp chính giữa Backend và ESP32-S3 nhờ mô hình Publish/Subscribe nhẹ và phù hợp với hệ thống IoT.

---

### 🕒 Đồng hồ thời gian thực

Module **DS3231 RTC** được sử dụng để duy trì thời gian chính xác cho thiết bị.

Nhờ đó, MEDIBOX vẫn có thể thực hiện lịch uống thuốc ngay cả khi kết nối Internet tạm thời bị gián đoạn.

---

# 🧩 Kiến trúc hệ thống

```text
                         ┌──────────────────────┐
                         │    Web Dashboard     │
                         │                      │
                         │ • Quản lý người dùng │
                         │ • Cài đặt thuốc      │
                         │ • Cài đặt lịch       │
                         │ • Theo dõi thiết bị  │
                         └──────────┬───────────┘
                                    │
                              Internet / API
                                    │
                         ┌──────────▼───────────┐
                         │ Backend / Database   │
                         │                      │
                         │ • Authentication     │
                         │ • Database           │
                         │ • MQTT Broker        │
                         └──────────┬───────────┘
                                    │
                                   MQTT
                                    │
                         ┌──────────▼───────────┐
                         │      ESP32-S3        │
                         │                      │
                         │ • Điều khiển hệ thống│
                         │ • Xử lý lịch uống    │
                         │ • Đọc cảm biến       │
                         └──────────┬───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
   │  DS3231 RTC │          │   Cảm biến  │          │   Động cơ   │
   │             │          │             │          │             │
   │  Thời gian  │          │ IR / HX711  │          │ Stepper /   │
   └─────────────┘          └─────────────┘          │ Servo       │
                                                     └──────┬──────┘
                                                            │
                                                            ▼
                                                   Cơ cấu phân thuốc
```

---

# 🔌 Phần cứng

| Linh kiện | Chức năng |
|---|---|
| **ESP32-S3** | Vi điều khiển chính |
| **DS3231 RTC** | Quản lý thời gian thực |
| **Stepper / Servo Motor** | Điều khiển cơ cấu phân thuốc |
| **IR Sensor** | Phát hiện thuốc / vị trí cơ cấu |
| **Load Cell** | Đo trọng lượng khay thuốc |
| **HX711** | Khuếch đại và đọc Load Cell |
| **DFPlayer Mini** | Phát âm thanh |
| **Speaker** | Phát lời nhắc |
| **OLED Display** | Hiển thị thông tin |
| **Electronic Lock** | Bảo vệ ngăn thuốc |
| **LED** | Hiển thị trạng thái |

---

# 💻 Phần mềm

## Firmware

Firmware được phát triển bằng:

- **C/C++**
- **PlatformIO**
- **ESP32-S3**
- Arduino Framework

Các thư viện dự kiến:

```text
RTClib
HX711
DFPlayer Mini
PubSubClient
WiFi
ArduinoJson
```

Firmware chịu trách nhiệm:

- Kết nối Wi-Fi
- Giao tiếp Backend
- Nhận lịch uống thuốc
- Xử lý thời gian
- Điều khiển động cơ
- Đọc cảm biến
- Phát âm thanh
- Điều khiển khóa
- Cập nhật trạng thái thiết bị
- Xác nhận quá trình lấy thuốc

---

## Web Dashboard

Web Dashboard được xây dựng để người dùng hoặc người chăm sóc có thể cấu hình và theo dõi MEDIBOX.

Các chức năng dự kiến:

```text
Authentication
├── Đăng ký
├── Đăng nhập
└── Thông tin người dùng

Dashboard
├── Trạng thái thiết bị
├── Trạng thái thuốc
├── Lịch uống hôm nay
└── Thông báo

Quản lý thuốc
├── Tên thuốc
├── Liều lượng
├── Ngăn thuốc
└── Lịch uống

Quản lý thiết bị
├── Khóa / Mở khóa
├── Điều khiển thủ công
└── Cấu hình thiết bị
```

---

# 📂 Cấu trúc Repository

```text
MEDIBOX/
│
├── firmware/          # Firmware ESP32-S3
│
├── web/               # Web Dashboard & Backend
│
├── pcb/               # Thiết kế schematic, PCB, Gerber
│
├── cad/               # Thiết kế cơ khí và mô hình 3D
│
├── docs/              # Tài liệu kỹ thuật, datasheet
│
└── README.md          # Tài liệu tổng quan
```

---

# 🛠️ Phát triển

### 1. Firmware

Sử dụng:

- VS Code
- PlatformIO
- ESP32 Platform

Thư mục firmware:

```text
MEDIBOX/firmware/
```

---

### 2. Web Dashboard

Web Dashboard hoạt động theo mô hình:

```text
Người dùng
    ↓
Web Dashboard
    ↓
Backend
    ↓
Database
    ↓
MQTT
    ↓
ESP32-S3
```

---

### 3. Thiết kế PCB

PCB được thiết kế bằng **Altium Designer**.

Thư mục `pcb/` chứa:

- Schematic
- PCB Layout
- Library linh kiện
- File sản xuất
- Gerber

---

### 4. Thiết kế cơ khí

Các bộ phận cơ khí được thiết kế bằng phần mềm CAD như:

- SolidWorks
- Fusion 360

Các định dạng có thể sử dụng:

```text
.STEP
.STL
.SLDPRT
.SLDASM
```

Bao gồm:

- Vỏ MEDIBOX
- Ngăn chứa thuốc
- Cơ cấu đĩa xoay
- Khay nhận thuốc
- Giá đỡ động cơ
- Cơ cấu khóa

---

# 🔄 Quy trình hoạt động

```text
1. Người dùng cấu hình thuốc
              │
              ▼
2. Thiết lập lịch uống
              │
              ▼
3. Dữ liệu được lưu trên Backend
              │
              ▼
4. ESP32-S3 nhận lịch
              │
              ▼
5. DS3231 kiểm tra thời gian
              │
              ▼
6. Cơ cấu phân thuốc hoạt động
              │
              ▼
7. DFPlayer Mini phát lời nhắc
              │
              ▼
8. Người dùng lấy thuốc
              │
              ▼
9. Load Cell / Sensor xác nhận
              │
              ▼
10. Cập nhật trạng thái
              │
              ▼
11. Gửi thông báo nếu thuốc
    chưa được lấy đúng thời gian
```

---

# 🚧 Trạng thái dự án

**Trạng thái: Đang phát triển**

- [x] Xây dựng kiến trúc dự án
- [x] Xây dựng cấu trúc Repository
- [ ] Firmware ESP32-S3
- [ ] Xử lý lịch bằng RTC
- [ ] Cơ cấu phân thuốc
- [ ] Tích hợp cảm biến
- [ ] Tích hợp DFPlayer Mini
- [ ] Cơ cấu khóa
- [ ] Web Dashboard
- [ ] Backend API
- [ ] Database
- [ ] MQTT
- [ ] Hệ thống thông báo
- [ ] PCB Prototype
- [ ] Mechanical Prototype
- [ ] Tích hợp toàn hệ thống

---

# 🔮 Định hướng phát triển

Trong tương lai, MEDIBOX có thể được mở rộng với:

- Ứng dụng điện thoại
- Thông báo qua Zalo / SMS
- Lịch sử uống thuốc
- Nhiều tài khoản người chăm sóc
- Đồng bộ dữ liệu Cloud
- OTA Firmware Update
- Chế độ Offline
- Thống kê lịch uống thuốc
- Cải thiện độ chính xác đếm viên
- Camera xác nhận thuốc
- AI hỗ trợ quản lý thuốc
- Pin dự phòng
- Phát hiện mất điện

---

# 👥 Về dự án

MEDIBOX là dự án học tập và nghiên cứu tập trung vào các lĩnh vực:

- Hệ thống nhúng
- Điện tử
- IoT
- Kỹ thuật Viễn thông
- Tự động hóa
- Thiết kế cơ khí
- Thiết kế PCB
- Phát triển Web

Dự án hướng tới việc nghiên cứu khả năng ứng dụng công nghệ nhúng và IoT vào các bài toán hỗ trợ chăm sóc sức khỏe trong thực tế.

---

# 📄 License

Dự án được phát hành theo **MIT License**.

---

© 2026 — **MEDIBOX Project**