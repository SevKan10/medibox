#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "medibox_config.h"
#include "medibox_firebase.h"
#include "medibox_setup.h"

static String htmlEscape(const String& value) {
  String escaped = value;
  escaped.replace("&", "&amp;");
  escaped.replace("<", "&lt;");
  escaped.replace(">", "&gt;");
  escaped.replace("\"", "&quot;");
  return escaped;
}

static void handleSetupPage() {
  String page = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                "<title>Medibox setup</title></head><body><h2>Medibox setup</h2>";
  page += "<p>MAC: <b>" + macAddress + "</b></p><p>Device ID: <b>" + deviceId + "</b></p>";
  page += "<form method='POST' action='/save'>"
          "<label>Wi-Fi name (SSID)</label><br><input name='ssid' required><br><br>"
          "<label>Wi-Fi password</label><br><input name='password' type='password'><br><br>"
          "<label>Firebase User UID</label><br><input name='uid' required><br><br>"
          "<button type='submit'>Register device</button></form>"
          "<p>UID must belong to the Firebase user that owns this device.</p></body></html>";
  setupServer.send(200, "text/html; charset=utf-8", page);
}

static bool connectToRequestedWiFi(const String& requestedSsid, const String& requestedPassword) {
  WiFi.begin(requestedSsid.c_str(), requestedPassword.c_str());
  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

static void handleSaveSetup() {
  if (!setupServer.hasArg("ssid") || !setupServer.hasArg("uid")) {
    setupServer.send(400, "text/plain", "SSID and UID are required");
    return;
  }

  String requestedSsid = setupServer.arg("ssid");
  String requestedPassword = setupServer.arg("password");
  String requestedUid = setupServer.arg("uid");

  if (!connectToRequestedWiFi(requestedSsid, requestedPassword)) {
    Serial.println("Khong ket noi duoc Wi-Fi da nhap.");
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Khong ket noi duoc Wi-Fi</h2>"
                     "<p>Kiem tra SSID va mat khau roi thu lai.</p>");
    return;
  }

  userUid = requestedUid;
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  initializeFirebase();
  unsigned long firebaseStartedAt = millis();
  while (!Firebase.ready() && millis() - firebaseStartedAt < 10000) {
    delay(100);
  }

  if (!Firebase.ready()) {
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Khong ket noi duoc Firebase</h2><p>Thu lai sau.</p>");
    return;
  }

  time_t nowEpoch = time(nullptr);
  String requestedDevicePath = firebaseDevicePath(requestedUid);
  FirebaseJson metaJson;
  fillMetaJson(metaJson, nowEpoch);
  String metaPath = requestedDevicePath + "/meta";
  if (!Firebase.RTDB.setJSON(&fbdo, metaPath.c_str(), &metaJson)) {
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Dang ky that bai</h2><p>Khong the luu meta.</p>");
    return;
  }

  FirebaseJson stateJson;
  fillStateJson(stateJson);
  String statePathToWrite = requestedDevicePath + "/state";
  if (!Firebase.RTDB.setJSON(&fbdo, statePathToWrite.c_str(), &stateJson)) {
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Dang ky that bai</h2><p>Khong the luu state.</p>");
    return;
  }

  preferences.begin("medibox", false);
  preferences.putString("ssid", requestedSsid);
  preferences.putString("password", requestedPassword);
  preferences.putString("uid", requestedUid);
  preferences.end();

  Serial.println("Dang ky thanh cong, thiet bi se khoi dong lai.");
  delay(1000);
  ESP.restart();
}

void startSetupMode() {
  setupMode = true;
  String apName = "MEDIBOX-" + macAddress.substring(macAddress.length() - 5);
  String apPassword = "setup" + macAddress.substring(macAddress.length() - 6);

  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_AP);
  delay(500);
  WiFi.setSleep(false);

  IPAddress localIp(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(localIp, gateway, subnet);
  bool apStarted = WiFi.softAP(apName.c_str(), apPassword.c_str(), 1, false, 4);

  Serial.println("=== SETUP MODE ===");
  if (!apStarted) {
    Serial.println("ERROR: Khong the khoi dong AP!");
    return;
  }

  setupServer.on("/", HTTP_GET, handleSetupPage);
  setupServer.on("/save", HTTP_POST, handleSaveSetup);
  setupServer.onNotFound([]() {
    setupServer.sendHeader("Location", "/");
    setupServer.send(302);
  });
  setupServer.begin();

  Serial.print("AP: ");
  Serial.println(apName);
  Serial.print("Password: ");
  Serial.println(apPassword);
  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("Web server started.");
}

bool loadAndConnectWiFi() {
  preferences.begin("medibox", true);
  wifiSsid = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("password", "");
  userUid = preferences.getString("uid", "");
  preferences.end();

  if (wifiSsid.isEmpty() || userUid.isEmpty()) return false;

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSsid.c_str(), wifiPassword.c_str());
  Serial.print("Connecting to Wi-Fi");
  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}
