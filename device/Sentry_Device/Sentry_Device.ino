#include <Arduino.h>
#include "MPU6050Handler.h"
#include "TiltDetection.h"
#include "GPSHandler.h"
#include "BluetoothHandler.h"

// Data collection variables
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 2500;  // Send every 2.5 seconds

// Tilt detection configuration
const float TILT_THRESHOLD = 60.0;  // degrees - adjust for sensitivity (lower = more sensitive)

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== SENTRY DEVICE INITIALIZING ===");

  // Initialize Bluetooth
  initBluetooth("Sentry-Device");

  // Initialize MPU6050
  initMPU();
  Serial.println("MPU6050 initialized");

  // Initialize GPS
  initGPS();
  Serial.println("GPS initialized - Waiting for satellite fix...");
  
  lastSendTime = millis();
  Serial.println("Device Ready - Waiting for Bluetooth connection...");
}

void loop() {
  // Handle Bluetooth reconnection
  handleBluetoothReconnection();
  
  // Update GPS data (must be called frequently to process NMEA sentences)
  updateGPS();

  // Read sensor data from MPU6050
  float ax, ay, az;
  readAccel(ax, ay, az);

  // Calculate tilt angles
  float roll, pitch;
  calculateTilt(ax, ay, az, roll, pitch);

  // Check if tilt exceeds threshold (accident detection)
  bool currentTilt = isTiltExceeded(roll, pitch, TILT_THRESHOLD);

  // Send data via Bluetooth every SEND_INTERVAL milliseconds
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    if (isBluetoothConnected()) {
      // Send real sensor data from MPU6050
      sendSensorData(ax, ay, az, roll, pitch, currentTilt);
      
      if (currentTilt) {
        Serial.println("BLE: ⚠️ ACCIDENT DETECTED! Sensor data sent");
      } else {
        Serial.println("BLE: Sensor data sent");
      }
      
      // Get GPS data
      bool gpsFix = isValidLocation();
      int satellites = getSatellites();
      float latitude = getLatitude();
      float longitude = getLongitude();
      float altitude = getAltitude();
      
      // Send real GPS data
      sendGPSData(gpsFix, satellites, latitude, longitude, altitude);
      if (gpsFix) {
        Serial.print("BLE: GPS data sent - Lat: ");
        Serial.print(latitude, 6);
        Serial.print(", Lng: ");
        Serial.print(longitude, 6);
        Serial.print(", Sats: ");
        Serial.println(satellites);
      } else {
        Serial.println("BLE: GPS data sent - No fix yet");
      }
      
      // Send device status (no WiFi status needed, use real GPS fix)
      sendDeviceStatus(false, gpsFix, -1);
      Serial.println("BLE: Device status sent");
      
      Serial.println("---");
    } else {
      Serial.println("BLE: Waiting for connection...");
    }
    
    lastSendTime = currentTime;
  }

  delay(500);
}