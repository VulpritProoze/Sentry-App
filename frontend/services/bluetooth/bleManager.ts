/** Bluetooth Low Energy (BLE) manager for ESP32 device communication using react-native-ble-plx. */

import { BleManager, Device, Characteristic, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { SensorReading, BLEDevice } from '@/types/device';
import { 
  SENTRY_SERVICE_UUID, 
  SENSOR_DATA_CHARACTERISTIC_UUID,
  SENTRY_DEVICE_NAME_PATTERN 
} from '@/utils/constants';

export class BLEManager {
  private manager: BleManager;
  private connectedDevice: BLEDevice | null = null;
  private connectedDeviceInstance: Device | null = null; // Store actual Device instance
  private onDataReceived?: (data: SensorReading) => void;
  private scanning: boolean = false;
  private subscription: any = null;
  private monitorSubscription: any = null;
  private stopScanTimeout: ReturnType<typeof setTimeout> | null = null;
  private dataBuffer: string = ''; // Buffer for accumulating BLE packets
  private bufferTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (error) {
      console.error('❌ Failed to create BLE Manager. Native module may not be available. Run: npx expo prebuild && npx expo run:android', error);
      throw error;
    }
  }

  /**
   * Request Bluetooth permissions (Android only)
   * Android requires location permission for BLE scanning
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS handles permissions automatically via Info.plist
      return true;
    }

    try {
      // Android 12+ (API 31+) requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      // Android 6-11 requires ACCESS_FINE_LOCATION for BLE scanning
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 31) {
        // Android 12+ permissions
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ];
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = permissions.every(
          (permission) => granted[permission] === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          console.warn('⚠️ Bluetooth permissions not granted');
          return false;
        }
      } else {
        // Android 6-11: Need location permission for BLE scanning
        const locationPermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        const granted = await PermissionsAndroid.request(locationPermission);
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('⚠️ Location permission not granted (required for BLE scanning)');
          return false;
        }
      }
      
      console.log('✅ Bluetooth permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting Bluetooth permissions:', error);
      return false;
    }
  }

  /**
   * Check if Bluetooth permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 31) {
        // Android 12+
        const scanGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const connectGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        return scanGranted && connectGranted;
      } else {
        // Android 6-11
        const locationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return locationGranted;
      }
    } catch (error) {
      console.error('❌ Error checking Bluetooth permissions:', error);
      return false;
    }
  }

  /**
   * Open system settings for Bluetooth or app permissions
   */
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        await Linking.openURL('app-settings:');
      }
    } catch (error) {
      console.error('❌ Error opening settings:', error);
    }
  }

  /**
   * Initialize BLE manager and request permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions first
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Bluetooth permissions not granted');
        }
      }

      // Wait for BLE manager to be ready
      const state = await this.manager.state();
      
      if (state === 'Unauthorized') {
        console.warn('⚠️ Bluetooth permission not granted');
        throw new Error('Bluetooth permission not granted');
      }
      
      console.log('✅ BLE Manager initialized, state:', state);
    } catch (error) {
      console.error('❌ Error initializing BLE Manager:', error);
      throw error;
    }
  }

  /**
   * Check if Bluetooth is enabled
   */
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      const state = await this.manager.state();
      return state === State.PoweredOn;
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
      return false;
    }
  }

  /**
   * Enable Bluetooth (opens system settings)
   * Note: react-native-ble-plx doesn't have a direct enable method
   * This will open system settings where user can enable Bluetooth
   */
  async enableBluetooth(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Try to open Bluetooth settings directly
        await Linking.openURL('android.settings.BLUETOOTH_SETTINGS');
      } else {
        // iOS: Open general settings
        await Linking.openURL('app-settings:');
      }
      console.log('📱 Opened Bluetooth settings');
    } catch (error) {
      console.error('Error opening Bluetooth settings:', error);
      // Fallback to general settings
      await this.openSettings();
    }
  }

  /**
   * Get current Bluetooth state with detailed information
   */
  async getBluetoothState(): Promise<{
    state: State;
    isEnabled: boolean;
    hasPermissions: boolean;
    needsPermission: boolean;
    needsBluetooth: boolean;
  }> {
    try {
      const state = await this.manager.state();
      const isEnabled = state === State.PoweredOn;
      const hasPermissions = await this.checkPermissions();
      
      return {
        state,
        isEnabled,
        hasPermissions,
        needsPermission: !hasPermissions,
        needsBluetooth: !isEnabled,
      };
    } catch (error) {
      console.error('Error getting Bluetooth state:', error);
      return {
        state: State.Unknown,
        isEnabled: false,
        hasPermissions: false,
        needsPermission: true,
        needsBluetooth: true,
      };
    }
  }

  /**
   * Scan for ESP32 devices
   * @param scanDuration Duration in seconds (default: 5)
   */
  async scanForDevices(scanDuration: number = 5): Promise<BLEDevice[]> {
    if (this.scanning) {
      console.warn('⚠️ Already scanning for devices');
      return [];
    }

    try {
      // Check permissions first
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted. Please grant permissions in settings.');
      }

      const isEnabled = await this.isBluetoothEnabled();
      if (!isEnabled) {
        console.warn('⚠️ Bluetooth is not enabled');
        throw new Error('Bluetooth is not enabled. Please enable Bluetooth in settings.');
      }

      this.scanning = true;
      const devices: Map<string, BLEDevice> = new Map();

      // Start scanning for devices
      this.manager.startDeviceScan(
        [SENTRY_SERVICE_UUID], // Filter by service UUID if available
        null, // No scan options
        (error, device) => {
          if (error) {
            console.error('❌ Error during scan:', error);
            return;
          }

          if (!device) {
            return;
          }

          const deviceName = device.name || '';
          
          // Filter for Sentry devices (check name contains pattern or service UUID)
          const hasServiceUUID = device.serviceUUIDs?.some(
            (uuid) => uuid.toLowerCase() === SENTRY_SERVICE_UUID.toLowerCase()
          );
          
          if (
            deviceName.toLowerCase().includes(SENTRY_DEVICE_NAME_PATTERN.toLowerCase()) ||
            hasServiceUUID
          ) {
            devices.set(device.id, {
              id: device.id,
              name: deviceName || 'Unknown Device',
              rssi: device.rssi || 0,
              connected: false,
            });
            console.log(`📡 Found device: ${deviceName} (${device.id})`);
          }
        }
      );

      console.log(`🔍 Scanning for devices (${scanDuration}s)...`);

      // Wait for scan to complete
      await new Promise((resolve) => {
        this.stopScanTimeout = setTimeout(() => {
          this.manager.stopDeviceScan();
          this.scanning = false;
          resolve(null);
        }, scanDuration * 1000);
      });

      const deviceList = Array.from(devices.values());
      console.log(`✅ Scan complete. Found ${deviceList.length} device(s)`);
      return deviceList;
    } catch (error) {
      console.error('❌ Error scanning for devices:', error);
      this.scanning = false;
      this.manager.stopDeviceScan();
      throw error;
    }
  }

  /**
   * Connect to ESP32 device with timeout and retry logic
   */
  async connect(deviceId: string, maxRetries: number = 3, timeoutMs: number = 15000): Promise<boolean> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for device: ${deviceId}`);
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } else {
          console.log(`🔌 Connecting to device: ${deviceId}`);
        }
        
        // Connect to device with timeout
        const connectionPromise = this.manager.connectToDevice(deviceId);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        
        const device = await Promise.race([connectionPromise, timeoutPromise]) as Device;
        
        // Request larger MTU (512 bytes) to receive complete JSON messages from ESP32
        // This matches the MTU requested by the ESP32 firmware
        // Without this, BLE defaults to 20-byte MTU which truncates messages
        try {
          await device.requestMTU(512);
          console.log('✅ MTU requested: 512 bytes');
        } catch (mtuError) {
          console.warn('⚠️ MTU request failed, using default (20 bytes):', mtuError);
          // Continue anyway - connection will work but messages may be truncated
        }
        
        // Discover all services and characteristics with timeout
        const discoveryPromise = device.discoverAllServicesAndCharacteristics();
        const discoveryTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Service discovery timeout after ${timeoutMs}ms`)), timeoutMs)
        );
        
        const deviceWithServices = await Promise.race([discoveryPromise, discoveryTimeoutPromise]) as Device;
        
        // Store device instance for disconnection
        this.connectedDeviceInstance = deviceWithServices;
        // Find the service and characteristic
        const serviceUUID = SENTRY_SERVICE_UUID.toLowerCase();
        const characteristicUUID = SENSOR_DATA_CHARACTERISTIC_UUID.toLowerCase();
        
        // Get characteristics for the service
        const characteristics = await deviceWithServices.characteristicsForService(serviceUUID);
        
        // Find the sensor data characteristic
        const characteristic = characteristics.find(
          (char) => char.uuid.toLowerCase() === characteristicUUID
        );
        
              if (!characteristic) {
                throw new Error(`Characteristic ${characteristicUUID} not found`);
              }

              // Try to read initial value (some devices send data via notifications, others via reads)
              try {
                const initialValue = await characteristic.read();
                if (initialValue?.value) {
                  console.log('📥 Read initial characteristic value, length:', initialValue.value.length);
                  const sensorData = this.parseSensorData(initialValue.value, deviceId);
                  if (sensorData) {
                    this.onDataReceived?.(sensorData);
                  }
                }
              } catch (readError) {
                // Reading might not be supported - that's okay, we'll rely on notifications
                console.log('ℹ️ Characteristic read not supported, using notifications only');
              }

              // Set up monitoring for characteristic updates
              this.monitorSubscription = characteristic.monitor((error: any, char: Characteristic | null) => {
          if (error) {
            // Ignore errors when device is disconnecting (this is expected)
            if (error.message?.includes('canceled') || error.message?.includes('disconnected') || error.message?.includes('Unknown error')) {
              return;
            }
            console.error('❌ Error monitoring characteristic:', error);
            return;
          }

          if (!char || !char.value) {
            return;
          }

        try {
          // Debug: Log when data arrives
          const base64Value = char.value || '';
          console.log('📦 BLE notification received, base64 length:', base64Value.length);
          console.log('📦 Base64 value (first 60 chars):', base64Value.substring(0, 60));
          console.log('📦 Current buffer size BEFORE processing:', this.dataBuffer.length, 'chars');
          
          // Parse base64 value to sensor data
          const sensorData = this.parseSensorData(base64Value, deviceId);
          // Only process if we got valid data (null means incomplete, wait for more)
          if (sensorData) {
            console.log('✅ Successfully parsed complete sensor data from BLE');
            this.onDataReceived?.(sensorData);
          } else {
            console.log('⏳ Data incomplete, waiting for more chunks (buffer size AFTER processing:', this.dataBuffer.length, 'chars)');
          }
        } catch (error) {
          console.error('❌ Error parsing sensor data:', error);
        }
        });

        // Set up connection state monitoring
        this.subscription = deviceWithServices.onDisconnected((error: any, device: Device) => {
          if (error) {
            console.error('❌ Device disconnected with error:', error);
          } else {
            console.log('🔌 Device disconnected:', device?.id);
          }
          this.connectedDevice = null;
          this.connectedDeviceInstance = null;
          if (this.monitorSubscription) {
            this.monitorSubscription.remove();
            this.monitorSubscription = null;
          }
        });

        // Get device info
        const deviceInfo = await deviceWithServices.services();
        const name = device.name || 'Sentry Device';
        
        this.connectedDevice = {
          id: deviceId,
          name,
          rssi: device.rssi || 0,
          connected: true,
        };

        console.log(`✅ Connected to device: ${this.connectedDevice.name}`);
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Connection attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);
        
        // Clean up failed connection attempt
        this.cleanup();
        
        // If this was the last attempt, return false
        if (attempt === maxRetries) {
          console.error(`❌ Failed to connect to device ${deviceId} after ${maxRetries} attempts`);
          this.connectedDevice = null;
          this.connectedDeviceInstance = null;
          return false;
        }
        
        // Continue to next retry attempt
      }
    }
    
    // Should never reach here, but TypeScript needs this
    return false;
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (!this.connectedDevice && !this.connectedDeviceInstance) {
      return;
    }

    try {
      const deviceId = this.connectedDevice?.id || this.connectedDeviceInstance?.id;
      console.log(`🔌 Disconnecting from device: ${deviceId || 'unknown'}`);

      // Cancel connection FIRST (this will automatically clean up subscriptions in native code)
      // We'll clear our references after to prevent memory leaks
      try {
        if (this.connectedDeviceInstance) {
          await this.connectedDeviceInstance.cancelConnection();
        }
      } catch (error) {
        // Device might already be disconnected - this is expected and safe to ignore
        console.log('ℹ️ Device connection already cancelled or error during cancel:', error);
      }

      // Clear subscription references AFTER canceling connection
      // Don't call remove() as cancelConnection() already handles cleanup in native code
      // Trying to remove() after cancel can cause NullPointerException
      this.monitorSubscription = null;
      this.subscription = null;
      
      this.connectedDeviceInstance = null;
      this.connectedDevice = null;
      console.log('✅ Disconnected from device');
    } catch (error) {
      console.error('❌ Error disconnecting from device:', error);
      // Clean up state even if there was an error
      this.connectedDevice = null;
      this.connectedDeviceInstance = null;
      // Clear subscriptions to prevent memory leaks
      this.monitorSubscription = null;
      this.subscription = null;
    }
  }

  /**
   * Set callback for received sensor data
   */
  setDataCallback(callback: (data: SensorReading) => void): void {
    this.onDataReceived = callback;
  }

  /**
   * Parse BLE data to SensorReading format
   * ESP32 sends data as JSON: {ax, ay, az, roll, pitch, tilt_detected, timestamp}
   * react-native-ble-plx returns base64 encoded strings
   * Returns null if data is incomplete or invalid
   */
  private parseSensorData(base64Value: string, deviceId: string): SensorReading | null {
    try {
      // react-native-ble-plx returns base64 encoded strings
      // We need to decode it to get the actual JSON string
      let dataString: string;
      
      // Check if it's already a JSON string (might be if library auto-decodes)
      if (base64Value.startsWith('{')) {
        dataString = base64Value;
        console.log('📝 Base64 value appears to be already decoded JSON (starts with {)');
      } else {
        // Decode from base64 using Buffer
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Buffer = require('buffer').Buffer;
        try {
          const decoded = Buffer.from(base64Value, 'base64').toString('utf8');
          console.log('📝 Decoded base64 chunk:', decoded.substring(0, 100), '... (length:', decoded.length, ')');
          dataString = decoded;
        } catch (decodeError) {
          // If base64 decode fails, try using it as-is
          console.warn('⚠️ Base64 decode failed, using raw value');
          dataString = base64Value;
        }
      }

      // Accumulate data in buffer (BLE sends data in chunks)
      const bufferBefore = this.dataBuffer.length;
      this.dataBuffer += dataString;
      const bufferAfter = this.dataBuffer.length;
      
      // Debug: Log buffer accumulation
      if (bufferBefore > 0) {
        console.log(`📥 Accumulating chunk: buffer was ${bufferBefore} chars, now ${bufferAfter} chars (+${dataString.length})`);
      }

      // Try to parse JSON - if it fails, the data might be incomplete
      let data: any;
      try {
        data = JSON.parse(this.dataBuffer);
        // Successfully parsed - clear buffer
        this.dataBuffer = '';
        
        // Clear any pending buffer timeout
        if (this.bufferTimeout) {
          clearTimeout(this.bufferTimeout);
          this.bufferTimeout = null;
        }
      } catch (parseError) {
        // JSON parsing failed - might be incomplete data
        // Check if it looks like we're in the middle of a JSON object
        const openBraces = (this.dataBuffer.match(/{/g) || []).length;
        const closeBraces = (this.dataBuffer.match(/}/g) || []).length;
        
        if (openBraces > closeBraces) {
          // We have more open braces than close - likely incomplete JSON
          // Set a timeout to flush buffer if no more data arrives
          if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
          }
          // Capture current buffer state for logging
          const bufferSnapshot = this.dataBuffer;
          const openCount = openBraces;
          const closeCount = closeBraces;
          this.bufferTimeout = setTimeout(() => {
            // Only clear if buffer hasn't changed (no new data arrived)
            // Compare by content, not reference (strings are immutable in JS)
            if (this.dataBuffer.length === bufferSnapshot.length && this.dataBuffer === bufferSnapshot) {
              console.warn('⚠️ BLE data buffer timeout - clearing incomplete data');
              console.warn('Buffer content at timeout:', bufferSnapshot.substring(0, 200));
              console.warn('Buffer length:', bufferSnapshot.length, 'chars');
              console.warn('Open braces:', openCount, 'Close braces:', closeCount);
              console.warn('⚠️ No new chunks arrived - ESP32 may only be sending partial data or chunks not arriving');
              this.dataBuffer = '';
            } else {
              console.log('⏸️ Buffer timeout skipped - new data arrived (buffer now:', this.dataBuffer.length, 'chars)');
            }
          }, 5000); // Wait 5 seconds for more data (ESP32 sends every ~2 seconds, allow 2.5x interval)
          
          // Return null to indicate we need more data (this is expected, not an error)
          return null;
        } else {
          // Mismatched braces or other parse error - clear buffer
          console.warn('⚠️ JSON parse error, clearing buffer. Buffer content:', this.dataBuffer.substring(0, 100));
          this.dataBuffer = '';
          return null;
        }
      }

      // Validate required fields
      if (typeof data !== 'object' || data === null) {
        console.warn('⚠️ Parsed data is not an object:', data);
        this.dataBuffer = '';
        return null;
      }

      // ESP32 sends data in structure: {type: "sensor_data", sensor: {ax, ay, az, ...}, ...}
      if (data.type === 'sensor_data' && data.sensor) {
        // Nested structure: {type: "sensor_data", sensor: {ax, ay, az, ...}}
        const sensorData = data.sensor;
        return {
          device_id: deviceId,
          ax: typeof sensorData.ax === 'number' ? sensorData.ax : 0,
          ay: typeof sensorData.ay === 'number' ? sensorData.ay : 0,
          az: typeof sensorData.az === 'number' ? sensorData.az : 0,
          roll: typeof sensorData.roll === 'number' ? sensorData.roll : 0,
          pitch: typeof sensorData.pitch === 'number' ? sensorData.pitch : 0,
          tilt_detected: typeof sensorData.tilt_detected === 'boolean' ? sensorData.tilt_detected : false,
          timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        };
      } else if (data.ax !== undefined || data.ay !== undefined || data.az !== undefined) {
        // Direct structure: {ax, ay, az, ...} (fallback for other formats)
        return {
          device_id: deviceId,
          ax: typeof data.ax === 'number' ? data.ax : 0,
          ay: typeof data.ay === 'number' ? data.ay : 0,
          az: typeof data.az === 'number' ? data.az : 0,
          roll: typeof data.roll === 'number' ? data.roll : 0,
          pitch: typeof data.pitch === 'number' ? data.pitch : 0,
          tilt_detected: typeof data.tilt_detected === 'boolean' ? data.tilt_detected : false,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      } else {
        // Invalid data structure - not sensor data
        console.warn('⚠️ Received data without sensor values:', data.type || 'unknown type');
        this.dataBuffer = ''; // Clear buffer for invalid data
        return null;
      }
    } catch (error) {
      // This catch block should only hit unexpected errors (JSON parse errors are handled in the inner try-catch)
      console.error('❌ Unexpected error parsing sensor data:', error);
      console.error('Raw value:', base64Value);
      console.error('Buffer content:', this.dataBuffer.substring(0, 200));
      // Clear buffer on error
      this.dataBuffer = '';
      if (this.bufferTimeout) {
        clearTimeout(this.bufferTimeout);
        this.bufferTimeout = null;
      }
      return null;
    }
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null && this.connectedDevice.connected;
  }

  /**
   * Get connected device
   */
  getConnectedDevice(): BLEDevice | null {
    return this.connectedDevice;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.stopScanTimeout) {
      clearTimeout(this.stopScanTimeout);
      this.stopScanTimeout = null;
    }
    
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
    }
    
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }
    
    this.manager.stopDeviceScan();
    this.scanning = false;
    this.dataBuffer = ''; // Clear buffer on cleanup
    this.onDataReceived = undefined;
  }

  /**
   * Destroy the BLE manager instance
   */
  destroy(): void {
    this.cleanup();
    this.manager.destroy();
  }
}