import { deviceApi } from '../lib/api';

export interface DeviceDataRequest {
  // Define based on device schema when available
  [key: string]: unknown;
}

export interface DeviceDataResponse {
  // Define based on device schema when available
  [key: string]: unknown;
}

export const deviceService = {
  sendDeviceData: async (data: DeviceDataRequest): Promise<DeviceDataResponse> => {
    const response = await deviceApi.post('/data', data);
    return response.data;
  },
};

