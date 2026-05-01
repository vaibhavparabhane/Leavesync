const CSRF_TOKEN_KEY = 'nexuspulse_csrf_token';

export class CSRFManager {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    }
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
    }
  }

  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
