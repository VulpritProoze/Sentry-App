import { useQuery } from '@tanstack/react-query';
import { lovedOneService } from '../services/loved_one.service';

export const useLovedOnes = () => {
  return useQuery({
    queryKey: ['loved_ones'],
    queryFn: lovedOneService.getLovedOnes,
  });
};

