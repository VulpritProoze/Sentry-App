#include "BluetoothHandler.h"

// BLE Server and Characteristic objects
BLEServer* pServer = nullptr;
BLECharacteristic* pSensorDataChar = nullptr;
BLECharacteristic* pGPSDataChar = nullptr;
BLECharacteristic* pConfigChar = nullptr;
BLECharacteristic* pDeviceStatusChar = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// Packet sequence number (increments for each packet)
static uint32_t sequenceNumber = 0;

// Command callback flag
static bool commandReceived = false;
static String receivedCommand = "";

// Server Callback class
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      sequenceNumber = 0; // Reset sequence on new connection
      Serial.println("*** Bluetooth: Client Connected ***");
      // Serial.println("BLE: Sequence number reset to 0");
    }

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("*** Bluetooth: Client Disconnected ***");
    }
};

// Configuration Characteristic Callback
class ConfigCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* pCharacteristic) {
      String value = pCharacteristic->getValue();
      if (value.length() > 0) {
        receivedCommand = value;
        commandReceived = true;
    // Serial.print("BLE: Command received - ");
    // Serial.println(receivedCommand);
      }
    }
};

// Calculate CRC-16 (CCITT polynomial)
uint16_t calculateCRC16(const uint8_t* data, size_t length) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < length; i++) {
    crc ^= (uint16_t)data[i] << 8;
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ CRC_POLYNOMIAL;
      } else {
        crc <<= 1;
      }
    }
  }
  return crc;
}

// Get next sequence number
uint32_t getNextSequenceNumber() {
  return ++sequenceNumber;
}

// Send error response
void sendErrorResponse(uint8_t errorCode, const char* message) {
  if (!deviceConnected || pConfigChar == nullptr) {
    return;
  }
  
  StaticJsonDocument<256> errorDoc;
  errorDoc["type"] = "error";
  errorDoc["error_code"] = errorCode;
  errorDoc["message"] = message;
  errorDoc["sequence"] = getNextSequenceNumber();
  errorDoc["timestamp"] = millis();
  
  String errorJson;
  serializeJson(errorDoc, errorJson);
  
  pConfigChar->setValue(errorJson.c_str());
  pConfigChar->notify();
  
  // Reduced Serial output
  // Serial.print("BLE: Error 0x");
  // Serial.println(errorCode, HEX);
}

