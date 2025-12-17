#include "MPU6050Handler.h"
#include <SimpleKalmanFilter.h>
#include <Wire.h>

// SimpleKalmanFilter by Denys Sene

MPU6050 mpu;

const float ACCEL_RANGE = 32768.0; // ±2g


// Kalman filters for each axis
SimpleKalmanFilter kalmanAx(2, 2, 0.01);
SimpleKalmanFilter kalmanAy(2, 2, 0.01);
SimpleKalmanFilter kalmanAz(2, 2, 0.01);

void initMPU() {
    Wire.begin(21, 22);  // SDA = 21, SCL = 22
    mpu.initialize();
    if (!mpu.testConnection()) {
        Serial.println("MPU6050 FAILED!");
        while (1);
    }
}

void readAccel(float &ax, float &ay, float &az) {
    // Raw sensor values
    int16_t axRaw, ayRaw, azRaw;
    mpu.getAcceleration(&axRaw, &ayRaw, &azRaw);

    // Apply Kalman filter
    float axFiltered = kalmanAx.updateEstimate(axRaw);
    float ayFiltered = kalmanAy.updateEstimate(ayRaw);
    float azFiltered = kalmanAz.updateEstimate(azRaw);

    // Normalize to -1 to 1 g and assign to output parameters
    ax = axFiltered / ACCEL_RANGE;
    ay = ayFiltered / ACCEL_RANGE;
    az = azFiltered / ACCEL_RANGE;
}