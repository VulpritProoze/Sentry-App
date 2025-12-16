import { coreApi } from '../lib/api';
import { User } from './user.service';

// Types
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface MessageResponse {
  message: string;
}

export interface IsUserVerifiedResponse {
  is_verified: boolean;
  message: string;
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
    const response = await coreApi.post('/auth/refresh', { refresh_token: refresh });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    // Note: /auth/me only returns a message, so we use /user/me/info instead
    const response = await coreApi.get('/user/me/info');
    return response.data.user;
  },

  isUserVerified: async (): Promise<IsUserVerifiedResponse> => {
    const response = await coreApi.get('/auth/me/is-verified');
    return response.data;
  },

  sendVerificationEmail: async (email: string): Promise<MessageResponse> => {
    const response = await coreApi.post('/auth/email/send-verification-email', { email });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<MessageResponse> => {
    const response = await coreApi.post('/auth/email/verify', { token });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await coreApi.post('/auth/email/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, new_password: string): Promise<MessageResponse> => {
    const response = await coreApi.post('/auth/email/reset-password', { token, new_password });
    return response.data;
  },
};

