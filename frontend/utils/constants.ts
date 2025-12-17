/** Application constants. */

export const CRASH_DETECTION_CONFIG = {
  gForceThreshold: 8.0,
  tiltThreshold: 90.0,
  consecutiveTriggers: 2,
  lookbackSeconds: 30,
  crashAlertIntervalSeconds: 15, // Minimum interval between crash alert API calls (configurable)
} as const;

// ESP32 BLE Service and Characteristic UUIDs (matching ESP32 code)
export const SENTRY_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
export const SENSOR_DATA_CHARACTERISTIC_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
export const GPS_DATA_CHARACTERISTIC_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
export const CONFIG_CHARACTERISTIC_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';
export const DEVICE_STATUS_CHARACTERISTIC_UUID = '0000ff04-0000-1000-8000-00805f9b34fb';

// BLE Device name pattern to match
export const SENTRY_DEVICE_NAME_PATTERN = 'Sentry';

