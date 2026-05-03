'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { CSRFManager } from './csrfManager';

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = 'leavesync_token';
const USER_KEY = 'leavesync_user';
const SESSION_ID_KEY = 'leavesync_session_id';

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
    // Generate and store CSRF token
    const csrfToken = CSRFManager.generateToken();
    CSRFManager.setToken(csrfToken);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
    CSRFManager.removeToken();
  }
};

// Session ID management for single-tab login
export const getSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_ID_KEY);
};

export const setSessionId = (sessionId: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
};

export const removeSessionId = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY);
  }
};

// User management
import { User } from '@/models/User';
export type { User };

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = sessionStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const removeStoredUser = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(USER_KEY);
  }
};

// Check if current session is valid (for single-tab login)
export const isSessionValid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = getToken();
  const sessionId = getSessionId();
  const storedUser = getStoredUser();
  return !!(token && sessionId && storedUser);
};

// Request interceptor to add JWT token and CSRF token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      const csrfToken = CSRFManager.getToken();
      const sessionId = getSessionId();
      
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      if (sessionId && config.headers) {
        config.headers['X-Session-ID'] = sessionId;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      removeStoredUser();
      removeSessionId();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/forbidden';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // Backend returns data wrapped in 'data' object
    return response.data.data || response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data.data || response.data;
  },
};

