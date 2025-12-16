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
    Serial.println("Initializing GPS...");
    
    // Initialize Serial2 for GPS at 9600 baud (default Neo 6M baud rate)
    SerialGPS.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
    
    Serial.println("GPS Serial initialized at 9600 baud");
    Serial.println("Waiting for GPS fix (this may take 30-60 seconds for cold start)...");
}

bool hasGPSFix() {
    return gps.location.isValid() && gps.location.isUpdated();
}

void updateGPS() {
    // Read available data from GPS module
    while (SerialGPS.available() > 0) {
        char c = SerialGPS.read();
        if (gps.encode(c)) {
            // Valid NMEA sentence processed
            if (gps.location.isValid()) {
                lastValidGPSUpdate = millis();
            }
        }
    }
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

