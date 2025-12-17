# ESP32 Bluetooth Low Energy (BLE) Test

## 📋 Required Libraries

Install these libraries via **Arduino Library Manager** (Sketch → Include Library → Manage Libraries):

### 1. ESP32 BLE Arduino
- **Library Name**: ESP32 BLE Arduino
- **Author**: Neil Kolban
- **Note**: Usually included with ESP32 board package. If not found:
  - Search: "ESP32 BLE Arduino"
  - Or install ESP32 board package: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`

### 2. ArduinoJson
- **Library Name**: ArduinoJson
- **Author**: Benoit Blanchon
- **Version**: 6.x (recommended)
- **Search**: "ArduinoJson"
- **Install**: Click Install button

## 🔧 Arduino IDE Setup

### Step 1: Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32"
6. Install "esp32 by Espressif Systems"

### Step 2: Select Board
1. Go to **Tools → Board**
2. Select **"ESP32 Dev Module"** (or your ESP32 board)

### Step 3: Configure Settings
- **Partition Scheme**: Default (or "Huge APP" if code too large)
- **Upload Speed**: 115200
- **CPU Frequency**: 240MHz
- **Flash Frequency**: 80MHz
- **Flash Size**: 4MB (3MB APP/1MB SPIFFS) or your board's size

## 📱 Testing with Your Phone

### Step 1: Upload Code
1. Open `bluetooth.ino` in Arduino IDE
2. Connect ESP32 via USB
3. Select correct COM port: **Tools → Port**
4. Click **Upload** button
5. Wait for "Done uploading" message

### Step 2: Open Serial Monitor
1. Click **Serial Monitor** icon (top right)
2. Set baud rate to **115200**
3. You should see:
   ```
   ========================================
   ESP32 BLE Test - Starting...
   ========================================
   BLE: Initialized successfully
   Device Name: Sentry-BLE-Test
   Waiting for client connection...
   ========================================
   ```

### Step 3: Install BLE Scanner App

**Android:**
- **nRF Connect** (Recommended) - Free on Google Play
- **BLE Scanner** - Free alternative
- **LightBlue** - Free alternative

**iOS:**
- **nRF Connect** - Free on App Store
- **LightBlue** - Free alternative

### Step 4: Connect with Phone

1. **Open nRF Connect** app
2. **Tap "Scan"** button (top right)
3. **Look for**: "Sentry-BLE-Test"
4. **Tap on the device** to connect
5. You should see 4 characteristics:
   - `0000ff01-...` (Sensor Data)
   - `0000ff02-...` (GPS Data)
   - `0000ff03-...` (Configuration)
   - `0000ff04-...` (Device Status)

### Step 5: Enable Notifications

For each characteristic (Sensor Data, GPS Data, Device Status):
1. **Tap the characteristic** (the UUID)
2. **Tap the up arrow (↑)** or notification icon
3. **Enable notifications**
4. You should see data appearing every 3 seconds

### Step 6: Test Commands (Optional)

1. **Tap the Configuration characteristic** (`0000ff03-...`)
2. **Tap "Write"** or write icon
3. **Enter JSON**: `{"test": "hello"}`
4. **Tap "Send"**
5. **Check Serial Monitor** - You should see:
   ```
   BLE: Command received - {"test": "hello"}
   ```

## ✅ Expected Results

### Serial Monitor Output:
```
========================================
ESP32 BLE Test - Starting...
========================================
BLE: Initialized successfully
Device Name: Sentry-BLE-Test
Service UUID: 0000ff00-0000-1000-8000-00805f9b34fb
Waiting for client connection...
========================================
*** BLE: Client Connected ***
BLE: Sensor data sent [Seq: 1]
BLE: GPS data sent [Seq: 2]
BLE: Device status sent [Seq: 3]
--- All test data sent ---
```

### Phone App (nRF Connect):
- Device appears as "Sentry-BLE-Test"
- Can connect successfully
- Receives JSON data every 3 seconds
- Data includes:
  - Sensor data (ax, ay, az, roll, pitch, tilt_detected)
  - GPS data (fix, satellites, coordinates)
  - Device status (connection status, test counter)

## 🔍 Troubleshooting

### Device Not Appearing
- ✅ Check ESP32 is powered and code uploaded
- ✅ Check Serial Monitor shows "BLE: Initialized successfully"
- ✅ Move phone closer to ESP32 (within 10 meters)
- ✅ Restart ESP32 (unplug and replug USB)
- ✅ Restart BLE scanner app

### No Data Received
- ✅ Enable notifications on all 3 data characteristics
- ✅ Wait 3 seconds (data sends every 3 seconds)
- ✅ Check Serial Monitor shows "BLE: Client Connected"
- ✅ Try disconnecting and reconnecting

### Connection Drops
- ✅ Normal if you move too far away
- ✅ Reconnect using the app
- ✅ Check Serial Monitor for reconnection messages

### Compilation Errors
- ✅ Install required libraries (see above)
- ✅ Select correct ESP32 board
- ✅ Check Arduino IDE version (1.8.13+ recommended)
- ✅ Try changing Partition Scheme to "Huge APP"

## 📊 What the Test Does

1. **Initializes BLE** with device name "Sentry-BLE-Test"
2. **Creates 4 characteristics**:
   - Sensor Data (read, notify)
   - GPS Data (read, notify)
   - Configuration (write, notify)
   - Device Status (read, notify)
3. **Sends test data every 3 seconds** when connected:
   - Simulated sensor values (changing each cycle)
   - Simulated GPS coordinates (changing each cycle)
   - Device status with test counter
4. **Accepts commands** via Configuration characteristic
5. **Shows connection status** in Serial Monitor

## 🎯 Success Criteria

- [ ] Code compiles without errors
- [ ] Serial Monitor shows initialization messages
- [ ] Device appears in BLE scanner app
- [ ] Can connect successfully
- [ ] All 4 characteristics are visible
- [ ] Notifications can be enabled
- [ ] Receives data every 3 seconds
- [ ] Sequence numbers increment (1, 2, 3, ...)
- [ ] Commands can be sent and received

## 📝 Next Steps

Once Bluetooth test is successful:
1. Uncomment other modules in main project
2. Integrate real sensor data
3. Add GPS functionality
4. Add WiFi functionality
5. Test full system integration

