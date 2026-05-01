import { leaveAPI } from '@/utils/api';
import { ApiErrorHandler } from '@/utils/errorHandler';
import { ApiRetry } from '@/utils/apiRetry';
import { ApiCache } from '@/utils/apiCache';

interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class LeaveController {
  static async fetchLeaveRecords(
    page: number = 1,
    perPage: number = 10,
    status?: string,
    sortBy?: string,
    sortOrder?: string
  ): Promise<ControllerResponse> {
    try {
      const cacheKey = ApiCache.generateKey('/leaves/my', { page, perPage, status, sortBy, sortOrder });
      const cached = ApiCache.get(cacheKey);
      if (cached) return { success: true, data: cached };

      const data = await ApiRetry.executeWithRetry(() => 
        leaveAPI.getMyLeaves(page, perPage, status, sortBy, sortOrder)
      );
      ApiCache.set(cacheKey, data, 60000);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchAllLeaves(
    page: number = 1,
    perPage: number = 10,
    status?: string,
    sortBy?: string,
    sortOrder?: string,
    search?: string
  ): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.getAllLeaves(page, perPage, status, sortBy, sortOrder, search);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchLeaveStats(): Promise<ControllerResponse> {
    try {
      const cacheKey = '/leaves/my/stats';
      const cached = ApiCache.get(cacheKey);
      if (cached) return { success: true, data: cached };

      const data = await ApiRetry.executeWithRetry(() => leaveAPI.getMyStats());
      ApiCache.set(cacheKey, data, 30000);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchLeaveBalance(): Promise<ControllerResponse> {
    try {
      const response = await leaveAPI.getMyBalance();
      // Backend returns {data: [...]} so extract the array
      const data = Array.isArray(response) ? response : (response?.data || []);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchLeaveTypes(): Promise<ControllerResponse> {
    try {
      const cacheKey = '/leaves/types';
      const cached = ApiCache.get(cacheKey);
      if (cached) return { success: true, data: cached };

      const response = await ApiRetry.executeWithRetry(() => leaveAPI.getLeaveTypes());
      // Backend returns {data: [...]} so extract the array
      const data = Array.isArray(response) ? response : (response?.data || []);
      ApiCache.set(cacheKey, data, 300000);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async submitLeaveApplication(leaveData: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    leave_duration?: string;
    reason: string;
  }): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.applyLeave(leaveData);
      ApiCache.clear('/leaves/my');
      ApiCache.clear('/leaves/my/balance');
      ApiCache.clear('/leaves/my/stats');
      return { success: true, data, message: 'Leave applied successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async approveLeave(leaveId: string, forceApprove: boolean = false): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.approveLeave(leaveId, forceApprove);
      return { success: true, data, message: 'Leave approved successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async rejectLeave(leaveId: string, rejectionReason?: string): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.rejectLeave(leaveId, rejectionReason);
      return { success: true, data, message: 'Leave rejected successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchPendingLeaves(
    page: number = 1,
    perPage: number = 10,
    sortBy?: string,
    sortOrder?: string,
    search?: string
  ): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.getPendingLeaves(page, perPage, sortBy, sortOrder, search);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchEmployeeHolidays(): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.getMyHolidays();
      const holidays = Array.isArray(data) ? data : (data?.holidays || data?.data || []);
      return { success: true, data: holidays };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error), data: [] };
    }
  }

  static async requestCancellation(leaveId: string, cancellationReason?: string): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.requestCancellation(leaveId, cancellationReason);
      ApiCache.clear('/leaves/my');
      return { success: true, data, message: 'Cancellation requested successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async approveCancellation(leaveId: string): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.approveCancellation(leaveId);
      return { success: true, data, message: 'Cancellation approved successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async rejectCancellation(leaveId: string): Promise<ControllerResponse> {
    try {
      const data = await leaveAPI.rejectCancellation(leaveId);
      return { success: true, data, message: 'Cancellation rejected successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }
}
