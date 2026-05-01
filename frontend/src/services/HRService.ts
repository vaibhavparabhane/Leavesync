export class HRService {
  static validateHolidayData(data: {
    name: string;
    date: string;
    location: string;
    description?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Holiday name is required');
    }

    if (!data.date) {
      errors.push('Holiday date is required');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Location is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateLeaveTypeData(data: {
    name: string;
    yearly_quota: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Leave type name is required');
    }

    if (data.yearly_quota === undefined || data.yearly_quota === null) {
      errors.push('Yearly quota is required');
    }

    if (data.yearly_quota < 0) {
      errors.push('Yearly quota cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static formatEmployeeName(fullName: string): string {
    return fullName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  static calculateLeaveUtilization(totalQuota: number, usedDays: number): number {
    if (totalQuota === 0) return 0;
    return Math.round((usedDays / totalQuota) * 100);
  }

  static isHolidayUpcoming(holidayDate: string): boolean {
    const today = new Date();
    const holiday = new Date(holidayDate);
    today.setHours(0, 0, 0, 0);
    holiday.setHours(0, 0, 0, 0);
    return holiday >= today;
  }

  static sortHolidaysByDate(holidays: Array<{ date: string; [key: string]: any }>): Array<{ date: string; [key: string]: any }> {
    return [...holidays].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  static filterUpcomingHolidays(holidays: Array<{ date: string; [key: string]: any }>): Array<{ date: string; [key: string]: any }> {
    return holidays.filter(holiday => this.isHolidayUpcoming(holiday.date));
  }

  static validateLedgerUpdate(data: {
    leave_type_id: string;
    remaining_days: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.leave_type_id) {
      errors.push('Leave type is required');
    }

    if (data.remaining_days === undefined || data.remaining_days === null) {
      errors.push('Remaining days is required');
    }

    if (data.remaining_days < 0) {
      errors.push('Remaining days cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateEmployeeLeaveApplication(data: {
    user_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.user_id) {
      errors.push('Employee selection is required');
    }

    if (!data.leave_type_id) {
      errors.push('Leave type is required');
    }

    if (!data.start_date) {
      errors.push('Start date is required');
    }

    if (!data.end_date) {
      errors.push('End date is required');
    }

    if (!data.reason || data.reason.trim().length === 0) {
      errors.push('Reason is required');
    }

    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      
      if (end < start) {
        errors.push('End date cannot be before start date');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
