import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, UserUpdateRequest } from '../services/user.service';

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
      queryClient.setQueryData(['auth', 'currentUser'], data);
    },
  });
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfilePicture,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'info'], data);
      queryClient.setQueryData(['auth', 'currentUser'], data);
    },
  });
};

