import { hrAPI } from '@/utils/api';
import { ApiErrorHandler } from '@/utils/errorHandler';

interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class AdminController {
  static async fetchDashboardStats(): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getDashboardStats();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchEmployees(
    page: number = 1,
    perPage: number = 10,
    sortBy?: string,
    sortOrder?: string
  ): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getEmployees(page, perPage, sortBy, sortOrder);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchHolidays(page: number = 1, perPage: number = 10): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getHolidays(page, perPage);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async createHoliday(holidayData: {
    name: string;
    date: string;
    description?: string;
    location: string;
  }): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.createHoliday(holidayData);
      return { success: true, data, message: 'Holiday created successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async updateHoliday(
    holidayId: string,
    holidayData: { name: string; date: string; description?: string; location: string }
  ): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.updateHoliday(holidayId, holidayData);
      return { success: true, data, message: 'Holiday updated successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async deleteHoliday(holidayId: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.deleteHoliday(holidayId);
      return { success: true, data, message: 'Holiday deleted successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchLocations(): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getLocations();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchAllLeaveTypes(sortBy?: string, sortOrder?: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getAllLeaveTypes(sortBy, sortOrder);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async createLeaveType(data: { name: string; yearly_quota: number }): Promise<ControllerResponse> {
    try {
      const result = await hrAPI.createLeaveType(data);
      return { success: true, data: result, message: 'Leave type created successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async updateLeaveType(
    leaveTypeId: string,
    data: { name?: string; yearly_quota?: number; is_active?: boolean }
  ): Promise<ControllerResponse> {
    try {
      const result = await hrAPI.updateLeaveType(leaveTypeId, data);
      return { success: true, data: result, message: 'Leave type updated successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async deleteLeaveType(leaveTypeId: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.deleteLeaveType(leaveTypeId);
      return { success: true, data, message: 'Leave type deleted successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async assignHolidayToEmployees(data: {
    employee_ids: string[];
    holiday_id: string;
  }): Promise<ControllerResponse> {
    try {
      const result = await hrAPI.assignHolidayToEmployees(data);
      return { success: true, data: result, message: 'Holiday assigned successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchEmployeeHolidays(employeeId: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getEmployeeHolidays(employeeId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async removeHolidayAssignment(holidayId: string, employeeId?: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.removeHolidayAssignment(holidayId, employeeId);
      return { success: true, data, message: 'Holiday assignment removed successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async fetchEmployeeLedger(userId: string): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.getEmployeeLedger(userId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }

  static async updateEmployeeLedger(
    userId: string,
    ledgerData: { leave_type_id: string; remaining_days: number }
  ): Promise<ControllerResponse> {
    try {
      const data = await hrAPI.updateEmployeeLedger(userId, ledgerData);
      return { success: true, data, message: 'Ledger updated successfully' };
    } catch (error: any) {
      return { success: false, error: ApiErrorHandler.getErrorMessage(error) };
    }
  }
}
