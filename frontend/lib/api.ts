import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStoredRefreshToken, getStoredToken, storeTokens, clearStoredTokens } from './storage';

// Base API URL from environment
// In Expo, environment variables must be prefixed with EXPO_PUBLIC_ to be accessible in client code
const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const API_URL = `${BASE_API_URL}/api/v1`;

// Logout callback for handling refresh failures
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Core API instance (for auth and user endpoints)
const coreApi = axios.create({
  baseURL: `${API_URL}/core`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Device API instance
const deviceApi = axios.create({
  baseURL: `${API_URL}/device`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for deviceApi (adds JWT token for mobile endpoints)
deviceApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only add JWT token for mobile endpoints (which use JWT auth)
    // Other endpoints like /data use API key auth
    if (config.url?.startsWith('/mobile/')) {
      const token = await getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for deviceApi (401 handling for mobile endpoints)
deviceApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Only handle 401 for mobile endpoints (which use JWT auth)
    if (error.response?.status === 401 && 
        originalRequest.url?.startsWith('/mobile/') && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call refresh endpoint
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/core/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        // Store new tokens
        await storeTokens(response.data.access_token, response.data.refresh_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return deviceApi(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, logout user
        await clearStoredTokens();
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for coreApi
coreApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token addition for login, register, logout
    const skipTokenEndpoints = ['/auth/login', '/auth/register', '/auth/logout'];
    const shouldSkip = skipTokenEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!shouldSkip) {
      // Add token from storage
      const token = await getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
coreApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Skip refresh for login, register, logout, refresh
    const skipRefreshEndpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];
    const shouldSkip = skipRefreshEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && !shouldSkip && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call refresh endpoint
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/core/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        // Store new tokens
        await storeTokens(response.data.access_token, response.data.refresh_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return coreApi(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, logout user
        await clearStoredTokens();
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { coreApi, deviceApi };


