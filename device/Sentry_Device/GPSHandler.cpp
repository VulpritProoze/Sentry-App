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

void initGPS() {
    // Initialize Serial2 for GPS at 9600 baud (default Neo 6M baud rate)
    SerialGPS.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
    
    // Test GPS communication - wait a moment and check for incoming data
    delay(500);
    int testBytes = 0;
    unsigned long testStart = millis();
    while (millis() - testStart < 1000) { // Reduced test time from 2s to 1s
        if (SerialGPS.available() > 0) {
            SerialGPS.read(); // Just read, don't print
            testBytes++;
        }
        delay(10);
    }
}

bool hasGPSFix() {
    return gps.location.isValid() && gps.location.isUpdated();
}

// Debug: Track GPS data reception
static unsigned long lastGPSDataTime = 0;
static int gpsDataCount = 0;
static bool gpsReceivingData = false;

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

