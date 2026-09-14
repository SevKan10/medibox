#pragma once

#include <Firebase_ESP_Client.h>

void initializeFirebase();
String firebaseDevicePath(const String& uid);
void fillStateJson(FirebaseJson& stateJson);
void fillMetaJson(FirebaseJson& metaJson, time_t nowEpoch);