// Initialize Bluetooth Low Energy
void initBluetooth(const char* deviceName) {
  // Initialize BLE device
  BLEDevice::init(deviceName);
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create BLE Service
  BLEService* pService = pServer->createService(BLEUUID(SERVICE_UUID));
  
  // Create Sensor Data Characteristic (Read, Notify)
  pSensorDataChar = pService->createCharacteristic(
                      BLEUUID(CHAR_SENSOR_DATA_UUID),
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pSensorDataChar->addDescriptor(new BLE2902());
  
  // Create GPS Data Characteristic (Read, Notify)
  pGPSDataChar = pService->createCharacteristic(
                   BLEUUID(CHAR_GPS_DATA_UUID),
                   BLECharacteristic::PROPERTY_READ |
                   BLECharacteristic::PROPERTY_NOTIFY
                 );
  pGPSDataChar->addDescriptor(new BLE2902());
  
  // Create Configuration Characteristic (Write, Notify)
  pConfigChar = pService->createCharacteristic(
                  BLEUUID(CHAR_CONFIG_UUID),
                  BLECharacteristic::PROPERTY_WRITE |
                  BLECharacteristic::PROPERTY_NOTIFY
                );
  pConfigChar->setCallbacks(new ConfigCharacteristicCallbacks());
  pConfigChar->addDescriptor(new BLE2902());
  
  // Create Device Status Characteristic (Read, Notify)
  pDeviceStatusChar = pService->createCharacteristic(
                        BLEUUID(CHAR_DEVICE_STATUS_UUID),
                        BLECharacteristic::PROPERTY_READ |
                        BLECharacteristic::PROPERTY_NOTIFY
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
}

// Check if Bluetooth is connected
bool isBluetoothConnected() {
  return deviceConnected;
}

// Send sensor data with packet structure
void sendSensorData(float ax, float ay, float az, float roll, float pitch, bool tiltDetected) {
  if (!deviceConnected || pSensorDataChar == nullptr) {
    return;
  }
  
  // Build JSON packet
  StaticJsonDocument<192> doc;  // Further reduced
  doc["type"] = "sensor_data";
  doc["sequence"] = getNextSequenceNumber();
  doc["timestamp"] = millis();
  
  // Sensor data
  JsonObject sensor = doc.createNestedObject("sensor");
  sensor["ax"] = ax;
  sensor["ay"] = ay;
  sensor["az"] = az;
  sensor["roll"] = roll;
  sensor["pitch"] = pitch;
  sensor["tilt_detected"] = tiltDetected;
  
  // Serialize JSON
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Calculate CRC
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  size_t dataLength = jsonData.length();
  uint16_t crc = calculateCRC16(dataBytes, dataLength);
  
  // Add CRC to JSON
  doc["crc"] = crc;
  jsonData = "";
  serializeJson(doc, jsonData);
  
  // Send via BLE
  pSensorDataChar->setValue(jsonData.c_str());
  pSensorDataChar->notify();
  
  // Reduced Serial output to save code space
  // Serial.print("BLE: Sensor [Seq: ");
  // Serial.print(sequenceNumber);
  // Serial.println("]");
}

// Send GPS data with packet structure
void sendGPSData(bool gpsFix, int satellites, float latitude, float longitude, float altitude) {
  if (!deviceConnected || pGPSDataChar == nullptr) {
    return;
  }
  
  // Build JSON packet
  StaticJsonDocument<192> doc;  // Further reduced
  doc["type"] = "gps_data";
  doc["sequence"] = getNextSequenceNumber();
  doc["timestamp"] = millis();
  
  // GPS data
  JsonObject gps = doc.createNestedObject("gps");
  gps["fix"] = gpsFix;
  gps["satellites"] = satellites;
  
  if (gpsFix && latitude != 0.0 && longitude != 0.0) {
    gps["latitude"] = latitude;
    gps["longitude"] = longitude;
    if (altitude != 0.0) {
      gps["altitude"] = altitude;
    }
  } else {
    gps["latitude"] = nullptr;
    gps["longitude"] = nullptr;
    gps["altitude"] = nullptr;
  }
  
  // Serialize JSON
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Calculate CRC
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  size_t dataLength = jsonData.length();
  uint16_t crc = calculateCRC16(dataBytes, dataLength);
  
  // Add CRC to JSON
  doc["crc"] = crc;
  jsonData = "";
  serializeJson(doc, jsonData);
  
  // Send via BLE
  pGPSDataChar->setValue(jsonData.c_str());
  pGPSDataChar->notify();
  
  // Reduced Serial output to save code space
  // Serial.print("BLE: GPS [Seq: ");
  // Serial.print(sequenceNumber);
  // Serial.println("]");
}

// Send device status
void sendDeviceStatus(bool wifiConnected, bool gpsFix, int batteryLevel) {
  if (!deviceConnected || pDeviceStatusChar == nullptr) {
    return;
  }
  
  StaticJsonDocument<128> doc;  // Reduced from 256
  doc["type"] = "device_status";
  doc["sequence"] = getNextSequenceNumber();
  doc["timestamp"] = millis();
  
  JsonObject status = doc.createNestedObject("status");
  status["wifi_connected"] = wifiConnected;
  status["gps_fix"] = gpsFix;
  status["battery_level"] = batteryLevel;
  status["ble_connected"] = true;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Calculate CRC
  uint8_t* dataBytes = (uint8_t*)jsonData.c_str();
  size_t dataLength = jsonData.length();
  uint16_t crc = calculateCRC16(dataBytes, dataLength);
  
  doc["crc"] = crc;
  jsonData = "";
  serializeJson(doc, jsonData);
  
  pDeviceStatusChar->setValue(jsonData.c_str());
  pDeviceStatusChar->notify();
  
  // Reduced Serial output to save code space
  // Serial.print("BLE: Status [Seq: ");
  // Serial.print(sequenceNumber);
  // Serial.println("]");
}

// Process received commands
void processBluetoothCommands() {
  if (!commandReceived || receivedCommand.length() == 0) {
    return;
  }
  
  commandReceived = false;
  
  // Parse JSON command
  StaticJsonDocument<128> cmdDoc;  // Reduced from 256
  DeserializationError error = deserializeJson(cmdDoc, receivedCommand);
  
  if (error) {
    // Serial.print("BLE: Parse error - ");
    // Serial.println(error.c_str());
    sendErrorResponse(BLE_ERROR_INVALID_DATA, "Invalid JSON format");
    receivedCommand = "";
    return;
  }
  
  // Extract command type
  if (!cmdDoc.containsKey("command")) {
    sendErrorResponse(BLE_ERROR_INVALID_CMD, "Missing command field");
    receivedCommand = "";
    return;
  }
  
  uint8_t cmdType = cmdDoc["command"];
  String cmdName = "";
  
  // Process command
  switch (cmdType) {
    case CMD_GET_STATUS:
      cmdName = "GET_STATUS";
      // Serial.println("BLE: GET_STATUS");
      // Status will be sent via sendDeviceStatus() in main loop
      break;
      
    case CMD_SET_WIFI_SSID:
      cmdName = "SET_WIFI_SSID";
      // Serial.println("BLE: SET_WIFI_SSID");
      if (cmdDoc.containsKey("value")) {
        // TODO: Implement WiFi SSID update
      }
      break;
      
    case CMD_SET_WIFI_PASSWORD:
      cmdName = "SET_WIFI_PASSWORD";
      // Serial.println("BLE: SET_WIFI_PASSWORD");
      if (cmdDoc.containsKey("value")) {
        // TODO: Implement WiFi password update
      }
      break;
      
    case CMD_SET_API_ENDPOINT:
      cmdName = "SET_API_ENDPOINT";
      // Serial.println("BLE: SET_API_ENDPOINT");
      if (cmdDoc.containsKey("value")) {
        // TODO: Implement API endpoint update
      }
      break;
      
    case CMD_RESET_DEVICE:
      cmdName = "RESET_DEVICE";
      Serial.println("BLE: Resetting device...");
      delay(1000);
      ESP.restart();
      break;
      
    case CMD_CALIBRATE_SENSOR:
      cmdName = "CALIBRATE_SENSOR";
      // Serial.println("BLE: CALIBRATE_SENSOR");
      // TODO: Implement sensor calibration
      break;
      
    default:
      cmdName = "UNKNOWN";
      // Serial.print("BLE: Unknown cmd 0x");
      // Serial.println(cmdType, HEX);
      sendErrorResponse(BLE_ERROR_INVALID_CMD, "Unknown command type");
      receivedCommand = "";
      return;
  }
  
  // Send success response
  StaticJsonDocument<128> responseDoc;  // Reduced from 256
  responseDoc["type"] = "command_response";
  responseDoc["command"] = cmdType;
  responseDoc["command_name"] = cmdName;
  responseDoc["status"] = "success";
  responseDoc["sequence"] = getNextSequenceNumber();
  responseDoc["timestamp"] = millis();
  
  String responseJson;
  serializeJson(responseDoc, responseJson);
  
  uint8_t* dataBytes = (uint8_t*)responseJson.c_str();
  size_t dataLength = responseJson.length();
  uint16_t crc = calculateCRC16(dataBytes, dataLength);
  
  responseDoc["crc"] = crc;
  responseJson = "";
  serializeJson(responseDoc, responseJson);
  
  if (pConfigChar != nullptr) {
    pConfigChar->setValue(responseJson.c_str());
    pConfigChar->notify();
    // Reduced Serial output
    // Serial.print("BLE: Cmd ");
    // Serial.print(cmdName);
    // Serial.println(" OK");
  }
  
  receivedCommand = "";
}

// Handle reconnection (should be called in loop)
void handleBluetoothReconnection() {
  // Disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  
  // Connecting
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  // Process any received commands
  processBluetoothCommands();
}
