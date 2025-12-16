import { coreApi } from '../lib/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  profile_picture: string | null;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_verified?: boolean; // May not be in UserSchema but exists in model
  last_login: string | null; // ISO datetime string
  date_joined: string; // ISO datetime string
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
  middle_name?: string | null;
  last_name?: string;
}

export interface UserInfoResponse {
  message: string;
  user: User;
}

export const userService = {
  getUserInfo: async (): Promise<User> => {
    const response = await coreApi.get<UserInfoResponse>('/user/me/info');
    return response.data.user;
  },

  updateUserInfo: async (data: UserUpdateRequest): Promise<User> => {
    // Backend returns { message } only, so we need to refetch user info
    await coreApi.put('/user/me/update', data);
    // Refetch to get updated user data
    const response = await coreApi.get<UserInfoResponse>('/user/me/info');
    return response.data.user;
  },

  updateProfilePicture: async (imageUri: string): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    
    // Backend returns { message } only, so we need to refetch user info
    await coreApi.put('/user/me/profile-picture/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Refetch to get updated user data
    const response = await coreApi.get<UserInfoResponse>('/user/me/info');
    return response.data.user;
  },
};

