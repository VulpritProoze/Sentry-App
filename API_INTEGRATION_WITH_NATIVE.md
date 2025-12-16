# API Integration with Native - Implementation Plan

## Overview
This document outlines the plan for integrating backend API endpoints with the React Native frontend application, including authentication, user management, and device services.

---

## Implementation Checklist

### Phase 1: Setup and Configuration
- [x] Create `/frontend/lib` folder
- [x] Create `/frontend/services` folder
- [x] Create `/frontend/context` folder
- [x] Create `/frontend/hooks` folder
- [x] Install `axios`: `npm install axios` (already installed)
- [x] Install `@tanstack/react-query`: `npm install @tanstack/react-query` (already installed)
- [x] Install `expo-secure-store`: `npx expo install expo-secure-store` (already installed)
- [x] Create `/frontend/lib/storage.ts` with:
  - [x] Import `expo-secure-store`
  - [x] Define token key constants
  - [x] Implement `storeTokens()` function
  - [x] Implement `getStoredToken()` function
  - [x] Implement `getStoredRefreshToken()` function
  - [x] Implement `clearStoredTokens()` function
  - [x] Add error handling to all functions

### Phase 2: API Client Setup
- [x] Create `/frontend/lib/api.ts` with:
  - [x] Import `axios`
  - [x] Import storage functions from `./storage`
  - [x] Set up `API_URL` from environment variable
  - [x] Create `coreApi` axios instance with base URL `${API_URL}/core`
  - [x] Create `deviceApi` axios instance with base URL `${API_URL}/device`
  - [x] Add request interceptor to `coreApi`:
    - [x] Skip token for `/auth/login`, `/auth/register`, `/auth/logout`
    - [x] Add `Authorization: Bearer {token}` header for other requests
    - [x] Handle async token retrieval
  - [x] Add response interceptor to `coreApi`:
    - [x] Handle 401 errors
    - [x] Skip refresh for login/register/logout/refresh endpoints
    - [x] Call `/auth/refresh` endpoint on 401
    - [x] Store new tokens after refresh
    - [x] Retry original request with new token
    - [x] Handle refresh failure (clear tokens, logout)
  - [x] Export `coreApi` and `deviceApi`

### Phase 3: Service Layer
- [x] Create `/frontend/services/auth.service.ts`:
  - [x] Import `coreApi` from `../lib/api`
  - [x] Define `LoginRequest` interface
  - [x] Define `RegisterRequest` interface
  - [x] Define `LoginResponse` interface
  - [x] Define `RefreshTokenRequest` interface
  - [x] Implement `authService.login()`
  - [x] Implement `authService.register()`
  - [x] Implement `authService.refreshToken()`
  - [x] Implement `authService.getCurrentUser()`
  - [x] Implement `authService.isUserVerified()`
  - [x] Implement `authService.sendVerificationEmail()`
  - [x] Implement `authService.verifyEmail()`
  - [x] Implement `authService.forgotPassword()`
  - [x] Implement `authService.resetPassword()`

- [x] Create `/frontend/services/user.service.ts`:
  - [x] Import `coreApi` from `../lib/api`
  - [x] Define `User` interface
  - [x] Define `LovedOne` interface
  - [x] Define `LovedOneListResponse` interface
  - [x] Define `UserUpdateRequest` interface
  - [x] Implement `userService.getUserInfo()`
  - [x] Implement `userService.updateUserInfo()`
  - [x] Implement `userService.updateProfilePicture()` with FormData

- [x] Create `/frontend/services/loved_one.service.ts`:
  - [x] Import `coreApi` from `../lib/api`
  - [x] Import `LovedOneListResponse` from `./user.service`
  - [x] Implement `lovedOneService.getLovedOnes()`
  - [x] Re-export types from `user.service`

- [x] Create `/frontend/services/device.service.ts`:
  - [x] Import `deviceApi` from `../lib/api`
  - [x] Define `DeviceDataRequest` interface (based on backend schema)
  - [x] Define `DeviceDataResponse` interface (based on backend schema)
  - [x] Implement `deviceService.sendDeviceData()`

### Phase 4: TanStack Query Integration
- [x] Create `/frontend/lib/queryClient.ts`:
  - [x] Import `QueryClient` from `@tanstack/react-query`
  - [x] Create and export `queryClient` with default options
  - [x] Configure retry, refetchOnWindowFocus, and staleTime

