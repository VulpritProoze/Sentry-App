import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { notificationService } from '@/services/notifications/notificationService';
import { deviceApi } from '@/lib/api';

export interface FCMTokenRegistration {
  fcm_token: string;
  device_id: string;
  platform: 'ios' | 'android';
}

export function useFCM() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPeriodicActive, setIsPeriodicActive] = useState(false);
  const notificationListener = useRef<ReturnType<typeof notificationService.setupNotificationListeners>>();

  useEffect(() => {
    // Register for push notifications on mount
    const register = async () => {
      const token = await notificationService.getPushToken();
      if (token) {
        setPushToken(token);
        setIsRegistered(true);
        
        // Send token to backend
        try {
          const deviceId = Device.modelName || Device.osName || 'unknown';
          await deviceApi.post('/mobile/fcm/token', {
            fcm_token: token,
            device_id: deviceId,
            platform: Platform.OS as 'ios' | 'android',
          });
          console.log('✅ FCM token registered with backend');
        } catch (error: any) {
          console.error('❌ Failed to register FCM token:', error?.response?.data || error?.message);
          // Don't fail silently - token is still valid for local notifications
          // The endpoint might not exist yet, which is okay for testing
        }
      }
    };

    register();

    // Setup notification listeners
    notificationListener.current = notificationService.setupNotificationListeners(
      (notification) => {
        console.log('📬 Notification received in app:', notification);
        // You can handle foreground notifications here
      },
      (response) => {
        console.log('👆 User tapped notification:', response);
        // Handle navigation or action based on notification data
        const data = response.notification.request.content.data;
        if (data?.type === 'crash_detected') {
          // Navigate to crash details, etc.
          console.log('Crash notification tapped:', data);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
    };
  }, []);

  const sendTestNotification = async () => {
    await notificationService.sendLocalNotification({
      title: '🧪 Test Notification',
      body: 'This is a one-time test notification',
      data: { type: 'test', timestamp: Date.now() },
    });
  };

  const startPeriodicTest = async (intervalSeconds: number = 5) => {
    const id = await notificationService.startPeriodicNotifications(intervalSeconds);
    if (id) {
      setIsPeriodicActive(true);
    }
  };

  const stopPeriodicTest = async () => {
    await notificationService.stopPeriodicNotifications();
    setIsPeriodicActive(false);
  };

  return {
    pushToken,
    isRegistered,
    isPeriodicActive,
    sendTestNotification,
    startPeriodicTest,
    stopPeriodicTest,
  };
}

