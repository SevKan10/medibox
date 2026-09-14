#include <WiFi.h>

// Đặt tên Wi-Fi (SSID) và mật khẩu cho ESP32-S3 phát ra
const char *ssid = "ESP32-S3-AP";
const char *password = "12345678"; // Mật khẩu tối thiểu 8 ký tự

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Đang khởi tạo mạng Wi-Fi Access Point...");
  
  // Kích hoạt chế độ Soft-AP
  bool success = WiFi.softAP(ssid, password);
  
  if (success) {
    Serial.println("Khởi tạo AP thành công!");
  } else {
    Serial.println("Khởi tạo AP thất bại!");
    return;
  }

  // In địa chỉ IP của Access Point lên Serial Monitor
  IPAddress myIP = WiFi.softAPIP();
  Serial.print("Địa chỉ IP của AP: ");
  Serial.println(myIP);
}

void loop() {
  // Kiểm tra số lượng thiết bị đang kết nối (nếu cần)
  // Serial.printf("Số thiết bị đang kết nối: %d\n", WiFi.softAPgetStationNum());
  delay(5000);
}