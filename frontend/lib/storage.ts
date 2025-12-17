import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'sentry_access_token';
const REFRESH_TOKEN_KEY = 'sentry_refresh_token';
const REMEMBER_ME_KEY = 'sentry_remember_me';

export const storeTokens = async (access: string, refresh: string, rememberMe: boolean = true): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
    await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error;
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

export const getRememberMePreference = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error retrieving remember me preference:', error);
    return false;
  }
};

export const clearStoredTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    // Optionally clear remember me preference on logout
    // await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    throw error;
  }
};

// Theme preference storage
const THEME_PREFERENCE_KEY = 'sentry_theme_preference';

export const storeThemePreference = async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
  try {
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, theme);
  } catch (error) {
    console.error('Error storing theme preference:', error);
    throw error;
  }
};

export const getStoredThemePreference = async (): Promise<'light' | 'dark' | 'system' | null> => {
  try {
    const theme = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving theme preference:', error);
    return null;
  }
};

// Crash alert interval storage
const CRASH_ALERT_INTERVAL_KEY = 'sentry_crash_alert_interval';

export const storeCrashAlertInterval = async (intervalSeconds: number): Promise<void> => {
  try {
    await SecureStore.setItemAsync(CRASH_ALERT_INTERVAL_KEY, intervalSeconds.toString());
  } catch (error) {
    console.error('Error storing crash alert interval:', error);
    throw error;
  }
};

export const getStoredCrashAlertInterval = async (): Promise<number | null> => {
  try {
    const value = await SecureStore.getItemAsync(CRASH_ALERT_INTERVAL_KEY);
    if (value) {
      const interval = parseInt(value, 10);
      if (!isNaN(interval) && interval > 0) {
        return interval;
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving crash alert interval:', error);
    return null;
  }
};

