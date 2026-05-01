// Role definitions
export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR: 'HR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role groups - using satisfies for type safety while keeping mutability
export const ROLE_GROUPS = {
  ALL: ['EMPLOYEE', 'HR', 'ADMIN'],
  EMPLOYEE_ONLY: ['EMPLOYEE'],
  HR_ONLY: ['HR'],
  ADMIN_ONLY: ['ADMIN'],
  HR_AND_ADMIN: ['HR', 'ADMIN'],
  EMPLOYEE_AND_HR: ['EMPLOYEE', 'HR'],
} satisfies Record<string, UserRole[]>;

export const APP_CONSTANTS = {
  CACHE_TTL: {
    SHORT: 30000,    // 30 seconds
    MEDIUM: 60000,   // 1 minute
    LONG: 300000,    // 5 minutes
  },
  
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    RETRYABLE_STATUSES: [408, 429, 500, 502, 503, 504],
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 10,
    MAX_PER_PAGE: 100,
  },
  
  VALIDATION: {
    MIN_REASON_LENGTH: 5,
    MAX_REASON_LENGTH: 500,
    MIN_PASSWORD_LENGTH: 8,
  },
  
  LEAVE_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  } as const,
  
  LEAVE_DURATION: {
    FULL_DAY: 'FULL_DAY',
    FIRST_HALF: 'FIRST_HALF',
    SECOND_HALF: 'SECOND_HALF',
  } as const,
};

export type LeaveStatus = typeof APP_CONSTANTS.LEAVE_STATUS[keyof typeof APP_CONSTANTS.LEAVE_STATUS];
export type LeaveDuration = typeof APP_CONSTANTS.LEAVE_DURATION[keyof typeof APP_CONSTANTS.LEAVE_DURATION];
