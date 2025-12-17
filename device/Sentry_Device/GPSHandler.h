#ifndef GPSHANDLER_H
#define GPSHANDLER_H

#include <TinyGPS++.h>
#include <HardwareSerial.h>

// Neo 6M GPS Module Handler
// Uses Hardware Serial 2 (GPIO 16 = RX2, GPIO 17 = TX2)

void initGPS();
bool hasGPSFix();
void updateGPS();
float getLatitude();
float getLongitude();
float getAltitude();
int getSatellites();
bool isValidLocation();

#endif


