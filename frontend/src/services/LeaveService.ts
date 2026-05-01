import { LeaveBalance, LeaveStats } from '@/models/Leave';
import { Validator } from '@/utils/validator';
import { InputSanitizer } from '@/utils/inputSanitizer';

export class LeaveService {
  static calculateRemainingDays(balance: LeaveBalance): number {
    return balance.total_quota - balance.used_days;
  }

  static calculateUsagePercentage(balance: LeaveBalance): number {
    if (balance.total_quota === 0) return 0;
    return Math.round((balance.used_days / balance.total_quota) * 100);
  }

  static isLeaveDateValid(startDate: string, endDate: string): { valid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return { valid: false, error: 'Start date cannot be in the past' };
    }

    if (end < start) {
      return { valid: false, error: 'End date cannot be before start date' };
    }

    return { valid: true };
  }

  static formatLeaveDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  static getStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  }

  static calculateTotalQuota(balances: LeaveBalance[]): number {
    return balances.reduce((sum, balance) => sum + balance.total_quota, 0);
  }

  static calculateTotalUsed(balances: LeaveBalance[]): number {
    return balances.reduce((sum, balance) => sum + balance.used_days, 0);
  }

  static calculateTotalRemaining(balances: LeaveBalance[]): number {
    return balances.reduce((sum, balance) => sum + balance.remaining_days, 0);
  }

  static validateLeaveApplication(data: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Validator.isRequired(data.leave_type_id)) {
      errors.push('Please select a leave type');
    }

    if (!Validator.isRequired(data.start_date)) {
      errors.push('Please select a start date');
    }

    if (!Validator.isRequired(data.end_date)) {
      errors.push('Please select an end date');
    }

    if (!Validator.isRequired(data.reason) || !Validator.isMinLength(data.reason.trim(), 5)) {
      errors.push('Please provide a reason (minimum 5 characters)');
    }

    if (data.start_date && data.end_date) {
      if (!Validator.isValidDate(data.start_date)) {
        errors.push('Invalid start date');
      }
      if (!Validator.isValidDate(data.end_date)) {
        errors.push('Invalid end date');
      }
      if (Validator.isDateBefore(data.end_date, data.start_date)) {
        errors.push('End date cannot be before start date');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static sanitizeLeaveData(data: any): any {
    return InputSanitizer.sanitizeObject(data);
  }

  static formatDate(date: Date): string {
    // Create a new date at noon to avoid timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static calculateWorkingDays(start: Date, end: Date, holidays: any[], leaveDuration: string = 'FULL_DAY'): number {
    // For half-day leaves, return 0.5
    if (leaveDuration === 'FIRST_HALF' || leaveDuration === 'SECOND_HALF') {
      const day = start.getDay();
      const dateStr = this.formatDate(start);
      const holidayDates = new Set(holidays.map(h => h.date));
      
      // Check if it's a working day
      if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
        return 0.5;
      }
      return 0;
    }
    
    // Full day calculation
    let count = 0;
    const current = new Date(start);
    const holidayDates = new Set(holidays.map(h => h.date));
    
    while (current <= end) {
      const day = current.getDay();
      const dateStr = this.formatDate(current);
      
      // Skip weekends and holidays
      if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  static isDateDisabled(date: Date, holidays: any[], existingLeaves: any[]): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Weekend
    
    const dateStr = this.formatDate(date);
    if (holidays.some(h => h.date === dateStr)) return true; // Holiday
    
    // Check existing leaves
    return existingLeaves.some(leave => {
      return dateStr >= leave.start_date && dateStr <= leave.end_date;
    });
  }

  static checkBalanceSufficiency(leaveType: string, days: number, balances: LeaveBalance[]): string {
    const balance = balances.find(b => b.leave_type === leaveType);
    if (!balance) return '';
    
    if (days > balance.remaining_days) {
      return `Insufficient balance. You have ${balance.remaining_days} days remaining but requesting ${days} days.`;
    }
    return '';
  }
}
