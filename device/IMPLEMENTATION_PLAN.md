# Sentry Device Implementation Plan

## Overview
This document outlines the implementation plan for the Sentry bicycle accident detection device. The device uses Bluetooth Low Energy (BLE) to communicate with a mobile client (cellphone), MPU6050 for tilt/accident detection, and Neo 6M GPS module for location tracking.

---

## System Architecture

### Communication Flow
```
Device (ESP32) → Bluetooth BLE → Client (Cellphone)
```

### Components
1. **ESP32 Microcontroller** - Main processing unit
2. **MPU6050** - Accelerometer/Gyroscope for tilt detection
3. **Neo 6M GPS Module** - GPS location tracking
4. **Bluetooth BLE** - Wireless communication with client

---

## 1. Bluetooth Communication

### Current Status
- Bluetooth handler is already implemented (`BluetoothHandler.cpp`/`BluetoothHandler.h`)
- BLE service and characteristics are configured
- Data transmission functions are available

### Implementation Tasks
1. **Enable Bluetooth in main sketch**
   - Uncomment `#include "BluetoothHandler.h"` (already done)
   - Ensure `initBluetooth("Sentry-Device")` is called in `setup()`
   - Keep `handleBluetoothReconnection()` in `loop()`

2. **Data Transmission**
   - Use `sendSensorData()` for MPU6050 readings
   - Use `sendGPSData()` for GPS location
   - Use `sendDeviceStatus()` for device health status

3. **Remove WiFi Dependencies**
   - Remove/comment out WiFi-related includes and functions
   - Remove WiFi connection logic from `setup()` and `loop()`
   - Remove WiFi status from device status messages

---

## 2. MPU6050 Tilt Detection

### How It Works
The MPU6050 measures acceleration on three axes (X, Y, Z). When the bicycle tilts beyond a threshold angle, it indicates a potential accident.

### Tilt Calculation
- **Roll**: Rotation around X-axis (sideways tilt)
- **Pitch**: Rotation around Y-axis (forward/backward tilt)
- Calculated using: `atan2()` function on accelerometer readings

### Adjusting Tilt Detection Sensitivity

#### Location: `TiltDetection.cpp` - `isTiltExceeded()` function

**Current Implementation:**
```cpp
bool isTiltExceeded(float roll, float pitch, float threshold) {
    return (fabs(roll) > threshold || fabs(pitch) > threshold);
}
```

**How to Adjust Sensitivity:**

1. **In the main sketch (`Sentry_Device.ino`):**
   - Find the line where `isTiltExceeded()` is called
   - Currently: `isTiltExceeded(roll, pitch, 90.0)`
   - The third parameter (90.0) is the **threshold angle in degrees**

2. **Sensitivity Settings:**
   - **More Sensitive (detects smaller tilts):** Lower the threshold value
     - Example: `isTiltExceeded(roll, pitch, 45.0)` - Triggers at 45° tilt
     - Example: `isTiltExceeded(roll, pitch, 30.0)` - Triggers at 30° tilt
   
   - **Less Sensitive (only detects major accidents):** Raise the threshold value
     - Example: `isTiltExceeded(roll, pitch, 60.0)` - Triggers at 60° tilt
     - Example: `isTiltExceeded(roll, pitch, 75.0)` - Triggers at 75° tilt

3. **Recommended Values:**
   - **Normal riding:** 60-75° (allows normal leaning in turns)
   - **Sensitive detection:** 45-60° (catches minor accidents)
   - **Very sensitive:** 30-45° (may have false positives during aggressive riding)

4. **Advanced: Separate Thresholds for Roll and Pitch**
   - You can modify `TiltDetection.cpp` to have separate thresholds:
   ```cpp
   bool isTiltExceeded(float roll, float pitch, float rollThreshold, float pitchThreshold) {
       return (fabs(roll) > rollThreshold || fabs(pitch) > pitchThreshold);
   }
   ```

### Implementation Tasks
1. **Uncomment MPU6050 includes and initialization**
   - Uncomment `#include "MPU6050Handler.h"` and `#include "TiltDetection.h"`
   - Uncomment `initMPU()` in `setup()`

2. **Read sensor data in loop**
   - Uncomment accelerometer reading: `readAccel(ax, ay, az)`
   - Uncomment tilt calculation: `calculateTilt(ax, ay, az, roll, pitch)`
   - Uncomment tilt detection: `isTiltExceeded(roll, pitch, THRESHOLD_ANGLE)`

3. **Send detection to client**
   - When `isTiltExceeded()` returns `true`, send alert via Bluetooth
   - Include tilt data (roll, pitch) in the sensor data transmission

---

## 3. Neo 6M GPS Module

### Current Status
- GPS handler is implemented (`GPSHandler.cpp`/`GPSHandler.h`)
- Uses Hardware Serial 2 (GPIO 16 = RX, GPIO 17 = TX)
- Baud rate: 9600 (default for Neo 6M)

### GPS Data Available
- **Latitude** - `getLatitude()`
- **Longitude** - `getLongitude()`
- **Altitude** - `getAltitude()`
- **Satellite Count** - `getSatellites()`
- **GPS Fix Status** - `hasGPSFix()`, `isValidLocation()`

### Implementation Tasks
1. **Uncomment GPS initialization**
   - Uncomment `#include "GPSHandler.h"`
   - Uncomment `initGPS()` in `setup()`

2. **Update GPS data in loop**
   - Uncomment `updateGPS()` in `loop()`
   - This must be called frequently to process incoming NMEA sentences

