// API Configuration and Constants
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  LEAVES: {
    TYPES: '/leaves/types',
    APPLY: '/leaves/apply',
    MY: '/leaves/my',
    MY_BALANCE: '/leaves/my/balance',
    MY_STATS: '/leaves/my/stats',
    ALL: '/leaves/all',
    PENDING: '/leaves/pending',
    APPROVE: (id: string) => `/leaves/${id}/approve`,
    REJECT: (id: string) => `/leaves/${id}/reject`,
  },
  HR: {
    DASHBOARD: '/hr/dashboard',
    EMPLOYEES: '/hr/employees',
    TEAM_LEAVES: '/hr/team-leaves',
    EMPLOYEE_LEDGER: (userId: string) => `/hr/employee/${userId}/ledger`,
    HOLIDAYS: '/hr/holidays',
    LOCATIONS: '/hr/locations',
    LEAVE_TYPES: '/hr/leave-types',
    EMPLOYEE_HOLIDAYS: '/hr/employee-holidays',
    EMPLOYEE_HOLIDAYS_BY_ID: (id: string) => `/hr/employee-holidays/${id}`,
  },
} as const;
