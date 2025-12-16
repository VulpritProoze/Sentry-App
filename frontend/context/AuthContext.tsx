import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginRequest, RegisterRequest } from '../services/auth.service';
import { User } from '../services/user.service';
import { getStoredToken, storeTokens, clearStoredTokens } from '../lib/storage';
import { setLogoutCallback } from '../lib/api';

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
      await storeTokens(response.access_token, response.refresh_token);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      queryClient.setQueryData(['auth', 'currentUser'], userData);
      queryClient.setQueryData(['user', 'info'], userData);
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      const response = await authService.register(data);
      await storeTokens(response.access_token, response.refresh_token);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      queryClient.setQueryData(['auth', 'currentUser'], userData);
      queryClient.setQueryData(['user', 'info'], userData);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await clearStoredTokens();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [queryClient]);

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  // Set logout callback for API interceptor
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

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