- [x] Update `/frontend/app/_layout.tsx`:
  - [x] Import `QueryClientProvider` from `@tanstack/react-query`
  - [x] Import `queryClient` from `../lib/queryClient`
  - [x] Wrap app content with `QueryClientProvider`

- [x] Create `/frontend/hooks/useAuth.ts`:
  - [x] Import TanStack Query hooks
  - [x] Import `authService` and storage functions
  - [x] Implement `useLogin()` hook
  - [x] Implement `useRegister()` hook
  - [x] Implement `useCurrentUser()` hook
  - [x] Implement `useLogout()` hook

- [x] Create `/frontend/hooks/useUser.ts`:
  - [x] Import TanStack Query hooks
  - [x] Import `userService`
  - [x] Implement `useUserInfo()` hook
  - [x] Implement `useUpdateUser()` hook
  - [x] Implement `useUpdateProfilePicture()` hook

- [x] Create `/frontend/hooks/useLovedOne.ts`:
  - [x] Import TanStack Query hooks
  - [x] Import `lovedOneService`
  - [x] Implement `useLovedOnes()` hook

### Phase 5: Auth Context Setup
- [x] Create `/frontend/context/AuthContext.tsx`:
  - [x] Import React hooks and TanStack Query
  - [x] Import `authService` and types
  - [x] Import `User` type from `user.service`
  - [x] Import storage functions
  - [x] Define `AuthContextType` interface
  - [x] Create `AuthContext` using `createContext`
  - [x] Create `AuthProvider` component:
    - [x] Set up state for `user` and `isInitializing`
    - [x] Implement `useQuery` for fetching current user
    - [x] Implement `useEffect` for auth initialization
    - [x] Implement `login()` function
    - [x] Implement `register()` function
    - [x] Implement `logout()` function
    - [x] Implement `refreshUser()` function
    - [x] Return `AuthContext.Provider` with value
  - [x] Create and export `useAuth()` hook

- [x] Update `/frontend/app/_layout.tsx`:
  - [x] Import `AuthProvider` from `../context/AuthContext`
  - [x] Wrap app with `AuthProvider` (inside `QueryClientProvider`)

- [x] Update `/frontend/lib/api.ts`:
  - [x] Add `logoutCallback` variable and `setLogoutCallback()` function
  - [x] Update response interceptor to call `logoutCallback` on refresh failure

- [x] Update `/frontend/context/AuthContext.tsx`:
  - [x] Add `useEffect` to set logout callback in API interceptor

### Phase 6: Pull-to-Refresh Implementation
- [x] Create `/frontend/hooks/useRefresh.ts` (optional):
  - [x] Import `useQueryClient` and `useState`
  - [x] Implement `useRefresh()` hook with query keys parameter
  - [x] Return `isRefreshing` state and `onRefresh` function

- [ ] Test pull-to-refresh in components:
  - [ ] Add `RefreshControl` to user profile screen
  - [ ] Add `RefreshControl` to loved ones list screen
  - [ ] Use TanStack Query's `refetch` or custom `useRefresh` hook

### Phase 7: Testing and Validation
- [ ] Test authentication flow:
  - [ ] Test login with valid credentials
  - [ ] Test login with invalid credentials
  - [ ] Test registration flow
  - [ ] Test logout functionality
  - [ ] Verify tokens are stored securely

- [ ] Test token refresh:
  - [ ] Test automatic token refresh on 401
  - [ ] Test refresh failure handling (logout)
  - [ ] Verify refresh doesn't trigger for login/register/logout

- [ ] Test API endpoints:
  - [ ] Test `getCurrentUser()` endpoint
  - [ ] Test `getUserInfo()` endpoint
  - [ ] Test `updateUserInfo()` endpoint
  - [ ] Test `updateProfilePicture()` endpoint
  - [ ] Test `getLovedOnes()` endpoint

- [ ] Test error handling:
  - [ ] Test network error handling
  - [ ] Test 401 error handling
  - [ ] Test 404 error handling
  - [ ] Test 500 error handling
  - [ ] Verify user-friendly error messages

- [ ] Test pull-to-refresh:
  - [ ] Test pull-to-refresh on user profile
  - [ ] Test pull-to-refresh on loved ones list
  - [ ] Verify data refreshes correctly

- [ ] Test offline behavior:
  - [ ] Test app behavior when offline
  - [ ] Test cached data display
  - [ ] Test error messages for offline state

