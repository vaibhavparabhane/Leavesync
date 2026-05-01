export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  
  // Session management
  SESSION: {
    TIMEOUT_MINUTES: 60,
    REFRESH_THRESHOLD_MINUTES: 10,
    MAX_CONCURRENT_SESSIONS: 1,
  },
  
  // Rate limiting (client-side tracking)
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
  },
  
  // Input validation
  INPUT: {
    MAX_STRING_LENGTH: 1000,
    MAX_REASON_LENGTH: 500,
    ALLOWED_FILE_TYPES: ['csv', 'xlsx', 'pdf'],
    MAX_FILE_SIZE_MB: 10,
  },
  
  // Security headers (for reference)
  HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
} as const;

export class PasswordValidator {
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD;

    if (password.length < config.MIN_LENGTH) {
      errors.push(`Password must be at least ${config.MIN_LENGTH} characters`);
    }

    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.REQUIRE_NUMBER && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
