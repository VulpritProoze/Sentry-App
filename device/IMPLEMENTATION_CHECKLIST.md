# Sentry Device Implementation Checklist

Use this checklist to track your progress while implementing the Bluetooth-based accident detection system.

---

## Phase 1: Code Cleanup (Remove WiFi)

### Main Sketch Cleanup
- [ ] Open `Sentry_Device.ino`
- [ ] Comment out or remove WiFi-related includes:
  - [ ] `#include "WiFiHandler.h"`
  - [ ] `#include "ServerHandler.h"`
  - [ ] `#include "APIKeyStorage.h"`
- [ ] Comment out WiFi connection code in `setup()`:
  - [ ] `connectWiFi(ssid, password);`
- [ ] Comment out WiFi maintenance in `loop()`:
  - [ ] `maintainWiFiConnection(ssid, password);`
- [ ] Update `sendDeviceStatus()` calls to remove WiFi status

### Optional: Remove WiFi Files
- [ ] Decide if you want to delete WiFi-related files (or keep for reference)
- [ ] If deleting:
  - [ ] Delete `WiFiHandler.cpp` and `WiFiHandler.h`
  - [ ] Delete `ServerHandler.cpp` and `ServerHandler.h`
  - [ ] Delete `APIKeyStorage.cpp` and `APIKeyStorage.h`
  - [ ] Delete or archive `secrets.h` (if no longer needed)

---

## Phase 2: Enable MPU6050 Tilt Detection

### Includes and Initialization
- [ ] Uncomment `#include "MPU6050Handler.h"` in main sketch
- [ ] Uncomment `#include "TiltDetection.h"` in main sketch
- [ ] Uncomment `initMPU()` in `setup()` function
- [ ] Verify I2C pins are correct (SDA=GPIO 21, SCL=GPIO 22)

### Sensor Reading in Loop
- [ ] Uncomment accelerometer variable declarations:
  - [ ] `float ax, ay, az;`
- [ ] Uncomment `readAccel(ax, ay, az);` in `loop()`
- [ ] Uncomment tilt calculation:
  - [ ] `float roll, pitch;`
  - [ ] `calculateTilt(ax, ay, az, roll, pitch);`

### Tilt Detection Configuration
- [ ] Uncomment tilt detection check:
  - [ ] `bool currentTilt = isTiltExceeded(roll, pitch, THRESHOLD);`
- [ ] **Set tilt threshold sensitivity:**
  - [ ] Choose threshold value (recommended: 60.0 degrees)
  - [ ] Replace `90.0` with your chosen value
  - [ ] Test and adjust if needed:
    - [ ] Too sensitive? → Increase threshold (e.g., 75.0)
    - [ ] Not sensitive enough? → Decrease threshold (e.g., 45.0)

### Integration with Bluetooth
- [ ] Replace test sensor data with real MPU6050 readings
- [ ] Update `sendSensorData()` call to use real values:
  - [ ] `sendSensorData(ax, ay, az, roll, pitch, currentTilt);`
- [ ] Verify tilt detection status is sent correctly

---

## Phase 3: Enable GPS (Neo 6M)

### Includes and Initialization
- [ ] Uncomment `#include "GPSHandler.h"` in main sketch
- [ ] Uncomment `initGPS()` in `setup()` function
- [ ] Verify Serial2 pins are correct (RX=GPIO 16, TX=GPIO 17)
- [ ] Verify baud rate is 9600 (default for Neo 6M)

### GPS Data Updates
- [ ] Uncomment `updateGPS()` in `loop()` function
- [ ] Ensure `updateGPS()` is called every loop iteration (no delay blocking it)

### GPS Data Transmission
- [ ] Replace test GPS data with real GPS readings
- [ ] Get GPS values:
  - [ ] `bool gpsFix = hasGPSFix();` or `isValidLocation();`
  - [ ] `int satellites = getSatellites();`
  - [ ] `float latitude = getLatitude();`
  - [ ] `float longitude = getLongitude();`
  - [ ] `float altitude = getAltitude();`
- [ ] Update `sendGPSData()` call:
  - [ ] `sendGPSData(gpsFix, satellites, latitude, longitude, altitude);`
- [ ] Handle case when GPS has no fix (send `false` for gpsFix)

---

## Phase 4: Integration and Logic

### Combine All Components
- [ ] Ensure all three components work together:
  - [ ] MPU6050 readings
  - [ ] GPS location
  - [ ] Bluetooth transmission
- [ ] Verify data is sent at correct intervals (every 3 seconds)

### Accident Detection Logic
- [ ] Implement accident detection trigger:
  - [ ] When `currentTilt == true`, send alert immediately
  - [ ] Include GPS location in accident alert
  - [ ] Optionally: Send multiple alerts or mark as priority

### Data Flow Verification
- [ ] Normal operation: Send sensor + GPS data every 3 seconds
- [ ] Accident detected: Send alert with tilt status + GPS location
- [ ] Verify all data reaches client correctly

