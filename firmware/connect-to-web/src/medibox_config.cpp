#include <Arduino.h>
#include <esp_system.h>
#include "medibox_config.h"

const char* database_url = "medibox-123b2-default-rtdb.asia-southeast1.firebasedatabase.app";
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
Preferences preferences;
WebServer setupServer(80);
String wifiSsid;
String wifiPassword;
String userUid;
String deviceId;
String macAddress;
String deviceBasePath;
String statePath;
bool setupMode = false;

const char* resetReasonName(esp_reset_reason_t reason) {
  switch (reason) {
    case ESP_RST_POWERON: return "POWERON";
    case ESP_RST_EXT: return "EXTERNAL";
    case ESP_RST_SW: return "SOFTWARE";
    case ESP_RST_PANIC: return "PANIC";
    case ESP_RST_INT_WDT: return "INT_WDT";
    case ESP_RST_TASK_WDT: return "TASK_WDT";
    case ESP_RST_WDT: return "WDT";
    case ESP_RST_DEEPSLEEP: return "DEEPSLEEP";
    case ESP_RST_BROWNOUT: return "BROWNOUT";
    case ESP_RST_SDIO: return "SDIO";
    default: return "UNKNOWN";
  }
}

int readBatteryPercent() {
  long sum = 0;
  for (int index = 0; index < 10; index++) {
    sum += analogRead(BATTERY_PIN);
    delay(2);
  }

  int rawAdc = sum / 10;
  int batteryPercent = map(rawAdc, 2640, 3475, 0, 100);
  batteryPercent = constrain(batteryPercent, 0, 100);
  digitalWrite(STATUS_LED_PIN, batteryPercent <= 20 ? HIGH : LOW);
  Serial.printf("Battery Percent: %d%%\n", batteryPercent);
  return batteryPercent;
}

String deviceIdFromMac() {
  String id = macAddress;
  id.replace(":", "");
  id.toUpperCase();
  return "device_" + id;
}
