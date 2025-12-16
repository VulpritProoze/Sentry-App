import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginRequest, RegisterRequest } from '../services/auth.service';
import { storeTokens, clearStoredTokens, getStoredToken } from '../lib/storage';

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      storeTokens(data.access_token, data.refresh_token);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'info'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      storeTokens(data.access_token, data.refresh_token);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'info'] });
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const token = await getStoredToken();
      if (!token) {
        return null;
      }
      return authService.getCurrentUser();
    },
    enabled: false, // Will be enabled by AuthContext
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await clearStoredTokens();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

