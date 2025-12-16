# Neo 6M GPS Module Integration Plan

## Overview
This document outlines the plan to integrate the Neo 6M GPS module into the Sentry Device system. The GPS module will provide location data (latitude, longitude, altitude) to complement the existing tilt detection functionality. **This implementation focuses on local testing and Serial output only - server integration will be handled in a future phase.**

## Implementation Checklist

### Phase 1: Hardware Setup & Testing
- [ ] Acquire Neo 6M GPS module
- [ ] Acquire jumper wires for connections
- [ ] (Optional) Acquire external GPS antenna
- [ ] Verify Neo 6M module voltage requirements (3.3V or 5V)
- [ ] Connect VCC to ESP32 (3.3V or 5V as per module specs)
- [ ] Connect GND to ESP32 GND
- [ ] Connect Neo 6M TX to ESP32 GPIO 17 (RX2)
- [ ] Connect Neo 6M RX to ESP32 GPIO 16 (TX2)
- [ ] Connect antenna (built-in or external)
- [ ] Verify all connections are secure
- [ ] Create basic GPS test sketch
- [ ] Upload test sketch to ESP32
- [ ] Open Serial Monitor (115200 baud)
- [ ] Verify NMEA sentences appear in Serial output
- [ ] Test outdoors for GPS fix acquisition
- [ ] Wait for first GPS fix (30-60 seconds for cold start)
- [ ] Verify GPS coordinates are being received
- [ ] Note time to first fix (TTFF)
- [ ] Verify coordinate accuracy
- [ ] Test signal quality in different locations

### Phase 2: Software Setup
- [ ] Open Arduino IDE
- [ ] Navigate to Sketch → Include Library → Manage Libraries
- [ ] Search for "TinyGPS++"
- [ ] Install TinyGPS++ library
- [ ] Verify library installation successful

### Phase 3: Code Development - GPS Handler Module
- [x] Create `device/Sentry_Device/GPSHandler.h` file
- [x] Create `device/Sentry_Device/GPSHandler.cpp` file
- [x] Implement `initGPS()` function
- [x] Implement `hasGPSFix()` function
- [x] Implement `updateGPS()` function
- [x] Implement `getLatitude()` function
- [x] Implement `getLongitude()` function
- [x] Implement `getAltitude()` function
- [x] Implement `getSatellites()` function
- [x] Implement `isValidLocation()` function
- [x] Add serial communication setup (9600 baud)
- [x] Add NMEA sentence parsing logic
- [x] Add GPS fix status tracking
- [x] Add stale data detection (timeout handling)
- [x] Add coordinate validation logic
- [ ] Test GPS handler module independently
- [ ] Verify all functions return correct values

### Phase 4: Arduino Sketch Integration
- [x] Open `device/Sentry_Device/Sentry_Device.ino`
- [x] Add `#include "GPSHandler.h"` at top
- [x] Initialize GPS in `setup()` function
- [x] Add GPS update call in `loop()` function
- [x] Modify JSON payload creation to include GPS data
- [x] Add `latitude` field to JSON (only when valid)
- [x] Add `longitude` field to JSON (only when valid)
- [x] Add `altitude` field to JSON (only when valid)
- [x] Add `gps_fix` boolean field to JSON
- [x] Add `satellites` count field to JSON
- [x] Implement GPS data validity check before adding to JSON
- [x] Handle case when GPS has no fix (set gps_fix: false)
- [x] Ensure other sensor data still prints when GPS unavailable
- [x] Test GPS update frequency (1-2 second intervals)
- [x] Verify JSON payload structure is correct
- [x] Print JSON payload to Serial Monitor (do NOT send to server)
- [ ] Test with GPS fix available
- [ ] Test with GPS fix unavailable
- [ ] Verify Serial output shows GPS data correctly in JSON format
- [ ] Verify JSON is properly formatted and readable

**Note**: This phase focuses on local testing and Serial output only. Server integration will be implemented in a future phase.

## Hardware Requirements

### Components Needed
- **Neo 6M GPS Module** (with built-in antenna or external antenna)
- **ESP32 Development Board** (already in use)
- **Jumper wires** for connections
- **Optional**: External GPS antenna for better signal reception (especially indoors)

### Pin Connections
```
Neo 6M GPS Module → ESP32
---------------------------------
VCC              → 3.3V (or 5V if module supports it)
GND              → GND
RX               → GPIO 16 (TX2 - Hardware Serial)
TX               → GPIO 17 (RX2 - Hardware Serial)
```

**Note**: Neo 6M typically operates at 3.3V logic level. Some modules may require 5V for VCC but use 3.3V logic. Verify your module's specifications.

