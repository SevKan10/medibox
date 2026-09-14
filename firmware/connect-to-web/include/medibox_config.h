#pragma once

#include <Firebase_ESP_Client.h>
#include <Preferences.h>
#include <WebServer.h>

constexpr int BATTERY_PIN = 34;
constexpr int STATUS_LED_PIN = 2;
constexpr unsigned long STATE_INTERVAL_MS = 10000;

extern const char* database_url;
extern FirebaseData fbdo;
extern FirebaseAuth auth;
extern FirebaseConfig config;
extern Preferences preferences;
extern WebServer setupServer;
extern String wifiSsid;
extern String wifiPassword;
extern String userUid;
extern String deviceId;
extern String macAddress;
extern String deviceBasePath;
extern String statePath;
extern bool setupMode;

const char* resetReasonName(esp_reset_reason_t reason);
int readBatteryPercent();
String deviceIdFromMac();
