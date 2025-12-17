#ifndef BLUETOOTH_HANDLER_H
#define BLUETOOTH_HANDLER_H

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID              "0000ff00-0000-1000-8000-00805f9b34fb"
#define CHAR_SENSOR_DATA_UUID     "0000ff01-0000-1000-8000-00805f9b34fb"
#define CHAR_GPS_DATA_UUID        "0000ff02-0000-1000-8000-00805f9b34fb"
#define CHAR_CONFIG_UUID           "0000ff03-0000-1000-8000-00805f9b34fb"
#define CHAR_DEVICE_STATUS_UUID    "0000ff04-0000-1000-8000-00805f9b34fb"

// Error Codes
#define BLE_ERROR_NONE             0x00
#define BLE_ERROR_INVALID_CMD      0x01
#define BLE_ERROR_INVALID_DATA     0x02
#define BLE_ERROR_CHECKSUM_FAIL    0x03
#define BLE_ERROR_NOT_CONNECTED    0x04
#define BLE_ERROR_BUFFER_FULL      0x05
#define BLE_ERROR_UNKNOWN          0xFF

// Command Types
#define CMD_GET_STATUS             0x01
#define CMD_SET_WIFI_SSID         0x02
#define CMD_SET_WIFI_PASSWORD     0x03
#define CMD_SET_API_ENDPOINT      0x04
#define CMD_RESET_DEVICE          0x05
#define CMD_CALIBRATE_SENSOR      0x06

// Packet Structure Constants
#define PACKET_HEADER_SIZE         4
#define MAX_PACKET_SIZE            512
#define CRC_POLYNOMIAL             0x1021

// Function declarations
void initBluetooth(const char* deviceName);
bool isBluetoothConnected();
void handleBluetoothReconnection();
void processBluetoothCommands();

// Data transmission functions
void sendSensorData(float ax, float ay, float az, float roll, float pitch, bool tiltDetected);
void sendGPSData(bool gpsFix, int satellites, float latitude, float longitude, float altitude, const char* statusMessage = nullptr);
void sendDeviceStatus(bool wifiConnected, bool gpsFix, int batteryLevel);

// Utility functions
uint16_t calculateCRC16(const uint8_t* data, size_t length);
uint32_t getNextSequenceNumber();
void sendErrorResponse(uint8_t errorCode, const char* message);

#endif
