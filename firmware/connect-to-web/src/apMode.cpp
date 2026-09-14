#include <WiFi.h>

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("=== ESP32 AP TEST ===");

    WiFi.disconnect(true);
    delay(500);

    WiFi.mode(WIFI_AP);
    delay(500);

    WiFi.setSleep(false);

    IPAddress local_ip(192, 168, 4, 1);
    IPAddress gateway(192, 168, 4, 1);
    IPAddress subnet(255, 255, 255, 0);

    WiFi.softAPConfig(local_ip, gateway, subnet);

    bool result = WiFi.softAP(
        "MEDIBOX-TEST",
        "12345678",
        1,
        false,
        4
    );

    Serial.print("AP start: ");
    Serial.println(result ? "OK" : "FAILED");

    Serial.print("SSID: ");
    Serial.println(WiFi.softAPSSID());

    Serial.print("IP: ");
    Serial.println(WiFi.softAPIP());

    Serial.print("MAC: ");
    Serial.println(WiFi.softAPmacAddress());
}

void loop() {
    Serial.print("Clients: ");
    Serial.println(WiFi.softAPgetStationNum());

    delay(1000);
}