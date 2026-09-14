#include <Arduino.h>
#include <esp_mac.h>
#include <time.h>
#include "medibox_config.h"
#include "medibox_firebase.h"
#include "medibox_setup.h"

unsigned long lastMsgTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.print("Reset reason: ");
  Serial.println(resetReasonName(esp_reset_reason()));

  pinMode(BATTERY_PIN, INPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  uint8_t macBytes[6];
  esp_read_mac(macBytes, ESP_MAC_WIFI_STA);
  char macText[18];
  snprintf(macText, sizeof(macText), "%02X:%02X:%02X:%02X:%02X:%02X",
           macBytes[0], macBytes[1], macBytes[2], macBytes[3], macBytes[4], macBytes[5]);
  macAddress = macText;
  deviceId = deviceIdFromMac();

  Serial.print("MAC: ");
  Serial.println(macAddress);

  if (!loadAndConnectWiFi()) startSetupMode();
  if (setupMode) return;

  Serial.println("WiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  initializeFirebase();
  Serial.println("Firebase da khoi dong.");

  deviceBasePath = firebaseDevicePath(userUid);
  statePath = deviceBasePath + "/state";
  lastMsgTime = millis() - STATE_INTERVAL_MS;
}

void loop() {
  if (setupMode) {
    setupServer.handleClient();
    return;
  }

  unsigned long now = millis();
  if (now - lastMsgTime <= STATE_INTERVAL_MS) return;
  lastMsgTime = now;

  if (!Firebase.ready()) {
    Serial.println("Firebase chua san sang.");
    return;
  }

  time_t nowEpoch = time(nullptr);
  if (nowEpoch < 1000000000) {
    Serial.println("Chua dong bo duoc thoi gian NTP.");
    return;
  }

  FirebaseJson stateJson;
  fillStateJson(stateJson);
  if (Firebase.RTDB.setJSON(&fbdo, statePath.c_str(), &stateJson)) {
    Serial.println("Da luu state len Firebase.");
  } else {
    Serial.print("Loi ghi state: ");
    Serial.println(fbdo.errorReason());
  }
}
