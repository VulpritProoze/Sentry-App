#include <Arduino.h>
#include "MPU6050Handler.h"
#include "WiFiHandler.h"
#include "TiltDetection.h"
#include "APIKeyStorage.h"
#include "ServerHandler.h"
#include <ArduinoJson.h>
#include "secrets.h"

// Data collection variables
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000;  // Send every 5 seconds

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  connectWiFi(ssid, password);

  // Initialize MPU6050
  initMPU();

  // Server setup
  if (!isAPIKeySet()) {
    setAPIKey(apiKey);
  }
  setBaseUrl(apiEndpoint);
  
  lastSendTime = millis();
  Serial.println("Server mode - JSON payloads will be sent to API and printed to Serial");
}

void loop() {
  // Maintain WiFi connection
  maintainWiFiConnection(ssid, password);

  float ax, ay, az;
  readAccel(ax, ay, az);

  // Calculate tilt
  float roll, pitch;
  calculateTilt(ax, ay, az, roll, pitch);

  // Check tilt detection (90 degree threshold)
  bool currentTilt = isTiltExceeded(roll, pitch, 90.0);

  // Serial output for roll, pitch, and tilt detection
  Serial.print("Roll: "); 
  Serial.print(roll);
  Serial.print("°, Pitch: "); 
  Serial.print(pitch);
  Serial.print("°, Tilt Detected: ");
  Serial.println(currentTilt ? "YES" : "NO");

  // Build and print JSON payload every SEND_INTERVAL milliseconds
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    // Build JSON payload matching API schema (DeviceDataRequest)
    StaticJsonDocument<256> doc;
    doc["ax"] = ax;
    doc["ay"] = ay;
    doc["az"] = az;
    doc["roll"] = roll;
    doc["pitch"] = pitch;
    doc["tilt_detected"] = currentTilt;
    // Optional: add device_id and timestamp if needed
    // doc["device_id"] = "ESP32_001";
    // doc["timestamp"] = millis();
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Print JSON to Serial for debugging
    Serial.println("--- JSON Payload ---");
    Serial.println(jsonPayload);
    Serial.println("--- End JSON ---");
    
    // Send data to server
    if (isWiFiConnected()) {
      if (postJson("/data", jsonPayload)) {
        Serial.println("Data sent to /data endpoint");
      } else {
        Serial.println("Failed to send data");
      }
    } else {
      Serial.println("WiFi not connected, skipping data send");
    }
    
    lastSendTime = currentTime;
  }

  delay(500); // adjust loop speed
}