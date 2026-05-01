// Central Color Theme Configuration
export const COLORS = {
  // Status Colors
  STATUS: {
    PENDING: {
      main: '#f59e0b',
      background: '#fef3c7',
      border: '#f59e0b'
    },
    APPROVED: {
      main: '#059669',
      background: '#d1fae5',
      border: '#059669'
    },
    REJECTED: {
      main: '#dc2626',
      background: '#fee2e2',
      border: '#dc2626'
    },
    CANCELLED: {
      main: '#6b7280',
      background: '#f3f4f6',
      border: '#6b7280'
    }
  },
  
  // Action Button Colors
  ACTIONS: {
    APPROVE: {
      main: '#059669',
      hover: '#047857',
      background: '#ecfdf5'
    },
    REJECT: {
      main: '#dc2626',
      hover: '#b91c1c',
      background: '#fef2f2'
    },
    EDIT: {
      main: '#2563eb',
      hover: '#1d4ed8',
      background: '#eff6ff'
    },
    DELETE: {
      main: '#dc2626',
      hover: '#b91c1c',
      background: '#fef2f2'
    },
    CANCEL: {
      main: '#6b7280',
      hover: '#4b5563',
      background: '#f9fafb'
    }
  },
  
  // Primary Brand Colors
  PRIMARY: {
    main: '#1e3a5f',
    light: '#2c5282',
    dark: '#1a202c',
    background: '#f0f4f8'
  },
  
  // Secondary Colors
  SECONDARY: {
    main: '#4a5568',
    light: '#718096',
    dark: '#2d3748'
  }
} as const;