### Phase 8: Integration and Polish
- [ ] Integrate auth screens:
  - [ ] Connect login screen to `useAuth().login`
  - [ ] Connect register screen to `useAuth().register`
  - [ ] Add loading states
  - [ ] Add error display

- [ ] Implement protected routes:
  - [ ] Add route protection based on `isAuthenticated`
  - [ ] Redirect to login if not authenticated
  - [ ] Handle `isInitializing` state (show loading)

- [ ] Implement user profile screen:
  - [ ] Display user information
  - [ ] Add pull-to-refresh
  - [ ] Add edit functionality
  - [ ] Add profile picture update

- [ ] Implement loved ones list screen:
  - [ ] Display loved ones list
  - [ ] Add pull-to-refresh
  - [ ] Add empty state

- [ ] Add error boundaries:
  - [ ] Create error boundary component
  - [ ] Wrap app with error boundary
  - [ ] Handle API errors gracefully

- [ ] Add request/response logging (optional):
  - [ ] Add console logging for debugging
  - [ ] Or integrate with logging service

- [ ] Code review and cleanup:
  - [ ] Review all TypeScript types
  - [ ] Ensure consistent error handling
  - [ ] Remove console.logs (or use proper logging)
  - [ ] Verify all imports are correct

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Environment Configuration](#environment-configuration)
3. [API Client Setup](#api-client-setup)
4. [Service Layer](#service-layer)
5. [State Management with TanStack Query](#state-management-with-tanstack-query)
6. [Auth Context](#auth-context)
7. [Authentication Integration](#authentication-integration)
8. [User API Integration](#user-api-integration)
9. [Pull-to-Refresh Implementation](#pull-to-refresh-implementation)
10. [Token Storage Utilities](#token-storage-utilities)
11. [Implementation Steps](#implementation-steps)
12. [Implementation Checklist](#implementation-checklist)
13. [API Endpoints Reference](#api-endpoints-reference)

---

## Project Structure

### New Folders to Create

```
frontend/
├── lib/
│   └── api.ts                 # Axios instances and interceptors
├── services/
│   ├── auth.service.ts        # Authentication service
│   ├── user.service.ts        # User management service
│   ├── loved_one.service.ts   # Loved one service
│   └── device.service.ts      # Device data service
├── context/
│   └── AuthContext.tsx        # Auth context for centralized auth state
└── hooks/
    ├── useAuth.ts             # Auth hooks with TanStack Query
    ├── useUser.ts             # User hooks with TanStack Query
    └── useLovedOne.ts         # Loved one hooks with TanStack Query
```

---

## Environment Configuration

### 1. Create `.env` file in `/frontend`

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Install Required Dependencies

```bash
cd frontend
npm install axios @tanstack/react-query
npm install --save-dev @types/react-native
```

---

## API Client Setup

### File: `/frontend/lib/api.ts`

This file will contain:
- Base API URL configuration from environment variable
- Axios instances for each service (core, device)
- Request/Response interceptors for 401 handling
- Token refresh logic

#### Key Features:
1. **Environment-based API URL**: Uses `EXPO_PUBLIC_API_URL` from environment
2. **Service-specific Axios instances**:
   - `coreApi` - For core endpoints (auth, user)
   - `deviceApi` - For device endpoints
3. **Request Interceptor**:
   - Adds JWT token to Authorization header
   - Skips interception for `/login`, `/register`, `/logout` endpoints
4. **Response Interceptor**:
   - Intercepts 401 Unauthorized responses
   - Automatically calls `/refresh` endpoint
   - Retries original request with new token
   - Handles refresh token failures (logout user)

#### Implementation Structure:

```typescript
// Base API URL from environment
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

// Request interceptor for coreApi
coreApi.interceptors.request.use(
  (config) => {
    // Skip token addition for login, register, logout
    const skipTokenEndpoints = ['/auth/login', '/auth/register', '/auth/logout'];
    const shouldSkip = skipTokenEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (!shouldSkip) {
      // Add token from storage
      const token = getStoredToken();
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
  async (error) => {
    const originalRequest = error.config;
    
    // Skip refresh for login, register, logout, refresh
    const skipRefreshEndpoints = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];
    const shouldSkip = skipRefreshEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );
    
    if (error.response?.status === 401 && !shouldSkip && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call refresh endpoint
        const refreshToken = getStoredRefreshToken();
        const response = await axios.post(`${API_URL}/core/auth/refresh`, {
          refresh: refreshToken,
        });
        
        // Store new tokens
        storeTokens(response.data.access, response.data.refresh);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return coreApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        clearStoredTokens();
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { coreApi, deviceApi };
```

---

## Service Layer

### File: `/frontend/services/auth.service.ts`

Service functions for authentication endpoints:

```typescript
import { coreApi } from '../lib/api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh: string;
}

// Service functions
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await coreApi.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await coreApi.post('/auth/register', data);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<LoginResponse> => {
    const response = await coreApi.post('/auth/refresh', { refresh });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await coreApi.get('/auth/me');
    return response.data;
  },

  isUserVerified: async (): Promise<{ is_verified: boolean }> => {
    const response = await coreApi.get('/auth/me/is-verified');
    return response.data;
  },

  sendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const response = await coreApi.post('/auth/email/send-verification-email', { email });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await coreApi.post('/auth/email/verify', { token });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await coreApi.post('/auth/email/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await coreApi.post('/auth/email/reset-password', { token, password });
    return response.data;
  },
};
```

### File: `/frontend/services/user.service.ts`

Service functions for user management endpoints:

```typescript
import { coreApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  is_verified: boolean;
}

export interface LovedOne {
  id: number;
  user_id: number;
  loved_one: User; // The user who is a loved one contact
  is_active: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface LovedOneListResponse {
  message: string;
  loved_ones: LovedOne[];
  count: number;
}

export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const userService = {
  getUserInfo: async (): Promise<User> => {
    const response = await coreApi.get('/user/me/info');
    return response.data;
  },

  updateUserInfo: async (data: UserUpdateRequest): Promise<User> => {
    const response = await coreApi.put('/user/me/update', data);
    return response.data;
  },

  updateProfilePicture: async (imageUri: string): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    
    const response = await coreApi.put('/user/me/profile-picture/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
```

### File: `/frontend/services/loved_one.service.ts`

Service functions for loved one endpoints:

```typescript
import { coreApi } from '../lib/api';
import { LovedOneListResponse } from './user.service';

export const lovedOneService = {
  getLovedOnes: async (): Promise<LovedOneListResponse> => {
    const response = await coreApi.get('/loved_one/me');
    return response.data;
  },
};

// Re-export types for convenience
export type { LovedOne, LovedOneListResponse } from './user.service';
```

### File: `/frontend/services/device.service.ts`

Service functions for device endpoints:

```typescript
import { deviceApi } from '../lib/api';

export interface DeviceDataRequest {
  // Define based on device schema
}

export interface DeviceDataResponse {
  // Define based on device schema
}

export const deviceService = {
  sendDeviceData: async (data: DeviceDataRequest): Promise<DeviceDataResponse> => {
    const response = await deviceApi.post('/data', data);
    return response.data;
  },
};
```

---

## State Management with TanStack Query

### Setup Query Client

Create `/frontend/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

### Wrap App with QueryClientProvider

Update `/frontend/app/_layout.tsx`:

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

// Add QueryClientProvider wrapper
```

---

## Auth Context

### Overview
The Auth Context centralizes authentication state management across the entire application, providing a single source of truth for user authentication status and user data.

### File: `/frontend/context/AuthContext.tsx`

This context provides:
- Centralized authentication state
- User data
- Authentication status (isAuthenticated, isLoading)
- Login/logout functions
- Automatic token refresh handling

#### Implementation:

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginRequest, RegisterRequest } from '../services/auth.service';
import { User } from '../services/user.service';
import { getStoredToken, storeTokens, clearStoredTokens } from '../lib/storage';

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user if token exists
  const { data: currentUser, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const token = await getStoredToken();
      if (!token) {
        return null;
      }
      return authService.getCurrentUser();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          await refetch();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await clearStoredTokens();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [refetch]);

  // Update user state when query data changes
  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser);
    }
  }, [currentUser]);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await authService.login(credentials);
      await storeTokens(response.access, response.refresh);
      setUser(response.user);
      queryClient.setQueryData(['auth', 'currentUser'], response.user);
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      const response = await authService.register(data);
      await storeTokens(response.access, response.refresh);
      setUser(response.user);
      queryClient.setQueryData(['auth', 'currentUser'], response.user);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await clearStoredTokens();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Usage Example

```typescript
import { useAuth } from '../context/AuthContext';

export const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    login,
    logout 
  } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <View>
      <Text>Welcome, {user?.first_name}!</Text>
      <Button onPress={logout} title="Logout" />
    </View>
  );
};
```

### Integration with App Layout

Update `/frontend/app/_layout.tsx` to wrap the app with `AuthProvider`:

```typescript
import { AuthProvider } from '../context/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Your app content */}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Integration with API Interceptors

The auth context should be integrated with the API interceptors to handle token refresh and logout on 401 errors. Update `/frontend/lib/api.ts` to use the auth context for logout:

```typescript
// In api.ts, you can create a logout callback that will be set by AuthContext
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// In response interceptor, call logoutCallback on refresh failure
if (refreshError) {
  clearStoredTokens();
  if (logoutCallback) {
    logoutCallback();
  }
  return Promise.reject(refreshError);
}
```

Then in `AuthContext.tsx`, set the callback:

```typescript
useEffect(() => {
  import('../lib/api').then(({ setLogoutCallback }) => {
    setLogoutCallback(logout);
  });
}, [logout]);
```

---

## Authentication Integration

### File: `/frontend/hooks/useAuth.ts`

Custom hooks for authentication with TanStack Query:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { storeTokens, clearStoredTokens } from '../lib/storage';

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      storeTokens(data.access, data.refresh);
      queryClient.setQueryData(['user'], data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      storeTokens(data.access, data.refresh);
      queryClient.setQueryData(['user'], data.user);
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    enabled: !!getStoredToken(), // Only fetch if token exists
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      clearStoredTokens();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
```

---

## User API Integration

### File: `/frontend/hooks/useUser.ts`

Custom hooks for user management:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';

export const useUserInfo = () => {
  return useQuery({
    queryKey: ['user', 'info'],
    queryFn: userService.getUserInfo,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateUserInfo,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'info'], data);
      queryClient.setQueryData(['user'], data);
    },
  });
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfilePicture,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'info'], data);
      queryClient.setQueryData(['user'], data);
    },
  });
};
```

### File: `/frontend/hooks/useLovedOne.ts`

Custom hooks for loved one management:

```typescript
import { useQuery } from '@tanstack/react-query';
import { lovedOneService } from '../services/loved_one.service';

