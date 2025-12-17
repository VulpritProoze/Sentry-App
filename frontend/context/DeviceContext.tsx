/** Device context for BLE connection state. */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { SensorReading, BLEDevice, GPSData } from '@/types/device';
import { BLEManager } from '@/services/bluetooth/bleManager';
import { LocationService } from '@/services/location/locationService';

interface DeviceContextType {
  isConnected: boolean;
  currentReading: SensorReading | null;
  currentGPSData: GPSData | null;
  currentSpeed: number | null; // Speed in m/s (converted to km/h for display)
  isGPSEnabled: boolean;
  hasLocationPermission: boolean;
  isScanning: boolean;
  scanForDevices: (duration?: number) => Promise<BLEDevice[]>;
  connect: (deviceId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  startReceiving: () => void;
  stopReceiving: () => void;
  startGPSTracking: () => Promise<void>;
  stopGPSTracking: () => void;
  requestLocationPermission: () => Promise<boolean>;
  checkLocationPermission: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
  enableBluetooth: () => Promise<void>;
  openSettings: () => Promise<void>;
  getBluetoothState: () => Promise<{
    state: any;
    isEnabled: boolean;
    hasPermissions: boolean;
    needsPermission: boolean;
    needsBluetooth: boolean;
  }>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [currentGPSData, setCurrentGPSData] = useState<GPSData | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [isGPSEnabled, setIsGPSEnabled] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const bleManagerRef = useRef<BLEManager | null>(null);
  const locationServiceRef = useRef<LocationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const readingCountRef = useRef(0);
  const gpsCountRef = useRef(0);

  // Initialize location service
  useEffect(() => {
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService();
    }

    // Check location permission on mount
    locationServiceRef.current.checkPermissions().then((hasPermission) => {
      setHasLocationPermission(hasPermission);
    });

    // Cleanup on unmount
    return () => {
      if (locationServiceRef.current) {
        locationServiceRef.current.stopTracking();
        locationServiceRef.current = null;
      }
    };
  }, []);

