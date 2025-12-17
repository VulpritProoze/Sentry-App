#include "GPSHandler.h"

// Hardware Serial 2 for GPS (RX2 = GPIO 16, TX2 = GPIO 17)
// Static to prevent multiple definition errors
static HardwareSerial SerialGPS(2);

// TinyGPS++ object
// Static to prevent multiple definition errors
static TinyGPSPlus gps;

// GPS data validity tracking
// Static to prevent multiple definition errors
static unsigned long lastValidGPSUpdate = 0;
const unsigned long GPS_DATA_TIMEOUT = 10000; // 10 seconds timeout for stale data

// Debug: Track GPS data reception
// Declared here so they're accessible in initGPS()
static unsigned long lastGPSDataTime = 0;
static int gpsDataCount = 0;
static bool gpsReceivingData = false;

void initGPS() {
    // Initialize Serial2 for GPS at 9600 baud (default Neo 6M baud rate)
    SerialGPS.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
    
    // Test GPS communication - wait a moment and check for incoming data
    delay(500);
    int testBytes = 0;
    unsigned long testStart = millis();
    while (millis() - testStart < 2000) { // Test for 2 seconds to detect if device is working
        if (SerialGPS.available() > 0) {
            char c = SerialGPS.read();
            if (gps.encode(c)) {
                testBytes++;
            }
        }
        delay(10);
    }
    
    // Initialize GPS data tracking
    if (testBytes > 0) {
        lastGPSDataTime = millis();
        gpsReceivingData = true;
        Serial.println("GPS: Device detected - Receiving NMEA data");
    } else {
        Serial.println("GPS: ⚠️ WARNING - No data received from GPS module");
        Serial.println("GPS: Check wiring: VCC, GND, TX->GPIO17, RX->GPIO16");
        gpsReceivingData = false;
    }
}

bool hasGPSFix() {
    return gps.location.isValid() && gps.location.isUpdated();
}

void updateGPS() {
    // Read available data from GPS module
    bool dataReceived = false;
    while (SerialGPS.available() > 0) {
        char c = SerialGPS.read();
        dataReceived = true;
        if (gps.encode(c)) {
            // Valid NMEA sentence processed
            gpsDataCount++;
            if (gps.location.isValid()) {
                lastValidGPSUpdate = millis();
            }
        }
    }
    
    // Track if GPS is receiving data
    if (dataReceived) {
        lastGPSDataTime = millis();
        gpsReceivingData = true;
    } else {
        // Check if GPS stopped sending data (timeout after 2 seconds)
        if (millis() - lastGPSDataTime > 2000 && lastGPSDataTime > 0) {
            gpsReceivingData = false;
        }
    }
}

bool isGPSReceivingData() {
    return gpsReceivingData;
}

int getGPSDataCount() {
    return gpsDataCount;
}

float getLatitude() {
    if (isValidLocation()) {
        return gps.location.lat();
    }
    return 0.0;
}

float getLongitude() {
    if (isValidLocation()) {
        return gps.location.lng();
    }
    return 0.0;
}

float getAltitude() {
    if (isValidLocation() && gps.altitude.isValid()) {
        return gps.altitude.meters();
    }
    return 0.0;
}

int getSatellites() {
    if (gps.satellites.isValid()) {
        return gps.satellites.value();
    }
    return 0;
}

bool isValidLocation() {
    // Check if GPS has valid fix and data is not stale
    if (!gps.location.isValid()) {
        return false;
    }
    
    // Check if data is stale (older than timeout)
    if (millis() - lastValidGPSUpdate > GPS_DATA_TIMEOUT) {
        return false;
    }
    
    // Validate coordinate ranges
    float lat = gps.location.lat();
    float lng = gps.location.lng();
    
    // Latitude must be between -90 and 90
    if (lat < -90.0 || lat > 90.0) {
        return false;
    }
    
    // Longitude must be between -180 and 180
    if (lng < -180.0 || lng > 180.0) {
        return false;
    }
    
    // Reject obviously invalid coordinates (0,0 when not at null island)
    // This is a simple check - in production, you might want more sophisticated validation
    if (lat == 0.0 && lng == 0.0) {
        return false;
    }
    
    return true;
}

// GPS Status Codes:
// 0 = GPS device not working (not receiving any data)
// 1 = GPS no signal (receiving data but no fix)
// 2 = GPS working (has valid fix)
int getGPSStatus() {
    // Check if GPS is receiving data at all
    if (!isGPSReceivingData()) {
        return 0; // Device not working
    }
    
    // Check if GPS has valid location fix
    if (isValidLocation()) {
        return 2; // Working properly
    }
    
    // GPS is receiving data but no fix
    return 1; // No signal detected
}

// Get user-friendly status message
const char* getGPSStatusMessage() {
    int status = getGPSStatus();
    
    switch (status) {
        case 0:
            return "GPS device not working - Check connections";
        case 1:
            return "No GPS signal detected - Move to open area";
        case 2:
            return "GPS tracking active";
        default:
            return "GPS status unknown";
    }
}

