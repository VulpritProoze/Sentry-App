/*
 * ESP32 Bluetooth Low Energy (BLE) Test
 * 
 * This is a standalone test to verify BLE functionality on ESP32
 * 
 * REQUIRED LIBRARIES (Install via Arduino Library Manager):
 * 1. ESP32 BLE Arduino (usually included with ESP32 board package)
 *    - If not, search for "ESP32 BLE Arduino" by Neil Kolban
 * 
 * 2. ArduinoJson by Benoit Blanchon
 *    - Install version 6.x (Arduino Library Manager)
 *    - Search: "ArduinoJson"
 * 
 * BOARD SETUP:
 * - Board: ESP32 Dev Module (or your ESP32 board)
 * - Partition Scheme: Default (or "Huge APP" if code too large)
 * - Upload Speed: 115200
 * - CPU Frequency: 240MHz
 * 
 * TESTING:
 * 1. Upload this sketch to ESP32
 * 2. Open Serial Monitor (115200 baud)
 * 3. Use BLE scanner app on phone (nRF Connect, LightBlue, etc.)
 * 4. Look for device "Sentry-BLE-Test"
 * 5. Connect and enable notifications on characteristics
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// ==================== BLE UUIDs ====================
#define SERVICE_UUID              "0000ff00-0000-1000-8000-00805f9b34fb"
#define CHAR_SENSOR_DATA_UUID     "0000ff01-0000-1000-8000-00805f9b34fb"
#define CHAR_GPS_DATA_UUID        "0000ff02-0000-1000-8000-00805f9b34fb"
#define CHAR_CONFIG_UUID           "0000ff03-0000-1000-8000-00805f9b34fb"
#define CHAR_DEVICE_STATUS_UUID    "0000ff04-0000-1000-8000-00805f9b34fb"

// ==================== Global Variables ====================
BLEServer* pServer = nullptr;
BLECharacteristic* pSensorDataChar = nullptr;
BLECharacteristic* pGPSDataChar = nullptr;
BLECharacteristic* pConfigChar = nullptr;
BLECharacteristic* pDeviceStatusChar = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t sequenceNumber = 0;

// Test data counter
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 3000; // Send every 3 seconds
int testCounter = 0;

// ==================== Server Callbacks ====================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      sequenceNumber = 0;
      Serial.println("*** BLE: Client Connected ***");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("*** BLE: Client Disconnected ***");
    }
};

// ==================== Configuration Callback ====================
class ConfigCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      String value = pCharacteristic->getValue();
      if (value.length() > 0) {
        Serial.print("BLE: Command received - ");
        Serial.println(value);
        
        // Echo back the command
        StaticJsonDocument<128> response;
        response["type"] = "command_response";
        response["received"] = value;
        response["status"] = "ok";
        response["sequence"] = ++sequenceNumber;
        
        String responseJson;
        serializeJson(response, responseJson);
        pCharacteristic->setValue(responseJson.c_str());
        pCharacteristic->notify();
      }
    }
};

// ==================== CRC Calculation ====================
uint16_t calculateCRC16(const uint8_t* data, size_t length) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < length; i++) {
    crc ^= (uint16_t)data[i] << 8;
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return crc;
}

// ==================== Setup ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("========================================");
  Serial.println("ESP32 BLE Test - Starting...");
  Serial.println("========================================");
  
  // Initialize BLE
  BLEDevice::init("Sentry-BLE-Test");
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create BLE Service
  BLEService* pService = pServer->createService(BLEUUID(SERVICE_UUID));
  
  // Create Sensor Data Characteristic
  pSensorDataChar = pService->createCharacteristic(
    BLEUUID(CHAR_SENSOR_DATA_UUID),
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pSensorDataChar->addDescriptor(new BLE2902());
  
  // Create GPS Data Characteristic
  pGPSDataChar = pService->createCharacteristic(
    BLEUUID(CHAR_GPS_DATA_UUID),
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pGPSDataChar->addDescriptor(new BLE2902());
  
  // Create Configuration Characteristic
  pConfigChar = pService->createCharacteristic(
    BLEUUID(CHAR_CONFIG_UUID),
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
  );
  pConfigChar->setCallbacks(new ConfigCharacteristicCallbacks());
  pConfigChar->addDescriptor(new BLE2902());
  
  // Create Device Status Characteristic
  pDeviceStatusChar = pService->createCharacteristic(
    BLEUUID(CHAR_DEVICE_STATUS_UUID),
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pDeviceStatusChar->addDescriptor(new BLE2902());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLEUUID(SERVICE_UUID));
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE: Initialized successfully");
  Serial.print("Device Name: Sentry-BLE-Test");
  Serial.println();
  Serial.println("Service UUID: " + String(SERVICE_UUID));
  Serial.println("Waiting for client connection...");
  Serial.println("========================================");
  
  lastSendTime = millis();
}

// ==================== Send Sensor Data ====================
void sendSensorData(float ax, float ay, float az, float roll, float pitch, bool tiltDetected) {
  if (!deviceConnected || pSensorDataChar == nullptr) return;
  
  StaticJsonDocument<192> doc;
  doc["type"] = "sensor_data";
  doc["sequence"] = ++sequenceNumber;
  doc["timestamp"] = millis();
  
  JsonObject sensor = doc.createNestedObject("sensor");
  sensor["ax"] = ax;
  sensor["ay"] = ay;
  sensor["az"] = az;
  sensor["roll"] = roll;
  sensor["pitch"] = pitch;
  sensor["tilt_detected"] = tiltDetected;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  uint16_t crc = calculateCRC16(dataBytes, jsonData.length());
  doc["crc"] = crc;
  
  jsonData = "";
  serializeJson(doc, jsonData);
  
  pSensorDataChar->setValue(jsonData.c_str());
  pSensorDataChar->notify();
  
  Serial.print("BLE: Sensor data sent [Seq: ");
  Serial.print(sequenceNumber);
  Serial.println("]");
}

// ==================== Send GPS Data ====================
void sendGPSData(bool gpsFix, int satellites, float latitude, float longitude, float altitude) {
  if (!deviceConnected || pGPSDataChar == nullptr) return;
  
  StaticJsonDocument<192> doc;
  doc["type"] = "gps_data";
  doc["sequence"] = ++sequenceNumber;
  doc["timestamp"] = millis();
  
  JsonObject gps = doc.createNestedObject("gps");
  gps["fix"] = gpsFix;
  gps["satellites"] = satellites;
  gps["latitude"] = latitude;
  gps["longitude"] = longitude;
  gps["altitude"] = altitude;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  uint16_t crc = calculateCRC16(dataBytes, jsonData.length());
  doc["crc"] = crc;
  
  jsonData = "";
  serializeJson(doc, jsonData);
  
  pGPSDataChar->setValue(jsonData.c_str());
  pGPSDataChar->notify();
  
  Serial.print("BLE: GPS data sent [Seq: ");
  Serial.print(sequenceNumber);
  Serial.println("]");
}

// ==================== Send Device Status ====================
void sendDeviceStatus(bool wifiConnected, bool gpsFix, int batteryLevel) {
  if (!deviceConnected || pDeviceStatusChar == nullptr) return;
  
  StaticJsonDocument<128> doc;
  doc["type"] = "device_status";
  doc["sequence"] = ++sequenceNumber;
  doc["timestamp"] = millis();
  
  JsonObject status = doc.createNestedObject("status");
  status["wifi_connected"] = wifiConnected;
  status["gps_fix"] = gpsFix;
  status["battery_level"] = batteryLevel;
  status["ble_connected"] = true;
  status["test_counter"] = testCounter;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  uint16_t crc = calculateCRC16(dataBytes, jsonData.length());
  doc["crc"] = crc;
  
  jsonData = "";
  serializeJson(doc, jsonData);
  
  pDeviceStatusChar->setValue(jsonData.c_str());
  pDeviceStatusChar->notify();
  
  Serial.print("BLE: Device status sent [Seq: ");
  Serial.print(sequenceNumber);
  Serial.println("]");
}

// ==================== Handle Reconnection ====================
void handleBluetoothReconnection() {
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("BLE: Restarting advertising...");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}

// ==================== Main Loop ====================
void loop() {
  handleBluetoothReconnection();
  
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    if (deviceConnected) {
      testCounter++;
      
      // Send test sensor data
      float testAx = 0.1 + (testCounter % 10) * 0.01;
      float testAy = 0.2 + (testCounter % 10) * 0.01;
      float testAz = 0.9;
      float testRoll = 5.0 + (testCounter % 20);
      float testPitch = 3.0 + (testCounter % 15);
      bool testTilt = (testCounter % 50 == 0);
      
      sendSensorData(testAx, testAy, testAz, testRoll, testPitch, testTilt);
      
      // Send test GPS data
      bool testGpsFix = (testCounter % 10 < 7); // Simulate GPS fix 70% of time
      int testSatellites = 5 + (testCounter % 8);
      float testLat = 37.7749 + (testCounter % 100) * 0.0001;
      float testLon = -122.4194 + (testCounter % 100) * 0.0001;
      float testAlt = 100.0 + (testCounter % 50);
      
      sendGPSData(testGpsFix, testSatellites, testLat, testLon, testAlt);
      
      // Send device status
      sendDeviceStatus(false, testGpsFix, -1);
      
      Serial.println("--- All test data sent ---");
    } else {
      Serial.println("BLE: Waiting for connection...");
    }
    
    lastSendTime = currentTime;
  }
  
  delay(100);
}

