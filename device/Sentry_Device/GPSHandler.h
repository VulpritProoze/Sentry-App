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
bool isGPSReceivingData();
const char* getGPSStatusMessage();
int getGPSStatus(); // Returns: 0=not working, 1=no signal, 2=working

#endif