export const useLovedOnes = () => {
  return useQuery({
    queryKey: ['loved_ones'],
    queryFn: lovedOneService.getLovedOnes,
  });
};
```

---

## Pull-to-Refresh Implementation

### Using TanStack Query's `refetch` Function

Example implementation in a component:

```typescript
import { RefreshControl } from 'react-native';
import { useUserInfo } from '../hooks/useUser';

export const UserProfileScreen = () => {
  const { data, isLoading, refetch, isRefetching } = useUserInfo();
  
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
        />
      }
    >
      {/* Content */}
    </ScrollView>
  );
};
```

### Alternative: Custom Hook for Pull-to-Refresh

Create `/frontend/hooks/useRefresh.ts`:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useRefresh = (queryKeys: string[][]) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map(key => queryClient.refetchQueries({ queryKey: key }))
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return { isRefreshing, onRefresh };
};
```

---

## Token Storage Utilities

### File: `/frontend/lib/storage.ts`

Token storage functions using `expo-secure-store` for encrypted storage:

**Why expo-secure-store?**
- **Encrypted Storage**: Uses iOS Keychain and Android Keystore for secure, encrypted storage
- **Hardware-backed Security**: On devices with hardware security modules, keys are stored in secure hardware
- **Expo Native**: Built-in Expo solution, no additional native code required
- **Better Security**: Much more secure than AsyncStorage which stores data in plain text

