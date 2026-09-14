#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WebServer.h>
#include <Preferences.h>
#include <time.h>
#include <esp_mac.h>
#include <esp_system.h>

#define batPin 34
#define LED 2

const char* database_url = "medibox-123b2-default-rtdb.asia-southeast1.firebasedatabase.app";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastMsgTime = 0;
const long interval = 10000; //10 seconds

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
  for (int i = 0; i < 10; i++) {
    sum += analogRead(batPin);
    delay(2);
  }

  int rawADC = sum / 10;
  int batteryPercent = map(rawADC, 2640, 3475, 0, 100);
  batteryPercent = constrain(batteryPercent, 0, 100);
  digitalWrite(LED, batteryPercent <= 20 ? HIGH : LOW);
  Serial.printf("Battery Percent: %d%%\n", batteryPercent);
  return batteryPercent;
}

void initializeFirebase() {
  config.database_url = database_url;
  config.signer.test_mode = true;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

String htmlEscape(const String& value) {
  String escaped = value;
  escaped.replace("&", "&amp;");
  escaped.replace("<", "&lt;");
  escaped.replace(">", "&gt;");
  escaped.replace("\"", "&quot;");
  return escaped;
}

String deviceIdFromMac() {
  String id = macAddress;
  id.replace(":", "");
  id.toUpperCase();
  String result = "device_";
  result += id;
  return result;
}

String firebaseDevicePath(const String& uid) {
  String path = "/users/";
  path += uid;
  path += "/devices/";
  path += deviceId;
  return path;
}

void fillStateJson(FirebaseJson& stateJson) {
  time_t nowEpoch = time(nullptr);
  stateJson.set("schema_version", 1);
  stateJson.set("reported_at", static_cast<long>(nowEpoch));
  stateJson.set("last_seen", static_cast<long>(nowEpoch));
  stateJson.set("connection", "online");
  stateJson.set("lock", "unknown");
  stateJson.set("medicine/last_action", "none");
  stateJson.set("medicine/last_slot_id", 0);
  stateJson.set("medicine/last_dose_id", "");
  stateJson.set("medicine/last_action_at", 0);
  stateJson.set("battery/percent", readBatteryPercent());
  stateJson.set("battery/charging", false);
  stateJson.set("sensors/door_open", false);
  stateJson.set("sensors/pill_detected", false);
  FirebaseJsonArray faults;
  stateJson.add("faults", faults);
}

void fillMetaJson(FirebaseJson& metaJson, time_t nowEpoch) {
  metaJson.set("schema_version", 1);
  metaJson.set("device_id", deviceId);
  metaJson.set("mac_address", macAddress);
  metaJson.set("model", "medibox-v2");
  metaJson.set("firmware_version", "1.0.0");
  metaJson.set("timezone", "Asia/Ho_Chi_Minh");
  metaJson.set("lifecycle", "active");
  metaJson.set("registered_at", static_cast<long>(nowEpoch));
  metaJson.set("last_boot_at", static_cast<long>(nowEpoch));
  metaJson.add("deleted_at");
}

void handleSetupPage() {
  String page = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                "<title>Medibox setup</title></head><body><h2>Medibox setup</h2>";
  page += "<p>MAC: <b>";
  page += macAddress;
  page += "</b></p><p>Device ID: <b>";
  page += deviceId;
  page += "</b></p><form method='POST' action='/save'>"
          "<label>Wi-Fi name (SSID)</label><br><input name='ssid' required><br><br>"
          "<label>Wi-Fi password</label><br><input name='password' type='password'><br><br>"
          "<label>Firebase User UID</label><br><input name='uid' required><br><br>"
          "<button type='submit'>Register device</button></form>"
          "<p>UID must belong to the Firebase user that owns this device.</p></body></html>";
  setupServer.send(200, "text/html; charset=utf-8", page);
}

void sendSetupResult(const String& title, const String& message) {
  String page = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                "<meta http-equiv='refresh' content='5;url=/'>"
                "<title>Medibox setup</title></head><body><h2>";
  page += htmlEscape(title);
  page += "</h2><p>";
  page += htmlEscape(message);
  page += "</p><p>ESP32 sẽ khởi động lại sau 5 giây.</p></body></html>";
  setupServer.send(200, "text/html; charset=utf-8", page);
  delay(1500);
  ESP.restart();
}

bool connectToRequestedWiFi(const String& requestedSsid, const String& requestedPassword) {
  WiFi.begin(requestedSsid.c_str(), requestedPassword.c_str());

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

void handleSaveSetup() {
  if (!setupServer.hasArg("ssid") || !setupServer.hasArg("uid")) {
    setupServer.send(400, "text/plain", "SSID and UID are required");
    return;
  }

  String requestedSsid = setupServer.arg("ssid");
  String requestedPassword = setupServer.arg("password");
  String requestedUid = setupServer.arg("uid");

  if (!connectToRequestedWiFi(requestedSsid, requestedPassword)) {
    Serial.println("Không kết nối được Wi-Fi đã nhập.");
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Không kết nối được Wi-Fi</h2>"
                     "<p>Kiểm tra SSID và mật khẩu rồi thử lại.</p>"
                     "<p>Thiết bị vẫn đang phát mạng MEDIBOX.</p>");
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
                     "<h2>Không kết nối được Firebase</h2>"
                     "<p>Kiểm tra mạng Internet và Firebase rồi thử lại.</p>");
    return;
  }

  time_t nowEpoch = time(nullptr);
  String requestedDevicePath = firebaseDevicePath(requestedUid);
  FirebaseJson metaJson;
  fillMetaJson(metaJson, nowEpoch);
  String requestedMetaPath = requestedDevicePath;
  requestedMetaPath += "/meta";
  if (!Firebase.RTDB.setJSON(&fbdo, requestedMetaPath.c_str(), &metaJson)) {
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Đăng ký thất bại</h2>"
                     "<p>Không thể lưu meta lên Firebase. Kiểm tra quyền database.</p>");
    return;
  }

  FirebaseJson stateJson;
  fillStateJson(stateJson);
  String requestedStatePath = requestedDevicePath;
  requestedStatePath += "/state";
  if (!Firebase.RTDB.setJSON(&fbdo, requestedStatePath.c_str(), &stateJson)) {
    setupServer.send(503, "text/html; charset=utf-8",
                     "<h2>Đăng ký thất bại</h2>"
                     "<p>Không thể lưu state lên Firebase. Vui lòng thử lại.</p>");
    return;
  }

  preferences.begin("medibox", false);
  preferences.putString("ssid", requestedSsid);
  preferences.putString("password", requestedPassword);
  preferences.putString("uid", requestedUid);
  preferences.end();

  Serial.println("Đăng ký thành công, thiết bị sẽ khởi động lại.");
  delay(1000);
  ESP.restart();
}

