export class Validator {
  static isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isMinLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static isMaxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0;
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  static isDateAfter(date1: string, date2: string): boolean {
    return new Date(date1) > new Date(date2);
  }

  static isDateBefore(date1: string, date2: string): boolean {
    return new Date(date1) < new Date(date2);
  }

  static validate(
    value: any,
    rules: Array<{ rule: (val: any) => boolean; message: string }>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const { rule, message } of rules) {
      if (!rule(value)) {
        errors.push(message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
