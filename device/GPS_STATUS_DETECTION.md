# GPS Status Detection System

## Overview
The Neo 6M GPS tracker now includes intelligent status detection that provides specific prompts for different GPS states. This helps users understand whether the GPS is working properly, has no signal, or if the device itself is not functioning.

## GPS Status States

The system detects three distinct states:

### 1. **GPS Device Not Working** (Status Code: 0)
- **Detection**: GPS module is not sending any NMEA data
- **Possible Causes**:
  - Loose or incorrect wiring connections
  - GPS module not powered (VCC/GND issues)
  - GPS module hardware failure
  - Wrong serial pins configured
- **Status Message**: `"GPS device not working - Check connections"`
- **Serial Output**: `⚠️ GPS device not working - Check connections`

### 2. **No GPS Signal Detected** (Status Code: 1)
- **Detection**: GPS module is receiving and sending NMEA data, but no satellite fix is acquired
- **Possible Causes**:
  - Device is indoors or in a location with poor satellite visibility
  - GPS module needs more time to acquire first fix (cold start can take 30-60 seconds)
  - Antenna not properly connected or damaged
  - Device is in a location with signal interference
- **Status Message**: `"No GPS signal detected - Move to open area"`
- **Serial Output**: `⚠️ No GPS signal detected - Move to open area (Satellites: X)`

### 3. **GPS Tracking Active** (Status Code: 2)
- **Detection**: GPS module has a valid location fix with recent updates
- **Status Message**: `"GPS tracking active"`
- **Serial Output**: `✓ GPS tracking active - Lat: X.XXXXXX, Lng: X.XXXXXX, Sats: X`

## Implementation Details

### GPS Handler Functions

#### `int getGPSStatus()`
Returns the current GPS status code:
- `0` = Device not working
- `1` = No signal detected
- `2` = Working properly

#### `const char* getGPSStatusMessage()`
Returns a user-friendly status message string based on the current GPS state.

#### `bool isGPSReceivingData()`
Checks if the GPS module is actively sending NMEA data. Used internally to detect if the device is working.

### Bluetooth Data Format

The GPS status message is now included in the GPS data JSON sent via Bluetooth:

```json
{
  "type": "gps_data",
  "sequence": 123,
  "timestamp": 1234567890,
  "gps": {
    "fix": true,
    "satellites": 8,
    "status_message": "GPS tracking active",
    "latitude": 14.599512,
    "longitude": 120.984219,
    "altitude": 10.5
  },
  "crc": 12345
}
```

When GPS is not working or has no signal:
```json
{
  "type": "gps_data",
  "sequence": 124,
  "timestamp": 1234567891,
  "gps": {
    "fix": false,
    "satellites": 0,
    "status_message": "No GPS signal detected - Move to open area",
    "latitude": null,
    "longitude": null,
    "altitude": null
  },
  "crc": 12346
}
```

## How It Works

### Detection Logic

1. **Device Detection** (During `initGPS()`):
   - After initializing Serial2, the system waits 2 seconds
   - Checks if any NMEA data is received
   - Sets `gpsReceivingData` flag accordingly
   - Prints warning if no data is detected

2. **Runtime Detection** (During `updateGPS()`):
   - Continuously monitors incoming NMEA data
   - Updates `lastGPSDataTime` when data is received
   - If no data received for 2 seconds, sets `gpsReceivingData = false`

3. **Status Determination** (In `getGPSStatus()`):
   - First checks if GPS is receiving data → Status 0 if not
   - Then checks if location is valid → Status 2 if valid
   - Otherwise → Status 1 (receiving data but no fix)

### Timeout Configuration

- **GPS Data Timeout**: 10 seconds
  - If GPS fix data is older than 10 seconds, it's considered stale
  - Defined in `GPS_DATA_TIMEOUT` constant

- **GPS Communication Timeout**: 2 seconds
  - If no NMEA data received for 2 seconds, device is considered not working
  - Used to detect hardware issues

## Usage in Main Loop

The main loop (`Sentry_Device.ino`) now:
1. Gets GPS status message using `getGPSStatusMessage()`
2. Gets GPS status code using `getGPSStatus()`
3. Sends status message via Bluetooth in GPS data JSON
4. Displays appropriate Serial output with emoji indicators:
   - ⚠️ for warnings (not working, no signal)
   - ✓ for success (tracking active)

## Troubleshooting Guide

### If you see "GPS device not working":
1. **Check Power Connections**:
   - Verify VCC is connected to 3.3V (or 5V if module supports it)
   - Verify GND is connected to ESP32 GND
   - Check if GPS module LED is on (if it has one)

2. **Check Serial Connections**:
   - Neo 6M TX → ESP32 GPIO 17 (RX2)
   - Neo 6M RX → ESP32 GPIO 16 (TX2)
   - Verify connections are secure

3. **Check Serial Monitor**:
   - Look for "GPS: ⚠️ WARNING - No data received from GPS module" during initialization
   - This confirms the detection is working

### If you see "No GPS signal detected":
1. **Move to Open Area**:
   - GPS needs clear view of sky
   - Indoors or under cover will not work
   - Try near a window or go outside

2. **Wait for Cold Start**:
   - First fix can take 30-60 seconds (cold start)
   - Subsequent fixes are faster (warm start)

3. **Check Antenna**:
   - Ensure antenna is properly connected
   - External antenna may improve signal

4. **Monitor Satellite Count**:
   - Check Serial output for satellite count
   - Need at least 4 satellites for 3D fix
   - More satellites = better accuracy

## Testing the System

### Test 1: Device Not Working
1. Disconnect GPS TX wire (GPIO 17)
2. Upload code and observe Serial Monitor
3. Should see: `⚠️ GPS device not working - Check connections`

### Test 2: No Signal
1. Keep GPS connected but test indoors
2. Upload code and observe Serial Monitor
3. Should see: `⚠️ No GPS signal detected - Move to open area`
4. Move device outside and wait 30-60 seconds
5. Should transition to: `✓ GPS tracking active`

### Test 3: Working Properly
1. Connect GPS properly
2. Test outdoors with clear sky view
3. Wait for fix acquisition
4. Should see: `✓ GPS tracking active` with coordinates

## Frontend Integration

The mobile app can now display GPS status messages by reading the `status_message` field from the GPS data JSON. This provides a better user experience with clear, actionable feedback.

Example frontend handling:
```javascript
if (gpsData.gps.status_message) {
  displayGPSStatus(gpsData.gps.status_message);
  
  if (gpsData.gps.status_message.includes("not working")) {
    showErrorIcon();
  } else if (gpsData.gps.status_message.includes("No GPS signal")) {
    showWarningIcon();
  } else {
    showSuccessIcon();
  }
}
```

## Summary

This GPS status detection system provides:
- ✅ Clear, specific prompts for each GPS state
- ✅ Automatic detection of hardware issues
- ✅ User-friendly status messages
- ✅ Integration with Bluetooth data transmission
- ✅ Helpful troubleshooting information

The system helps users quickly identify and resolve GPS issues, improving the overall reliability and user experience of the Sentry Device.

