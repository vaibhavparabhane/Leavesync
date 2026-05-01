// Leave Models
export interface LeaveType {
  id: string;
  name: string;
  yearly_quota?: number;
  is_active?: boolean;
}

export interface LeaveRecord {
  leave_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  start_date: string;
  end_date: string;
  total_days: number;
  leave_duration?: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  reason?: string;
  rejection_reason?: string;
  cancellation_requested?: boolean;
  cancellation_reason?: string;
  leave_type?: string;
  employee_name?: string;
  employee_id?: string;
  employee_email?: string;
}

export interface LeaveBalance {
  leave_type_id: string;
  leave_type: string;
  total_quota: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveStats {
  total_quota: number;
  leaves_taken: number;
  leave_balance: number;
  pending_requests: number;
}

export interface LeaveApplicationData {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  leave_duration?: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  user_id?: string;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
}