  // Lazy initialize BLE manager after component mounts (allows native modules to be ready)
  useEffect(() => {
    let mounted = true;
    
    const initializeBLE = async () => {
      try {
        if (!bleManagerRef.current) {
          bleManagerRef.current = new BLEManager();
          // Only mark as initialized if the manager was created successfully
          if (bleManagerRef.current && mounted) {
            setIsInitialized(true);
            console.log('✅ BLE Manager created successfully');
          }
        }
      } catch (error) {
        // Silently handle - BLE is optional if native module isn't available
        // This is normal if using Expo Go or if the app hasn't been rebuilt yet
        if (__DEV__) {
          console.log('ℹ️ BLE Manager not available. BLE features will be disabled.');
          console.log('💡 To enable BLE: Build a development build once with: npx expo run:android');
          console.log('   After the first build, you can use "npx expo start" normally.');
        }
        // BLE Manager will be null, but app can still function without BLE
        if (mounted) {
          setIsInitialized(false);
        }
      }
    };
    
    initializeBLE();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      if (bleManagerRef.current) {
        try {
          bleManagerRef.current.destroy();
        } catch (error) {
          console.error('Error destroying BLE Manager:', error);
        }
        bleManagerRef.current = null;
      }
      setIsInitialized(false);
    };
  }, []);

  const startReceiving = useCallback(() => {
    if (!bleManagerRef.current || !isInitialized) {
      // Silently return - this is expected if BLE is not available or not initialized yet
      return;
    }
    
    // Set sensor data callback
    bleManagerRef.current.setDataCallback((data: SensorReading) => {
      readingCountRef.current += 1;
      // Log every 5 readings to avoid console spam (every ~10 seconds)
      if (readingCountRef.current % 5 === 0) {
        console.log(`📥 DeviceContext: Received sensor data (reading #${readingCountRef.current})`, {
          device_id: data.device_id,
          ax: data.ax.toFixed(2),
          ay: data.ay.toFixed(2),
          az: data.az.toFixed(2),
          roll: data.roll.toFixed(1),
          pitch: data.pitch.toFixed(1),
          tilt_detected: data.tilt_detected,
        });
      }
      setCurrentReading(data);
    });

    // Note: GPS data now comes from location service (phone), not BLE
    // BLE GPS callback is kept for backward compatibility but location service takes priority
    bleManagerRef.current.setGPSDataCallback((gpsData: GPSData) => {
      // Only update if location service GPS is not available
      // Location service GPS takes priority
      if (!isGPSEnabled && locationServiceRef.current) {
        gpsCountRef.current += 1;
        if (gpsCountRef.current % 5 === 0) {
          console.log(`📍 DeviceContext: Received GPS data from BLE (reading #${gpsCountRef.current})`);
        }
        setCurrentGPSData(gpsData);
      }
    });

    // Set disconnection callback to handle unexpected disconnections
    bleManagerRef.current.setDisconnectedCallback((deviceId: string, error?: any) => {
      console.log('🔌 DeviceContext: Device disconnected unexpectedly', { deviceId, error });
      // Update state to reflect disconnection
      setIsConnected(false);
      setCurrentReading(null);
      // Don't clear GPS data as it comes from location service
    });
  }, [isInitialized, isGPSEnabled]);

  const stopReceiving = useCallback(() => {
    if (!bleManagerRef.current || !isInitialized) return;
    
    bleManagerRef.current.setDataCallback(() => {});
    bleManagerRef.current.setGPSDataCallback(() => {});
  }, [isInitialized]);

  const scanForDevices = useCallback(async (duration: number = 5): Promise<BLEDevice[]> => {
    if (!bleManagerRef.current || !isInitialized) {
      // BLE not available - return empty array silently
      // This is expected if using Expo Go or if native module isn't loaded
      return [];
    }
    
    try {
      // Initialize BLE manager if not already done
      await bleManagerRef.current.initialize();
      
      setIsScanning(true);
      const devices = await bleManagerRef.current.scanForDevices(duration);
      setIsScanning(false);
      return devices;
    } catch (error) {
      console.error('❌ Error scanning for devices:', error);
      setIsScanning(false);
      return [];
    }
  }, [isInitialized]);

  const connect = useCallback(async (deviceId: string, enableReconnect: boolean = true) => {
    if (!bleManagerRef.current || !isInitialized) {
      // BLE not available - return false silently
      // This is expected if using Expo Go or if native module isn't loaded
      return false;
    }
    
    try {
      // Initialize BLE manager if not already done
      await bleManagerRef.current.initialize();
      
      // Enable automatic reconnection
      if (enableReconnect) {
        bleManagerRef.current.setReconnectionEnabled(true, deviceId);
      }
      
      const connected = await bleManagerRef.current.connect(deviceId);
      if (connected) {
        setIsConnected(true);
        // Automatically start receiving data after connection
        startReceiving();
      }
      return connected;
    } catch (error) {
      console.error('❌ Error connecting to device:', error);
      return false;
    }
  }, [isInitialized, startReceiving]);

  const disconnect = useCallback(async () => {
    if (!bleManagerRef.current || !isInitialized) return;
    
    try {
      // Disable reconnection when manually disconnecting
      bleManagerRef.current.setReconnectionEnabled(false);
      await bleManagerRef.current.disconnect();
      setIsConnected(false);
      setCurrentReading(null);
      setCurrentGPSData(null);
    } catch (error) {
      console.error('❌ Error disconnecting from device:', error);
    }
  }, [isInitialized]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!bleManagerRef.current || !isInitialized) return false;
    return await bleManagerRef.current.requestPermissions();
  }, [isInitialized]);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!bleManagerRef.current || !isInitialized) return false;
    return await bleManagerRef.current.checkPermissions();
  }, [isInitialized]);

  const enableBluetooth = useCallback(async (): Promise<void> => {
    if (!bleManagerRef.current || !isInitialized) return;
    await bleManagerRef.current.enableBluetooth();
  }, [isInitialized]);

  const openSettings = useCallback(async (): Promise<void> => {
    if (!bleManagerRef.current || !isInitialized) return;
    await bleManagerRef.current.openSettings();
  }, [isInitialized]);

  const getBluetoothState = useCallback(async () => {
    if (!bleManagerRef.current || !isInitialized) {
      return {
        state: 'Unknown',
        isEnabled: false,
        hasPermissions: false,
        needsPermission: true,
        needsBluetooth: true,
      };
    }
    return await bleManagerRef.current.getBluetoothState();
  }, [isInitialized]);

  const startGPSTracking = useCallback(async () => {
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService();
    }

    const hasPermission = await locationServiceRef.current.checkPermissions();
    setHasLocationPermission(hasPermission);
    
    if (!hasPermission) {
      const granted = await locationServiceRef.current.requestPermissions();
      setHasLocationPermission(granted);
      if (!granted) {
        console.warn('Location permission denied - GPS tracking disabled');
        return;
      }
    }

    const started = await locationServiceRef.current.startTracking((data) => {
      setCurrentGPSData(data);
      setCurrentSpeed(data.speed); // Speed in m/s
      setIsGPSEnabled(true);
    });

    if (!started) {
      setIsGPSEnabled(false);
    }
  }, []);

  const stopGPSTracking = useCallback(() => {
    if (locationServiceRef.current) {
      locationServiceRef.current.stopTracking();
      setIsGPSEnabled(false);
      setCurrentGPSData(null);
      setCurrentSpeed(null);
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService();
    }
    const granted = await locationServiceRef.current.requestPermissions();
    setHasLocationPermission(granted);
    return granted;
  }, []);

  const checkLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService();
    }
    const hasPermission = await locationServiceRef.current.checkPermissions();
    setHasLocationPermission(hasPermission);
    return hasPermission;
  }, []);


  return (
    <DeviceContext.Provider
      value={{
        isConnected,
        currentReading,
        currentGPSData,
        currentSpeed,
        isGPSEnabled,
        hasLocationPermission,
        isScanning,
        scanForDevices,
        connect,
        disconnect,
        startReceiving,
        stopReceiving,
        startGPSTracking,
        stopGPSTracking,
        requestLocationPermission,
        checkLocationPermission,
        requestPermissions,
        checkPermissions,
        enableBluetooth,
        openSettings,
        getBluetoothState,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}

