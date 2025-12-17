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
   * Connect to ESP32 device
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔌 Connecting to device: ${deviceId}`);
      
      // Connect to device
      const device = await this.manager.connectToDevice(deviceId);
      
      // Discover all services and characteristics
      const deviceWithServices = await device.discoverAllServicesAndCharacteristics();
      
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

      // Set up monitoring for characteristic updates
      this.monitorSubscription = characteristic.monitor((error: any, char: Characteristic | null) => {
        if (error) {
          console.error('❌ Error monitoring characteristic:', error);
          return;
        }

        if (!char || !char.value) {
          return;
        }

        try {
          // Parse base64 value to sensor data
          const sensorData = this.parseSensorData(char.value, deviceId);
          this.onDataReceived?.(sensorData);
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
      console.error(`❌ Error connecting to device ${deviceId}:`, error);
      this.connectedDevice = null;
      this.connectedDeviceInstance = null;
      this.cleanup();
      return false;
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (!this.connectedDevice) {
      return;
    }

    try {
      const deviceId = this.connectedDevice.id;
      console.log(`🔌 Disconnecting from device: ${deviceId}`);

      // Cancel monitoring
      if (this.monitorSubscription) {
        this.monitorSubscription.remove();
        this.monitorSubscription = null;
      }

      // Remove connection state listener
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }

      // Cancel connection
      try {
        if (this.connectedDeviceInstance) {
          await this.connectedDeviceInstance.cancelConnection();
        }
      } catch (error) {
        // Device might already be disconnected
        console.warn('Warning during disconnect:', error);
      }
      
      this.connectedDeviceInstance = null;
      
      this.connectedDevice = null;
      console.log('✅ Disconnected from device');
    } catch (error) {
      console.error('❌ Error disconnecting from device:', error);
      this.connectedDevice = null;
      this.connectedDeviceInstance = null;
      this.cleanup();
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
   */
  private parseSensorData(base64Value: string, deviceId: string): SensorReading {
    try {
      // react-native-ble-plx returns base64 encoded strings
      // We need to decode it to get the actual JSON string
      let dataString: string;
      
      // Check if it's already a JSON string (might be if library auto-decodes)
      if (base64Value.startsWith('{')) {
        dataString = base64Value;
      } else {
        // Decode from base64 using Buffer
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Buffer = require('buffer').Buffer;
        dataString = Buffer.from(base64Value, 'base64').toString('utf8');
      }

      // Parse JSON
      const data = JSON.parse(dataString);

      // Validate required fields
      if (typeof data !== 'object' || data === null) {
        throw new Error('Data is not an object');
      }

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
    } catch (error) {
      console.error('❌ Error parsing sensor data:', error);
      console.error('Raw value:', base64Value);
      throw new Error(`Invalid sensor data format: ${error instanceof Error ? error.message : String(error)}`);
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