---

## Phase 5: Testing

### Hardware Connections
- [ ] Verify MPU6050 connections:
  - [ ] VCC → 3.3V
  - [ ] GND → GND
  - [ ] SDA → GPIO 21
  - [ ] SCL → GPIO 22
- [ ] Verify Neo 6M GPS connections:
  - [ ] VCC → 5V (or 3.3V depending on module)
  - [ ] GND → GND
  - [ ] RX → GPIO 17 (TX from ESP32)
  - [ ] TX → GPIO 16 (RX to ESP32)
- [ ] Verify ESP32 power supply is adequate

### Bluetooth Testing
- [ ] Upload code to ESP32
- [ ] Open Serial Monitor (115200 baud)
- [ ] Verify device advertises as "Sentry-Device"
- [ ] Connect with client app/phone
- [ ] Verify connection is established
- [ ] Check if data is being received on client side

### MPU6050 Testing
- [ ] Verify accelerometer readings in Serial Monitor
- [ ] Test tilt detection:
  - [ ] Tilt device gently → should NOT trigger (if threshold is appropriate)
  - [ ] Tilt device beyond threshold → should trigger
- [ ] Adjust threshold if needed based on testing
- [ ] Verify roll and pitch values are reasonable

### GPS Testing
- [ ] Place device with clear view of sky
- [ ] Wait 30-60 seconds for GPS fix
- [ ] Verify GPS fix status in Serial Monitor
- [ ] Check if latitude/longitude values are valid
- [ ] Verify satellite count is > 0 when fix is acquired
- [ ] Test GPS data transmission via Bluetooth

### Integration Testing
- [ ] Test normal operation (no accident):
  - [ ] Device sends sensor + GPS data every 3 seconds
  - [ ] All data appears correctly on client
- [ ] Test accident detection:
  - [ ] Simulate accident (tilt device beyond threshold)
  - [ ] Verify alert is sent immediately
  - [ ] Verify GPS location is included in alert
  - [ ] Check client receives and displays alert correctly

### Real-World Testing
- [ ] Test on actual bicycle (if applicable)
- [ ] Verify tilt detection works during normal riding
- [ ] Test accident simulation (carefully!)
- [ ] Verify GPS accuracy and update rate
- [ ] Test Bluetooth range and stability
- [ ] Check battery consumption (if battery-powered)

---

## Phase 6: Fine-Tuning

### Tilt Sensitivity Adjustment
- [ ] Test different threshold values:
  - [ ] Start with 60.0 degrees
  - [ ] Test during normal riding
  - [ ] Adjust based on false positives/negatives
- [ ] Document final threshold value chosen
- [ ] Note any special considerations (e.g., mountain biking needs different threshold)

### Data Transmission Optimization
- [ ] Adjust `SEND_INTERVAL` if needed:
  - [ ] Too frequent? → Increase interval (e.g., 5000ms)
  - [ ] Too slow? → Decrease interval (e.g., 2000ms)
- [ ] Consider sending GPS less frequently than sensor data
- [ ] Optimize for battery life if needed

### Error Handling
- [ ] Add error handling for sensor failures
- [ ] Add error handling for GPS timeout
- [ ] Add error handling for Bluetooth disconnection
- [ ] Implement reconnection logic (if not already present)

---

## Phase 7: Documentation and Cleanup

### Code Documentation
- [ ] Add comments explaining tilt threshold value
- [ ] Document any custom configurations
- [ ] Add comments for accident detection logic
- [ ] Document GPS update requirements

### Final Cleanup
- [ ] Remove any test/debug code
- [ ] Remove commented-out code if no longer needed
- [ ] Verify all includes are necessary
- [ ] Check for unused variables or functions

### Final Verification
- [ ] Code compiles without errors
- [ ] Code compiles without warnings (if possible)
- [ ] All components work together
- [ ] Client receives all data correctly
- [ ] Accident detection works as expected

---

## Quick Reference: Key Values to Configure

### Tilt Threshold (in `Sentry_Device.ino`)
```cpp
// Current: isTiltExceeded(roll, pitch, 90.0)
// Recommended: isTiltExceeded(roll, pitch, 60.0)
// Adjust based on testing:
//   - More sensitive: 45.0
//   - Less sensitive: 75.0
```

### Data Send Interval (in `Sentry_Device.ino`)
```cpp
const unsigned long SEND_INTERVAL = 3000;  // milliseconds
```

### GPS Update
```cpp
// Call updateGPS() every loop iteration
// No delay needed - it processes available data
```

---

## Notes Section

Use this space to note any issues, solutions, or important findings:

```
Date: ___________
Issue: 
Solution: 

Date: ___________
Issue: 
Solution: 

Date: ___________
Issue: 
Solution: 
```

---

**Status Tracking:**
- Total Items: ___
- Completed: ___
- Remaining: ___
- Progress: ___%

**Last Updated:** ___________
