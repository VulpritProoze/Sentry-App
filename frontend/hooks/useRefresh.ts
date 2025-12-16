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