```typescript
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
```

**Note**: Install `expo-secure-store` if not already installed:
```bash
npx expo install expo-secure-store
```

### Alternative: react-native-keychain (for bare React Native)

If you're using bare React Native (not Expo), use `react-native-keychain` instead:

```typescript
import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'sentry_access_token';
const REFRESH_TOKEN_KEY = 'sentry_refresh_token';

export const storeTokens = async (access: string, refresh: string): Promise<void> => {
  await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, access);
  await Keychain.setInternetCredentials(
    REFRESH_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    refresh
  );
};

export const getStoredToken = async (): Promise<string | null> => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? credentials.password : null;
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  const credentials = await Keychain.getInternetCredentials(REFRESH_TOKEN_KEY);
  return credentials ? credentials.password : null;
};

export const clearStoredTokens = async (): Promise<void> => {
  await Keychain.resetGenericPassword();
  await Keychain.resetInternetCredentials(REFRESH_TOKEN_KEY);
};
```

---

## Implementation Steps

### Phase 1: Setup and Configuration
1. ✅ Create `/frontend/lib` folder
2. ✅ Create `/frontend/services` folder
3. ✅ Install dependencies: `axios`, `@tanstack/react-query`, `expo-secure-store` (already installed)
4. ✅ Create `/frontend/lib/storage.ts` for token management

