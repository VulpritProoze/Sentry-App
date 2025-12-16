import { coreApi } from '../lib/api';
import { LovedOneListResponse } from './user.service';

export const lovedOneService = {
  getLovedOnes: async (): Promise<LovedOneListResponse> => {
    const response = await coreApi.get('/loved-one/me');
    return response.data;
  },
};

// Re-export types for convenience
export type { LovedOne, LovedOneListResponse } from './user.service';

