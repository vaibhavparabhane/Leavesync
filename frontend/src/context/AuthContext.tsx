'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getToken, 
  removeToken, 
  getStoredUser, 
  removeStoredUser,
  removeSessionId,
  getSessionId
} from '@/utils/api';
import { User } from '@/models/User';
import { AuthService } from '@/services/AuthService';

// Cookie management helpers for middleware
const setCookie = (name: string, value: string, days = 7): void => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const removeCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Tab ID key for sessionStorage (unique per tab)
const TAB_ID_KEY = 'leavesync_tab_id';
const ACTIVE_TAB_KEY = 'leavesync_active_tab';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getTabId = (): string => {
  if (typeof window === 'undefined') return '';
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [tabId] = useState<string>(() => getTabId());
  const router = useRouter();

  const handleLogout = useCallback((clearActiveTab = true) => {
    removeToken();
    removeStoredUser();
    removeSessionId();
    removeCookie('leavesync_token');
    removeCookie('leavesync_user');
    removeCookie('leavesync_session_id');
    if (clearActiveTab) {
      localStorage.removeItem(ACTIVE_TAB_KEY);
    }
    setCurrentSessionId(null);
    setUser(null);
    router.push('/');
  }, [router]);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    const sessionId = getSessionId();
    
    if (token && storedUser && sessionId) {
      setUser(storedUser);
      setCurrentSessionId(sessionId);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing session data first
      removeToken();
      removeStoredUser();
      removeSessionId();
      removeCookie('leavesync_token');
      removeCookie('leavesync_user');
      removeCookie('leavesync_session_id');
      
      const result = await AuthService.login(email, password);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Store token in cookies for middleware
      const token = result.user ? sessionStorage.getItem('leavesync_token') : null;
      if (token) {
        setCookie('leavesync_token', token, 7);
        setCookie('leavesync_user', JSON.stringify(result.user), 7);
      }
      
      const redirectPath = AuthService.getRedirectPath(result.user.roles || []);
      
      localStorage.setItem(ACTIVE_TAB_KEY, tabId);
      
      // Force full page reload to ensure auth state is fresh
      window.location.href = redirectPath;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
  };

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      sessionStorage.setItem('leavesync_user', JSON.stringify(newUser));
      setCookie('leavesync_user', JSON.stringify(newUser), 7);
      return newUser;
    });
  }, []);

  // Multi-tab support: Allow concurrent logins in different tabs
  // Removed single-tab enforcement to allow testing different roles simultaneously


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
