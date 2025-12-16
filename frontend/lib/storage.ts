import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'sentry_access_token';
const REFRESH_TOKEN_KEY = 'sentry_refresh_token';

export const storeTokens = async (access: string, refresh: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
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

export const clearStoredTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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