void startSetupMode() {
    setupMode = true;

    String apName = "MEDIBOX-";
    apName += macAddress.substring(macAddress.length() - 5);

    String apPassword = "setup";
    apPassword += macAddress.substring(macAddress.length() - 6);

    // Reset Wi-Fi state before starting the setup AP.
    WiFi.disconnect(true);
    delay(500);
    WiFi.mode(WIFI_AP);
    delay(500);
    WiFi.setSleep(false);

    // IP của ESP32
    IPAddress local_ip(192, 168, 4, 1);
    IPAddress gateway(192, 168, 4, 1);
    IPAddress subnet(255, 255, 255, 0);

    WiFi.softAPConfig(local_ip, gateway, subnet);

    // Kênh 1, không ẩn SSID, tối đa 4 thiết bị
    bool apStarted = WiFi.softAP(
        apName.c_str(),
        apPassword.c_str(),
        1,
        false,
        4
    );

    Serial.println("=== SETUP MODE ===");

    if (!apStarted) {
        Serial.println("ERROR: Không thể khởi động AP!");
        return;
    }

    Serial.print("AP: ");
    Serial.println(apName);

    Serial.print("Password: ");
    Serial.println(apPassword);

    Serial.print("IP: ");
    Serial.println(WiFi.softAPIP());

    Serial.print("AP MAC: ");
    Serial.println(WiFi.softAPmacAddress());

    setupServer.on("/", HTTP_GET, handleSetupPage);
    setupServer.on("/save", HTTP_POST, handleSaveSetup);

    setupServer.onNotFound([]() {
        setupServer.sendHeader("Location", "/");
        setupServer.send(302);
    });

    setupServer.begin();

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

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.print("Reset reason: ");
  Serial.println(resetReasonName(esp_reset_reason()));
  pinMode(batPin, INPUT);
  pinMode(LED, OUTPUT);

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

  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Đang đồng bộ thời gian NTP...");

  initializeFirebase();
  Serial.println("Firebase đã khởi động.");
  deviceBasePath = firebaseDevicePath(userUid);
  statePath = deviceBasePath;
  statePath += "/state";
  lastMsgTime = millis() - interval;
}

void loop() {
  if (setupMode) {
    setupServer.handleClient();
    return;
  }

  unsigned long now = millis();
  if (now - lastMsgTime > interval) {
    lastMsgTime = now;
    if (!Firebase.ready()) {
      Serial.println("Firebase chưa sẵn sàng, đang chờ xác thực...");
      return;
    }

    time_t nowEpoch = time(nullptr);
    if (nowEpoch < 1000000000) {
      Serial.println("Chưa lấy được Unix timestamp, bỏ qua cập nhật trạng thái.");
      return;
    }

    FirebaseJson stateJson;
    fillStateJson(stateJson);
    if (Firebase.RTDB.setJSON(&fbdo, statePath.c_str(), &stateJson)) {
      Serial.println("Đã lưu status lên Firebase.");
    } else {
      Serial.print("Lỗi ghi status: ");
      Serial.println(fbdo.errorReason());
    }
  }
}