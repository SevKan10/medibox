# 💊 MEDIBOX — Smart Automatic Medicine Dispenser

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Platform](https://img.shields.io/badge/Platform-ESP32--S3-blue)
![Firmware](https://img.shields.io/badge/Firmware-C%2FC%2B%2B-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)

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