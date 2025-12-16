#include <Arduino.h>
#include "MPU6050Handler.h"
#include "WiFiHandler.h"
#include "TiltDetection.h"
#include "APIKeyStorage.h"
#include "ServerHandler.h"
#include "GPSHandler.h"

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

  // Initialize GPS
  initGPS();

  // Server setup
  if (!isAPIKeySet()) {
    setAPIKey(apiKey);
  }
  setBaseUrl(apiEndpoint);
  
  lastSendTime = millis();
  Serial.println("GPS Integration - JSON payloads will be printed to Serial (server sending disabled for GPS testing)");
}

void loop() {
  // Maintain WiFi connection
  maintainWiFiConnection(ssid, password);

  // Update GPS data
  updateGPS();

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
    // Build JSON payload with sensor and GPS data
    // Increased size to accommodate GPS data
    StaticJsonDocument<512> doc;
    
    // Sensor data
    doc["ax"] = ax;
    doc["ay"] = ay;
    doc["az"] = az;
    doc["roll"] = roll;
    doc["pitch"] = pitch;
    doc["tilt_detected"] = currentTilt;
    
    // GPS data (only include if valid)
    bool gpsFix = hasGPSFix();
    doc["gps_fix"] = gpsFix;
    doc["satellites"] = getSatellites();
    
    if (isValidLocation()) {
      doc["latitude"] = getLatitude();
      doc["longitude"] = getLongitude();
      float altitude = getAltitude();
      if (altitude != 0.0) {
        doc["altitude"] = altitude;
      }
    } else {
      // Set GPS fields to null when no valid fix
      doc["latitude"] = nullptr;
      doc["longitude"] = nullptr;
      doc["altitude"] = nullptr;
    }
    
    // Optional: add device_id and timestamp if needed
    // doc["device_id"] = "ESP32_001";
    // doc["timestamp"] = millis();
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Print JSON to Serial Monitor (server sending disabled for GPS testing phase)
    Serial.println("--- JSON Payload ---");
    Serial.println(jsonPayload);
    Serial.println("--- End JSON ---");
    
    // GPS status info
    if (gpsFix) {
      Serial.print("GPS Fix: YES | Satellites: ");
      Serial.print(getSatellites());
      if (isValidLocation()) {
        Serial.print(" | Lat: ");
        Serial.print(getLatitude(), 6);
        Serial.print(", Lon: ");
        Serial.print(getLongitude(), 6);
      }
      Serial.println();
    } else {
      Serial.println("GPS Fix: NO - Waiting for satellite lock...");
    }
    
    lastSendTime = currentTime;
  }

  delay(500); // adjust loop speed
}