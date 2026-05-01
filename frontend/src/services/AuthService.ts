import { authAPI, setToken, setStoredUser, setSessionId, removeToken, removeStoredUser, removeSessionId } from '@/utils/api';
import { User } from '@/models/User';

export class AuthService {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random()}`;
  }

  static storeAuthData(token: string, user: User, sessionId: string): void {
    setToken(token);
    setStoredUser(user);
    setSessionId(sessionId);
    
    // Also store in cookies for middleware
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
      document.cookie = `nexuspulse_token=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `nexuspulse_user=${encodeURIComponent(JSON.stringify(user))}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `nexuspulse_session_id=${encodeURIComponent(sessionId)}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }

  static getRedirectPath(roles: string[]): string {
    const dashboardRoutes: { [key: string]: string } = {
      ADMIN: '/dashboard/admin',
      HR: '/dashboard/hr',
      EMPLOYEE: '/dashboard/employee',
    };

    for (const role of roles) {
      if (dashboardRoutes[role]) {
        return dashboardRoutes[role];
      }
    }

    return '/dashboard/employee';
  }

  static async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.access_token && response.user) {
        const sessionId = this.generateSessionId();
        this.storeAuthData(response.access_token, response.user, sessionId);
        
        return { success: true, user: response.user };
      }
      
      return { success: false, error: 'Invalid response from server' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  }

  static async logout(): Promise<void> {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      removeToken();
      removeStoredUser();
      removeSessionId();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }

  static redirectToDashboard(role: string): void {
    if (typeof window === 'undefined') return;
    
    const route = this.getRedirectPath([role]);
    window.location.href = route;
  }
}
