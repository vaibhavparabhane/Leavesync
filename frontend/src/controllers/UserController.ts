import { api } from '@/utils/api';
import { ApiErrorHandler } from '@/utils/errorHandler';

interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class UserController {
  static async fetchMyProfile(): Promise<ControllerResponse> {
    try {
      const response = await api.get('/users/me');
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async updateMyProfile(data: { full_name: string }): Promise<ControllerResponse> {
    try {
      const response = await api.put('/users/me', data);
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }
}