// Leave API
export const leaveAPI = {
  getMyLeaves: async (page: number = 1, perPage: number = 10, status?: string, sortBy?: string, sortOrder?: string) => {
    const params: any = { page, per_page: perPage };
    if (status) params.status = status;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    const response = await api.get('/leaves/my', { params });
    return response.data.data || response.data;
  },
  
  applyLeave: async (leaveData: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
  }) => {
    const response = await api.post('/leaves/apply', leaveData);
    return response.data.data || response.data;
  },
  
  getAllLeaves: async (page: number = 1, perPage: number = 10, status?: string, sortBy?: string, sortOrder?: string, search?: string) => {
    const params: any = { page, per_page: perPage };
    if (status) params.status = status;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    if (search) params.search = search;
    const response = await api.get('/leaves/all', { params });
    return response.data.data || response.data;
  },
  
  approveLeave: async (leaveId: string, forceApprove: boolean = false) => {
    const response = await api.post(`/leaves/${leaveId}/approve`, { force_approve: forceApprove });
    return response.data.data || response.data;
  },
  
  rejectLeave: async (leaveId: string, rejectionReason?: string) => {
    const response = await api.post(`/leaves/${leaveId}/reject`, 
      rejectionReason ? { rejection_reason: rejectionReason } : {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.data || response.data;
  },

  getMyStats: async () => {
    const response = await api.get('/leaves/my/stats');
    return response.data.data || response.data;
  },

  getMyBalance: async () => {
    const response = await api.get('/leaves/my/balance');
    return response.data.data || response.data;
  },

  getLeaveTypes: async () => {
    const response = await api.get('/leaves/types');
    return response.data.data || response.data;
  },

  getMyHolidays: async () => {
    const response = await api.get('/holidays/my');
    return response.data.data || response.data;
  },

  getPendingLeaves: async (page: number = 1, perPage: number = 10, sortBy?: string, sortOrder?: string, search?: string) => {
    const params: any = { page, per_page: perPage };
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    if (search) params.search = search;
    const response = await api.get('/leaves/pending', { params });
    return response.data.data || response.data;
  },

  requestCancellation: async (leaveId: string, cancellationReason?: string) => {
    const response = await api.post(`/leaves/${leaveId}/request-cancellation`, 
      cancellationReason ? { cancellation_reason: cancellationReason } : {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.data || response.data;
  },

  approveCancellation: async (leaveId: string) => {
    const response = await api.post(`/leaves/${leaveId}/approve-cancellation`);
    return response.data.data || response.data;
  },

  rejectCancellation: async (leaveId: string) => {
    const response = await api.post(`/leaves/${leaveId}/reject-cancellation`);
    return response.data.data || response.data;
  },
};

// HR API
export const hrAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data || response.data;
  },
  
  getLeaveTypes: async () => {
    const response = await api.get('/leaves/types');
    return response.data.data || response.data;
  },

  getAllLeaves: async (page: number = 1, perPage: number = 10) => {
    const response = await api.get('/leaves/all', { params: { page, per_page: perPage } });
    return response.data.data || response.data;
  },

  getEmployees: async (page: number = 1, perPage: number = 10, sortBy?: string, sortOrder?: string) => {
    const params: any = { page, per_page: perPage };
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    const response = await api.get('/employees', { params });
    return response.data.data || response.data;
  },

  getTeamLeaves: async (page: number = 1, perPage: number = 10, status?: string, sortBy?: string, sortOrder?: string, search?: string) => {
    const params: any = { page, per_page: perPage };
    if (status) params.status = status;
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    if (search) params.search = search;
    const response = await api.get('/employees/leaves', { params });
    return response.data.data || response.data;
  },

  getEmployeeLedger: async (userId: string) => {
    const response = await api.get(`/employees/${userId}/balance`);
    return response.data.data || response.data;
  },

  updateEmployeeLedger: async (userId: string, data: {
    leave_type_id: string;
    remaining_days: number;
  }) => {
    const response = await api.post(`/employees/${userId}/balance`, data);
    return response.data.data || response.data;
  },

  applyLeaveForEmployee: async (leaveData: {
    user_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    leave_duration?: string;
  }) => {
    const response = await api.post('/leaves/apply', leaveData);
    return response.data.data || response.data;
  },

  // Holiday API
  getHolidays: async (page: number = 1, perPage: number = 10) => {
    const response = await api.get('/holidays', { params: { page, per_page: perPage } });
    return response.data.data || response.data;
  },

  createHoliday: async (holidayData: {
    name: string;
    date: string;
    description?: string;
    location: string;
  }) => {
    const response = await api.post('/holidays', holidayData);
    return response.data.data || response.data;
  },

  deleteHoliday: async (holidayId: string) => {
    const response = await api.delete(`/holidays/${holidayId}`);
    return response.data.data || response.data;
  },

  updateHoliday: async (holidayId: string, holidayData: {
    name: string;
    date: string;
    description?: string;
    location: string;
  }) => {
    const response = await api.put(`/holidays/${holidayId}`, holidayData);
    return response.data.data || response.data;
  },

  getLocations: async () => {
    const response = await api.get('/system/locations');
    return response.data.data || response.data;
  },

  // Leave Type Management
  getAllLeaveTypes: async (sortBy?: string, sortOrder?: string) => {
    const params: any = {};
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    const response = await api.get('/leave-types', { params });
    return response.data.data || response.data;
  },

  createLeaveType: async (data: { name: string; yearly_quota: number }) => {
    const response = await api.post('/leave-types', data);
    return response.data.data || response.data;
  },

  updateLeaveType: async (leaveTypeId: string, data: { name?: string; yearly_quota?: number; is_active?: boolean }) => {
    const response = await api.put(`/leave-types/${leaveTypeId}`, data);
    return response.data.data || response.data;
  },

  deleteLeaveType: async (leaveTypeId: string) => {
    const response = await api.delete(`/leave-types/${leaveTypeId}`);
    return response.data.data || response.data;
  },

  // Get holidays for employee's location
  getMyHolidays: async (location?: string) => {
    const params = location ? { location } : {};
    const response = await api.get('/holidays', { params });
    return response.data.data || response.data;
  },

  // Employee Holiday Assignment API
  assignHolidayToEmployees: async (data: {
    employee_ids: string[];
    holiday_id: string;
  }) => {
    const response = await api.post('/holidays/assignments', data);
    return response.data.data || response.data;
  },

  getEmployeeHolidays: async (employeeId: string) => {
    const response = await api.get(`/holidays/assignments/${employeeId}`);
    return response.data.data || response.data;
  },

  removeHolidayAssignment: async (holidayId: string, employeeId?: string) => {
    const response = await api.delete(`/holidays/assignments/${holidayId}`, {
      data: employeeId ? { employee_id: employeeId } : {},
    });
    return response.data.data || response.data;
  },
};
