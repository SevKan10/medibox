#include <Arduino.h>
#include <time.h>
#include "medibox_config.h"
#include "medibox_firebase.h"

void initializeFirebase() {
  config.database_url = database_url;
  config.signer.test_mode = true;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

String firebaseDevicePath(const String& uid) {
  return "/users/" + uid + "/devices/" + deviceId;
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
