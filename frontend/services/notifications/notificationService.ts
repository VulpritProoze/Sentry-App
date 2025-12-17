import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
}

class NotificationService {
  private periodicNotificationId: string | null = null;

  /**
   * Request notification permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('⚠️ Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('❌ Failed to get push token - permission denied');
      return false;
    }

    return true;
  }

  /**
   * Get Expo Push Token (this works with Firebase backend)
   * The backend can use this token to send notifications via Firebase
   */
  async getPushToken(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      // Get project ID from Expo config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.expoConfig?.projectId;
      
      if (!projectId) {
        console.error('❌ Expo project ID not found. Please set it in app.json');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId as string,
      });
      
      console.log('✅ Expo Push Token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  /**
   * Send a local notification immediately (for testing)
   */
  async sendLocalNotification(config: NotificationConfig): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: config.data || {},
        sound: config.sound !== false, // Default to true
      },
      trigger: null, // Show immediately
    });

    return notificationId;
  }

  /**
   * Start periodic notifications (every N seconds) - for testing
   */
  async startPeriodicNotifications(intervalSeconds: number = 5): Promise<string | null> {
    // Cancel existing periodic notification if any
    if (this.periodicNotificationId) {
      await this.stopPeriodicNotifications();
    }

    try {
      this.periodicNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: `This is a test notification sent every ${intervalSeconds} seconds`,
          data: { 
            type: 'test', 
            timestamp: Date.now(),
            interval: intervalSeconds 
          },
          sound: true,
        },
        trigger: {
          seconds: intervalSeconds,
          repeats: true,
        },
      });

      console.log(`✅ Started periodic notifications every ${intervalSeconds} seconds`);
      return this.periodicNotificationId;
    } catch (error) {
      console.error('❌ Error starting periodic notifications:', error);
      return null;
    }
  }

  /**
   * Stop periodic notifications
   */
  async stopPeriodicNotifications(): Promise<void> {
    if (this.periodicNotificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(this.periodicNotificationId);
        console.log('✅ Stopped periodic notifications');
        this.periodicNotificationId = null;
      } catch (error) {
        console.error('❌ Error stopping periodic notifications:', error);
      }
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.periodicNotificationId = null;
    console.log('✅ Cancelled all notifications');
  }

  /**
   * Setup notification listeners
   * @param onNotificationReceived - Called when notification received in foreground
   * @param onNotificationTapped - Called when user taps a notification
   * @returns Cleanup function to remove listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    // Foreground notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received (foreground):', notification);
        onNotificationReceived?.(notification);
      }
    );

    // Background/quit state notifications (when user taps)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 User tapped notification:', response);
        const data = response.notification.request.content.data;
        onNotificationTapped?.(response);
      }
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService();

