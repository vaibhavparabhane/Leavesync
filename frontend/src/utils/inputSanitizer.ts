export class InputSanitizer {
  
  static sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  static sanitizeEmail(email: string): string {
    if (!email) return '';
    
    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  static sanitizeNumber(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
  }

  static sanitizeDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : dateString;
  }

  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value) as any;
      } else if (typeof value === 'number') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}
