/** Device context for BLE connection state. */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { SensorReading, BLEDevice } from '@/types/device';
import { BLEManager } from '@/services/bluetooth/bleManager';

interface DeviceContextType {
  isConnected: boolean;
  currentReading: SensorReading | null;
  isScanning: boolean;
  scanForDevices: (duration?: number) => Promise<BLEDevice[]>;
  connect: (deviceId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  startReceiving: () => void;
  stopReceiving: () => void;
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
  const [isScanning, setIsScanning] = useState(false);
  const bleManagerRef = useRef<BLEManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const readingCountRef = useRef(0);

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
  }, [isInitialized]);

  const stopReceiving = useCallback(() => {
    if (!bleManagerRef.current || !isInitialized) return;
    
    bleManagerRef.current.setDataCallback(() => {});
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

  const connect = useCallback(async (deviceId: string) => {
    if (!bleManagerRef.current || !isInitialized) {
      // BLE not available - return false silently
      // This is expected if using Expo Go or if native module isn't loaded
      return false;
    }
    
    try {
      // Initialize BLE manager if not already done
      await bleManagerRef.current.initialize();
      
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
      await bleManagerRef.current.disconnect();
      setIsConnected(false);
      setCurrentReading(null);
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


  return (
    <DeviceContext.Provider
      value={{
        isConnected,
        currentReading,
        isScanning,
        scanForDevices,
        connect,
        disconnect,
        startReceiving,
        stopReceiving,
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