### Phase 2: API Client Setup
1. ✅ Create `/frontend/lib/api.ts` with:
   - Environment variable for API URL
   - `coreApi` axios instance
   - `deviceApi` axios instance
   - Request interceptor (token injection, skip for login/register/logout)
   - Response interceptor (401 handling, token refresh)

### Phase 3: Service Layer
1. ✅ Create `/frontend/services/auth.service.ts` with all auth endpoints
2. ✅ Create `/frontend/services/user.service.ts` with all user endpoints
3. ✅ Create `/frontend/services/loved_one.service.ts` with loved one endpoints
4. ✅ Create `/frontend/services/device.service.ts` with device endpoints

### Phase 4: TanStack Query Integration
1. ✅ Create `/frontend/lib/queryClient.ts`
2. ✅ Update `/frontend/app/_layout.tsx` to wrap with `QueryClientProvider`
3. ✅ Create `/frontend/hooks/useAuth.ts` with auth hooks
4. ✅ Create `/frontend/hooks/useUser.ts` with user hooks
5. ✅ Create `/frontend/hooks/useLovedOne.ts` with loved one hooks

### Phase 4.5: Auth Context Setup
1. ✅ Create `/frontend/context` folder
2. ✅ Create `/frontend/context/AuthContext.tsx` with:
   - Centralized auth state management
   - User mode support (user, loved_one)
   - User mode helper functions
   - Login, register, logout functions
   - Integration with TanStack Query
3. ✅ Update `/frontend/app/_layout.tsx` to wrap with `AuthProvider`
4. ✅ Integrate auth context with API interceptors for automatic logout

### Phase 5: Pull-to-Refresh
1. ✅ Implement pull-to-refresh in components using TanStack Query's `refetch`
2. ✅ Create optional `/frontend/hooks/useRefresh.ts` for reusable refresh logic

### Phase 6: Testing
1. Test login flow
2. Test token refresh on 401
3. Test user info fetching
4. Test pull-to-refresh functionality
5. Test error handling

---

## API Endpoints Reference

### Authentication Endpoints (`/api/v1/core/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user (requires auth)
- `GET /me/is-verified` - Check if user is verified (requires auth)
- `POST /email/send-verification-email` - Send verification email
- `POST /email/verify` - Verify email with token
- `POST /email/forgot-password` - Request password reset
- `POST /email/reset-password` - Reset password with token

### User Endpoints (`/api/v1/core/user`)
- `GET /me/info` - Get user information (requires auth)
- `PUT /me/update` - Update user information (requires auth)
- `PUT /me/profile-picture/update` - Update profile picture (requires auth)

### Loved One Endpoints (`/api/v1/core/loved_one`)
- `GET /me` - Get all loved ones for the current user (requires auth)

### Device Endpoints (`/api/v1/device`)
- `POST /data` - Send device sensor data (requires API key)

---

## Notes

1. **Token Storage**: Use `expo-secure-store` for encrypted token persistence (iOS Keychain/Android Keystore)
2. **Error Handling**: Implement proper error handling in all service functions
3. **Type Safety**: Define TypeScript interfaces for all request/response types
4. **Loading States**: Use TanStack Query's built-in loading states
5. **Caching**: Leverage TanStack Query's caching for optimal performance
6. **Network Errors**: Handle network errors gracefully with user-friendly messages

---

## Dependencies to Install

```bash
cd frontend
npm install axios @tanstack/react-query
npx expo install expo-secure-store
```

**Note**: For Expo projects, use `npx expo install` for Expo packages to ensure version compatibility.

---

## Environment Variables

Create `/frontend/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production, update to:
```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

---

## Next Steps After Implementation

1. Integrate auth screens (login, register) with the auth context
2. Add protected route navigation based on auth state from context
3. Implement user profile screen with pull-to-refresh
4. Implement loved ones list screen with pull-to-refresh
5. Add error boundaries for API errors
6. Implement offline support with TanStack Query
7. Add request/response logging for debugging