### Alternative Software Serial (if needed)
If hardware serial is unavailable:
```
Neo 6M TX → GPIO 4 (Software Serial RX)
Neo 6M RX → GPIO 5 (Software Serial TX)
```

## Software Dependencies

### Arduino Libraries Required
1. **TinyGPS++** - Recommended GPS parsing library
   - Install via: Arduino IDE → Sketch → Include Library → Manage Libraries → Search "TinyGPS++"
   - Alternative: **TinyGPS** (older version, less features)

### Library Installation
```bash
# Via Arduino IDE Library Manager
Tools → Manage Libraries → Search "TinyGPS++" → Install
```

## Implementation Steps

### Phase 1: Hardware Setup & Testing
1. **Physical Connections**
   - Connect Neo 6M to ESP32 according to pin mapping above
   - Ensure proper power supply (3.3V or 5V as per module specs)
   - Connect antenna (built-in or external)

2. **Basic GPS Test**
   - Create a simple test sketch to verify GPS communication
   - Check Serial output for NMEA sentences
   - Verify GPS fix acquisition (may take 30 seconds to several minutes)

3. **Signal Quality Check**
   - Test outdoors for best signal
   - Note time to first fix (TTFF)
   - Verify coordinate accuracy

### Phase 2: Code Integration

#### 2.1 Create GPS Handler Module
**File**: `device/Sentry_Device/GPSHandler.h` and `GPSHandler.cpp`

**Responsibilities**:
- Initialize GPS module
- Read and parse NMEA data
- Provide location data (lat, lon, altitude)
- Handle GPS fix status
- Manage GPS update intervals

**Key Functions**:
```cpp
void initGPS();
bool hasGPSFix();
void updateGPS();
float getLatitude();
float getLongitude();
float getAltitude();
int getSatellites();
bool isValidLocation();
```

#### 2.2 Modify Main Arduino Sketch
**File**: `device/Sentry_Device/Sentry_Device.ino`

**Changes Required**:
1. Include GPS handler
2. Initialize GPS in `setup()`
3. Update GPS data in `loop()`
4. Add GPS data to JSON payload
5. Handle GPS fix status in JSON payload
6. Print JSON payload to Serial Monitor (do NOT send to server)

**JSON Payload Updates**:
```json
{
  "ax": 0.0,
  "ay": 0.0,
  "az": 0.0,
  "roll": 0.0,
  "pitch": 0.0,
  "tilt_detected": false,
  "latitude": 14.5995,
  "longitude": 120.9842,
  "altitude": 10.5,
  "gps_fix": true,
  "satellites": 8,
  "device_id": "ESP32_001",
  "timestamp": 1234567890
}
```

#### 2.3 GPS Update Strategy
- **Update Frequency**: Update GPS every 1-2 seconds (GPS modules typically output at 1Hz)
- **Data Validity**: Only include GPS data when fix is valid
- **Power Considerations**: GPS can be power-intensive; consider sleep modes if battery-powered
- **Timeout Handling**: Handle cases where GPS fix is lost
- **Output**: Print JSON to Serial Monitor for verification (server integration deferred to future phase)

### Phase 3: Local Testing & Validation

#### 3.1 Unit Testing
- Test GPS handler functions independently
- Verify NMEA parsing accuracy
- Test edge cases (no fix, invalid data, etc.)

#### 3.2 Integration Testing
- Test full data flow: GPS → ESP32 → Serial Monitor
- Verify GPS data appears correctly in JSON output
- Test with and without GPS fix
- Verify JSON format is correct and readable

#### 3.3 Field Testing
- Test outdoors (good signal)
- Test indoors (poor/no signal)
- Test during tilt events
- Verify location accuracy in Serial output
- Test power consumption

#### 3.4 Data Validation
- Coordinate range validation (latitude: -90 to 90, longitude: -180 to 180)
- GPS fix status verification in JSON
- Verify JSON structure matches expected format
- Check that invalid GPS data is handled gracefully

## Code Structure

### New Files to Create
```
device/Sentry_Device/
├── GPSHandler.h          (New)
├── GPSHandler.cpp        (New)
└── Sentry_Device.ino     (Modified)
```

### Files to Modify
```
device/Sentry_Device/
└── Sentry_Device.ino     (Add GPS integration, print JSON to Serial)
```

**Note**: Backend integration (database models, API schemas, controllers) will be implemented in a future phase.

## Configuration Considerations

### GPS Settings
- **Baud Rate**: Typically 9600 baud (default for Neo 6M)
- **Update Rate**: 1Hz (1 update per second) is standard
- **NMEA Sentences**: RMC and GGA recommended (TinyGPS++ supports these)