3. **Send GPS data to client**
   - Use `sendGPSData()` function
   - Parameters: `sendGPSData(gpsFix, satellites, latitude, longitude, altitude)`
   - Send GPS data periodically (e.g., every 3-5 seconds) or when location changes

4. **Handle GPS fix status**
   - Check `hasGPSFix()` or `isValidLocation()` before sending coordinates
   - Send `false` for GPS fix if no valid location available

---

## 4. WiFi Removal

### Files to Review/Remove
The following files contain WiFi-related code that should be removed or disabled:

1. **`WiFiHandler.cpp`** / **`WiFiHandler.h`**
   - Remove or keep commented out
   - Contains WiFi connection functions

2. **`ServerHandler.cpp`** / **`ServerHandler.h`**
   - Remove or keep commented out
   - Contains HTTP server communication (not needed for Bluetooth-only)

3. **`APIKeyStorage.cpp`** / **`APIKeyStorage.h`**
   - Remove or keep commented out
   - Used for API authentication (not needed for Bluetooth)

4. **`secrets.h`**
   - Remove WiFi credentials if no longer needed
   - Or keep for future reference

### Code Cleanup in Main Sketch
1. Remove/comment out WiFi includes:
   ```cpp
   // #include "WiFiHandler.h"
   // #include "ServerHandler.h"
   // #include "APIKeyStorage.h"
   ```

2. Remove WiFi connection code from `setup()`:
   ```cpp
   // connectWiFi(ssid, password);
   ```

3. Remove WiFi maintenance from `loop()`:
   ```cpp
   // maintainWiFiConnection(ssid, password);
   ```

4. Update `sendDeviceStatus()` calls:
   - Change `wifiConnected` parameter to `false` or remove WiFi status entirely

---

## 5. Implementation Steps

### Step 1: Clean Up Main Sketch
- [ ] Remove/comment WiFi-related includes
- [ ] Remove WiFi initialization and maintenance code
- [ ] Keep Bluetooth initialization

### Step 2: Enable MPU6050
- [ ] Uncomment MPU6050 includes
- [ ] Uncomment `initMPU()` in `setup()`
- [ ] Uncomment sensor reading code in `loop()`
- [ ] Uncomment tilt calculation and detection
- [ ] **Set tilt threshold** (adjust sensitivity as needed)
- [ ] Integrate tilt detection with Bluetooth transmission

### Step 3: Enable GPS
- [ ] Uncomment GPS includes
- [ ] Uncomment `initGPS()` in `setup()`
- [ ] Uncomment `updateGPS()` in `loop()`
- [ ] Integrate GPS data with Bluetooth transmission
- [ ] Handle GPS fix status properly

### Step 4: Integrate All Components
- [ ] Combine sensor data (MPU6050) with GPS data
- [ ] Send combined data via Bluetooth when connected
- [ ] Implement accident detection logic:
  - When tilt exceeds threshold → send alert with GPS location
  - Send periodic updates (sensor + GPS) every few seconds

### Step 5: Testing
- [ ] Test Bluetooth connection with client app
- [ ] Test MPU6050 readings and tilt detection
- [ ] Test GPS data acquisition and transmission
- [ ] Test accident detection trigger
- [ ] Adjust tilt sensitivity if needed

### Step 6: Remove Unused Files (Optional)
- [ ] Delete or archive WiFi-related files if not needed
- [ ] Clean up unused includes and dependencies

---

## 6. Data Flow Example

### Normal Operation (Every 3 seconds)
```cpp
1. Read MPU6050 → (ax, ay, az)
2. Calculate tilt → (roll, pitch)
3. Check tilt threshold → (tiltDetected = false)
4. Update GPS → (latitude, longitude, altitude)
5. Send via Bluetooth:
   - Sensor data: (ax, ay, az, roll, pitch, tiltDetected=false)
   - GPS data: (gpsFix=true, satellites, lat, lng, alt)
```

### Accident Detected
```cpp
1. Read MPU6050 → (ax, ay, az)
2. Calculate tilt → (roll, pitch)
3. Check tilt threshold → (tiltDetected = true) ⚠️
4. Update GPS → (latitude, longitude, altitude)
5. Send ALERT via Bluetooth:
   - Sensor data: (ax, ay, az, roll, pitch, tiltDetected=true)
   - GPS data: (gpsFix=true, satellites, lat, lng, alt)
   - Device status: (battery, etc.)
```

---

## 7. Configuration Constants

### Recommended Settings

**Tilt Detection:**
```cpp
const float TILT_THRESHOLD = 60.0;  // degrees (adjust for sensitivity)
```

**Data Transmission:**
```cpp
const unsigned long SEND_INTERVAL = 3000;  // Send every 3 seconds
```

**GPS Update:**
```cpp
// Call updateGPS() every loop iteration (no delay needed)
```

---

## 8. Troubleshooting

### MPU6050 Not Detecting Tilt
- Check I2C connections (SDA=GPIO 21, SCL=GPIO 22)
- Verify sensor initialization
- Adjust threshold value (may be too high)
- Check if Kalman filter is working correctly

### GPS Not Getting Fix
- Ensure GPS module has clear view of sky
- Wait 30-60 seconds for first fix
- Check Serial2 connections (RX=GPIO 16, TX=GPIO 17)
- Verify baud rate is 9600

### Bluetooth Not Connecting
- Check if device is advertising (visible in phone's BLE scanner)
- Verify service UUIDs match between device and client
- Check if client app has proper permissions

---

## Notes
- This plan assumes Bluetooth handler is already functional
- All sensor and GPS handlers are implemented and ready to use
- Main task is to integrate components and remove WiFi dependencies
- Tilt sensitivity can be fine-tuned based on real-world testing