### Power Management
- GPS modules consume ~40-50mA when active
- Consider implementing sleep/wake cycles for battery-powered devices
- Use power enable pin if available on module

### Signal Quality
- **Cold Start**: 30-60 seconds to first fix
- **Warm Start**: 10-30 seconds
- **Hot Start**: 1-5 seconds
- **Indoor Reception**: May require external antenna

## Error Handling

### GPS-Specific Errors
1. **No GPS Fix**
   - Don't include invalid coordinates in JSON
   - Set `gps_fix: false` in JSON payload
   - Continue printing other sensor data

2. **Stale GPS Data**
   - Track last valid GPS update time
   - Mark as invalid if data is older than threshold (e.g., 10 seconds)

3. **Serial Communication Errors**
   - Handle serial buffer overflows
   - Implement timeout for GPS reads
   - Log errors for debugging

4. **Invalid Coordinates**
   - Validate latitude (-90 to 90)
   - Validate longitude (-180 to 180)
   - Reject obviously invalid values (0,0 when not at null island)

## Performance Considerations

### Memory Usage
- TinyGPS++ library is relatively lightweight
- Monitor ESP32 memory usage (heap)
- Consider JSON payload size with GPS data

### Processing Time
- GPS parsing adds minimal overhead
- Serial reading is non-blocking with proper implementation
- Consider async GPS updates

### Serial Output
- GPS data adds ~50-100 bytes per JSON payload
- Serial output at 5-second intervals is manageable
- Monitor Serial buffer to prevent overflows

## Security & Privacy

**Note**: The following considerations apply when implementing server integration in a future phase. For the current local testing phase, GPS data is only printed to Serial Monitor.

### Location Data Privacy (Future Phase)
- GPS coordinates are sensitive personal data
- Ensure secure transmission (HTTPS in production)
- Consider data retention policies
- Implement user consent for location tracking

### Data Encryption (Future Phase)
- Use HTTPS for API endpoints
- Consider encrypting GPS data at rest
- Follow GDPR/privacy regulations if applicable

## Future Enhancements

### Potential Improvements
1. **Geofencing**: Alert when device leaves defined area
2. **Route Tracking**: Store GPS track history
3. **Speed Detection**: Calculate movement speed from GPS
4. **Battery Optimization**: Implement GPS sleep/wake cycles
5. **Multi-GNSS Support**: Support GLONASS, Galileo, BeiDou
6. **A-GPS**: Use network-assisted GPS for faster fixes
7. **Location Accuracy Filtering**: Filter out low-accuracy readings

## Implementation Timeline

### Estimated Time
- **Hardware Setup**: 1-2 hours
- **GPS Handler Development**: 2-3 hours
- **Arduino Integration**: 1-2 hours
- **Local Testing & Validation**: 1-2 hours
- **Total**: ~5-9 hours

### Recommended Order
1. Hardware setup and basic GPS test
2. GPS handler module development
3. Arduino sketch integration (print JSON to Serial)
4. Local testing and validation
5. Field testing with Serial Monitor output

**Note**: Backend integration and server communication will be implemented in a future phase.

## Troubleshooting Guide

### Common Issues

1. **No GPS Fix**
   - Check antenna connection
   - Test outdoors with clear sky view
   - Wait longer (cold start can take 1-2 minutes)
   - Verify module power supply

2. **Invalid Coordinates**
   - Check NMEA sentence parsing
   - Verify GPS fix status before reading coordinates
   - Ensure TinyGPS++ is properly initialized

3. **Serial Communication Issues**
   - Verify baud rate matches (9600)
   - Check pin connections
   - Test with simple serial monitor first
   - Check for buffer overflows

4. **High Power Consumption**
   - Implement GPS sleep modes
   - Reduce GPS update frequency if possible
   - Consider power management IC

## References

### Libraries
- **TinyGPS++**: https://github.com/mikalhart/TinyGPSPlus
- **Neo 6M Datasheet**: Search for "u-blox NEO-6M datasheet"

### Documentation
- NMEA Sentence Format: https://www.gpsinformation.org/dale/nmea.htm
- ESP32 Hardware Serial: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/uart.html

## Notes

- GPS modules require clear view of sky for best performance
- First fix after power-on can take 30-60 seconds (cold start)
- Indoor GPS reception may be poor; external antenna recommended
- Consider adding LED indicator for GPS fix status
- Test thoroughly in various environments before deployment
- **This implementation prints JSON to Serial Monitor only - server integration deferred to future phase**

